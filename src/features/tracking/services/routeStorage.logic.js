import { TRACKING_ROUTE_SAVE_CONDITIONS } from '../constants/tracking.constants';
import { TRACKING_ROUTE_STORAGE } from '../constants/trackingStorage.constants';

const sampleCoordinates = (coordinates, maxPoints) => {
  if (coordinates.length <= maxPoints) return coordinates;
  if (maxPoints <= 1) return [coordinates[0]];

  const lastIndex = coordinates.length - 1;
  const step = lastIndex / (maxPoints - 1);

  return Array.from({ length: maxPoints }, (_, index) => (
    coordinates[Math.round(index * step)]
  ));
};

export const createRoutePreviewCoordinateSegments = (routeSegments) => {
  if (!Array.isArray(routeSegments) || routeSegments.length === 0) return [];

  const pointsPerSegment = Math.max(
    2,
    Math.floor(TRACKING_ROUTE_STORAGE.PREVIEW_POINTS / routeSegments.length),
  );

  return routeSegments.map((segment) => (
    sampleCoordinates(segment.coordinates, pointsPerSegment)
  ));
};

export const hydrateRouteSegmentsFromCoordinates = (
  coordinates,
  segmentPointCounts,
) => {
  const counts = Array.isArray(segmentPointCounts) ? segmentPointCounts : [];
  const hasValidCounts = (
    counts.length > 0
    && counts.every((count) => Number.isInteger(count) && count > 0)
    && counts.reduce((total, count) => total + count, 0) === coordinates.length
  );
  const safeCounts = hasValidCounts ? counts : [coordinates.length];
  let offset = 0;

  return safeCounts.flatMap((count) => {
    const segmentCoordinates = coordinates.slice(offset, offset + count);
    offset += count;
    if (segmentCoordinates.length === 0) return [];

    return [{
      coordinates: segmentCoordinates,
      endedAt: segmentCoordinates[segmentCoordinates.length - 1].timestamp,
      startedAt: segmentCoordinates[0].timestamp,
    }];
  });
};

export const getFinalRouteDurationSeconds = ({
  endedAt,
  pausedAt,
  startedAt,
  totalPausedMs,
}) => {
  if (!startedAt || !endedAt) return 0;

  const pendingPausedMs = pausedAt ? endedAt - pausedAt : 0;
  return Math.max(0, Math.floor((endedAt - startedAt - totalPausedMs - pendingPausedMs) / 1000));
};

export const shouldSaveCompletedRoute = ({ distance, duration, pointsCount }) => (
  pointsCount >= TRACKING_ROUTE_SAVE_CONDITIONS.MIN_POINTS
  && distance >= TRACKING_ROUTE_SAVE_CONDITIONS.MIN_DISTANCE_METERS
  && duration >= TRACKING_ROUTE_SAVE_CONDITIONS.MIN_DURATION_SECONDS
);
