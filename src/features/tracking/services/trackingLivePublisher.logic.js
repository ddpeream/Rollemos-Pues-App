import {
  TRACKING_LIVE,
  TRACKING_LIVE_PUBLISH_REASON,
} from '../constants/trackingLive.constants';
import { processTrackingLocationPosition } from '../normalizers/location.normalizer';
import { getDistanceBetweenCoordinates } from '../utils/distance.utils';

const toLocationSample = (coordinate) => ({
  coords: {
    accuracy: coordinate?.accuracy,
    altitude: coordinate?.altitude,
    altitudeAccuracy: coordinate?.altitudeAccuracy,
    heading: coordinate?.heading,
    latitude: coordinate?.latitude,
    longitude: coordinate?.longitude,
    speed: coordinate?.speed,
  },
  timestamp: coordinate?.timestamp,
});

export const processTrackingLivePublishCoordinate = ({
  checkpoint,
  coordinate,
  now = Date.now(),
  routeId,
}) => {
  const shouldValidateJump = Boolean(
    checkpoint
    && checkpoint.routeId === routeId
    && coordinate?.timestamp > checkpoint.coordinate.timestamp,
  );

  return processTrackingLocationPosition({
    now,
    position: toLocationSample(coordinate),
    previousCoordinate: shouldValidateJump ? checkpoint.coordinate : null,
    validateJump: shouldValidateJump,
  }).coordinate;
};

export const getTrackingLivePublishDecision = ({
  checkpoint,
  coordinate,
  force = false,
  now = Date.now(),
  routeId,
  userId,
}) => {
  if (!checkpoint || checkpoint.userId !== userId || checkpoint.routeId !== routeId) {
    return { reason: TRACKING_LIVE_PUBLISH_REASON.PUBLISHED, shouldPublish: true };
  }

  if (coordinate.timestamp < checkpoint.coordinate.timestamp) {
    return { reason: TRACKING_LIVE_PUBLISH_REASON.OUT_OF_ORDER, shouldPublish: false };
  }

  if (force) {
    return { reason: TRACKING_LIVE_PUBLISH_REASON.PUBLISHED, shouldPublish: true };
  }

  const elapsedMs = Math.max(0, now - checkpoint.publishedAt);
  const distanceMeters = getDistanceBetweenCoordinates(
    checkpoint.coordinate,
    coordinate,
  );
  const isHeartbeatDue = elapsedMs >= TRACKING_LIVE.HEARTBEAT_INTERVAL_MS;
  const hasMovedEnough = (
    elapsedMs >= TRACKING_LIVE.MIN_PUBLISH_INTERVAL_MS
    && distanceMeters >= TRACKING_LIVE.MIN_PUBLISH_DISTANCE_METERS
  );

  return {
    reason: isHeartbeatDue || hasMovedEnough
      ? TRACKING_LIVE_PUBLISH_REASON.PUBLISHED
      : TRACKING_LIVE_PUBLISH_REASON.THROTTLED,
    shouldPublish: isHeartbeatDue || hasMovedEnough,
  };
};
