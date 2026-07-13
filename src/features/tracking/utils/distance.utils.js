export const getDistanceBetweenCoordinates = (from, to) => {
  if (!from || !to) return 0;

  const fromLatitude = Number(from.latitude);
  const fromLongitude = Number(from.longitude);
  const toLatitude = Number(to.latitude);
  const toLongitude = Number(to.longitude);

  if (
    !Number.isFinite(fromLatitude) ||
    !Number.isFinite(fromLongitude) ||
    !Number.isFinite(toLatitude) ||
    !Number.isFinite(toLongitude)
  ) {
    return 0;
  }

  const earthRadiusMeters = 6371000;
  const latitudeDelta = ((toLatitude - fromLatitude) * Math.PI) / 180;
  const longitudeDelta = ((toLongitude - fromLongitude) * Math.PI) / 180;
  const fromLatitudeRadians = (fromLatitude * Math.PI) / 180;
  const toLatitudeRadians = (toLatitude * Math.PI) / 180;

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitudeRadians) *
      Math.cos(toLatitudeRadians) *
      Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

export const getRouteDistance = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return 0;

  return coordinates.reduce((totalDistance, coordinate, index) => {
    if (index === 0) return totalDistance;
    return totalDistance + getDistanceBetweenCoordinates(coordinates[index - 1], coordinate);
  }, 0);
};
