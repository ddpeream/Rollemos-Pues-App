import { getDistanceBetweenCoordinates } from './distance.utils';

const metersPerSecondToKilometersPerHour = (metersPerSecond) => metersPerSecond * 3.6;

export const getCoordinateSpeedKmh = (coordinate) => {
  const rawSpeed = Number(coordinate?.speed);
  if (!Number.isFinite(rawSpeed) || rawSpeed < 0) return null;
  return metersPerSecondToKilometersPerHour(rawSpeed);
};

export const getSegmentSpeedKmh = (from, to) => {
  if (!from || !to || !from.timestamp || !to.timestamp) return 0;

  const elapsedSeconds = Math.max(0, (to.timestamp - from.timestamp) / 1000);
  if (elapsedSeconds <= 0) return 0;

  const distanceMeters = getDistanceBetweenCoordinates(from, to);
  return metersPerSecondToKilometersPerHour(distanceMeters / elapsedSeconds);
};

export const getCurrentSpeedKmh = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length === 0) return 0;

  const lastCoordinate = coordinates[coordinates.length - 1];
  const coordinateSpeed = getCoordinateSpeedKmh(lastCoordinate);
  if (coordinateSpeed != null) return coordinateSpeed;

  if (coordinates.length < 2) return 0;
  return getSegmentSpeedKmh(coordinates[coordinates.length - 2], lastCoordinate);
};

export const getMaxSpeedKmh = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length === 0) return 0;

  return coordinates.reduce((maxSpeed, coordinate, index) => {
    const coordinateSpeed = getCoordinateSpeedKmh(coordinate);
    const segmentSpeed = index > 0 ? getSegmentSpeedKmh(coordinates[index - 1], coordinate) : 0;
    return Math.max(maxSpeed, coordinateSpeed ?? segmentSpeed, segmentSpeed);
  }, 0);
};

export const getAverageSpeedKmh = (distanceMeters, durationSeconds) => {
  if (!Number.isFinite(distanceMeters) || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return 0;
  }

  return (distanceMeters / durationSeconds) * 3.6;
};
