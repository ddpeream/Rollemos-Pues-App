import { TRACKING_ROUTE_MIN_DISTANCE_METERS } from '../constants/tracking.constants';
import { getDistanceBetweenCoordinates } from './distance.utils';

const isValidRouteCoordinate = (coordinate) => (
  Number.isFinite(coordinate?.latitude) && Number.isFinite(coordinate?.longitude)
);

export const shouldAppendRouteCoordinate = (
  routeCoordinates,
  nextCoordinate,
  minDistanceMeters = TRACKING_ROUTE_MIN_DISTANCE_METERS,
) => {
  if (!isValidRouteCoordinate(nextCoordinate)) return false;
  if (!Array.isArray(routeCoordinates) || routeCoordinates.length === 0) return true;

  const lastCoordinate = routeCoordinates[routeCoordinates.length - 1];
  if (
    lastCoordinate.latitude === nextCoordinate.latitude &&
    lastCoordinate.longitude === nextCoordinate.longitude
  ) {
    return false;
  }

  return getDistanceBetweenCoordinates(lastCoordinate, nextCoordinate) >= minDistanceMeters;
};
