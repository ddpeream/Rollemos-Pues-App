const isValidCoordinate = (coordinate) => (
  Number.isFinite(coordinate?.latitude) && Number.isFinite(coordinate?.longitude)
);

export const getRoutePreviewCoordinateSegments = (route) => {
  if (Array.isArray(route?.previewSegments) && route.previewSegments.length > 0) {
    return route.previewSegments
      .map((coordinates) => (
        Array.isArray(coordinates) ? coordinates.filter(isValidCoordinate) : []
      ))
      .filter((coordinates) => coordinates.length > 0);
  }

  const fallbackCoordinates = [route?.startCoordinate, route?.endCoordinate]
    .filter(isValidCoordinate);

  return fallbackCoordinates.length > 0 ? [fallbackCoordinates] : [];
};

export const normalizeRoutePreviewPointSegments = (coordinateSegments) => {
  const safeSegments = Array.isArray(coordinateSegments)
    ? coordinateSegments
      .map((coordinates) => coordinates.filter(isValidCoordinate))
      .filter((coordinates) => coordinates.length > 0)
    : [];
  const safeCoordinates = safeSegments.flat();
  if (safeCoordinates.length === 0) return [];

  const latitudes = safeCoordinates.map((coordinate) => coordinate.latitude);
  const longitudes = safeCoordinates.map((coordinate) => coordinate.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const latitudeRange = maxLatitude - minLatitude || 1;
  const longitudeRange = maxLongitude - minLongitude || 1;

  return safeSegments.map((coordinates) => (
    coordinates.map((coordinate) => ({
      left: 10 + ((coordinate.longitude - minLongitude) / longitudeRange) * 80,
      top: 10 + ((maxLatitude - coordinate.latitude) / latitudeRange) * 80,
    }))
  ));
};

export const createRoutePreviewSegments = (pointSegments) => {
  if (!Array.isArray(pointSegments)) return [];

  return pointSegments.flatMap((points, segmentIndex) => {
    if (!Array.isArray(points) || points.length < 2) return [];

    return points.slice(1).map((point, pointIndex) => {
      const previousPoint = points[pointIndex];
      const deltaLeft = point.left - previousPoint.left;
      const deltaTop = point.top - previousPoint.top;
      const length = Math.sqrt((deltaLeft ** 2) + (deltaTop ** 2));
      const angle = Math.atan2(deltaTop, deltaLeft) * (180 / Math.PI);

      return {
        angle,
        key: `${segmentIndex}-${pointIndex}-${previousPoint.left}-${point.left}`,
        left: previousPoint.left + (deltaLeft / 2) - (length / 2),
        length,
        top: previousPoint.top + (deltaTop / 2),
      };
    });
  });
};
