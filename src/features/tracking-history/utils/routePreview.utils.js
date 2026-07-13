const isValidCoordinate = (coordinate) => (
  Number.isFinite(coordinate?.latitude) && Number.isFinite(coordinate?.longitude)
);

export const getRoutePreviewCoordinates = (route) => {
  if (Array.isArray(route?.previewCoordinates) && route.previewCoordinates.length > 0) {
    return route.previewCoordinates.filter(isValidCoordinate);
  }

  return [route?.startCoordinate, route?.endCoordinate].filter(isValidCoordinate);
};

export const normalizeRoutePreviewPoints = (coordinates) => {
  const safeCoordinates = Array.isArray(coordinates)
    ? coordinates.filter(isValidCoordinate)
    : [];

  if (safeCoordinates.length === 0) return [];

  const latitudes = safeCoordinates.map((coordinate) => coordinate.latitude);
  const longitudes = safeCoordinates.map((coordinate) => coordinate.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const latitudeRange = maxLatitude - minLatitude || 1;
  const longitudeRange = maxLongitude - minLongitude || 1;

  return safeCoordinates.map((coordinate) => ({
    left: 10 + ((coordinate.longitude - minLongitude) / longitudeRange) * 80,
    top: 10 + ((maxLatitude - coordinate.latitude) / latitudeRange) * 80,
  }));
};

export const createRoutePreviewSegments = (points) => {
  if (!Array.isArray(points) || points.length < 2) return [];

  return points.slice(1).map((point, index) => {
    const previousPoint = points[index];
    const deltaLeft = point.left - previousPoint.left;
    const deltaTop = point.top - previousPoint.top;
    const length = Math.sqrt((deltaLeft ** 2) + (deltaTop ** 2));
    const angle = Math.atan2(deltaTop, deltaLeft) * (180 / Math.PI);

    return {
      angle,
      key: `${previousPoint.left}-${previousPoint.top}-${point.left}-${point.top}-${index}`,
      left: previousPoint.left + (deltaLeft / 2) - (length / 2),
      length,
      top: previousPoint.top + (deltaTop / 2),
    };
  });
};
