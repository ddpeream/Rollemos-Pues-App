// @ts-check

import {
  TRACKING_METRICS,
  TRACKING_METRICS_FILTER,
  TRACKING_STATUS,
} from '../constants/tracking.constants';
import { getCaloriesEstimate } from '../utils/calories.utils';
import {
  getAverageSpeedKmh,
  getCoordinateSpeedKmh,
  getSegmentSpeedKmh,
} from '../utils/speed.utils';
import {
  getRouteDistanceFromSegments,
  getRouteMaxSpeedFromSegments,
} from './trackingRoute.logic';

const toNonNegativeNumber = (value) => (
  Number.isFinite(value) && Number(value) >= 0 ? Number(value) : 0
);

const normalizeMovingSpeed = (speed) => {
  const safeSpeed = toNonNegativeNumber(speed);
  return safeSpeed < TRACKING_METRICS_FILTER.MIN_MOVING_SPEED_KMH ? 0 : safeSpeed;
};

export const getActiveDurationSeconds = ({
  now = Date.now(),
  pausedAt,
  startedAt,
  status,
  totalPausedMs,
}) => {
  if (!Number.isFinite(startedAt)) return 0;

  const currentPausedMs = status === TRACKING_STATUS.PAUSED && Number.isFinite(pausedAt)
    ? Math.max(0, now - pausedAt)
    : 0;

  return Math.max(
    0,
    Math.floor((now - startedAt - toNonNegativeNumber(totalPausedMs) - currentPausedMs) / 1000),
  );
};

export const createLocationMetrics = ({
  currentLocation,
  distanceDelta = 0,
  metrics = TRACKING_METRICS,
  nextCoordinate,
  now = Date.now(),
  routePreviousCoordinate,
  session,
}) => {
  const reportedSpeed = getCoordinateSpeedKmh(nextCoordinate);
  const sampleSpeed = getSegmentSpeedKmh(currentLocation, nextCoordinate);
  const routeSpeed = getSegmentSpeedKmh(routePreviousCoordinate, nextCoordinate);
  const speed = normalizeMovingSpeed(reportedSpeed ?? sampleSpeed);
  const distance = toNonNegativeNumber(metrics.distance) + toNonNegativeNumber(distanceDelta);
  const duration = getActiveDurationSeconds({ ...session, now });
  const avgSpeed = getAverageSpeedKmh(distance, duration);

  return {
    avgSpeed,
    calories: getCaloriesEstimate({ avgSpeedKmh: avgSpeed, durationSeconds: duration }),
    distance,
    duration,
    maxSpeed: Math.max(toNonNegativeNumber(metrics.maxSpeed), speed, routeSpeed),
    speed,
  };
};

export const createTimedMetrics = (state, now = Date.now()) => {
  if (!Number.isFinite(state?.startedAt)) return { ...TRACKING_METRICS };

  const duration = getActiveDurationSeconds({ ...state, now });
  const distance = toNonNegativeNumber(state.metrics?.distance);
  const avgSpeed = getAverageSpeedKmh(distance, duration);
  const isSpeedFresh = (
    state.status === TRACKING_STATUS.TRACKING
    && Number.isFinite(state.currentLocation?.timestamp)
    && now - state.currentLocation.timestamp <= TRACKING_METRICS_FILTER.SPEED_STALE_TIMEOUT_MS
  );

  return {
    ...state.metrics,
    avgSpeed,
    calories: getCaloriesEstimate({ avgSpeedKmh: avgSpeed, durationSeconds: duration }),
    distance,
    duration,
    speed: isSpeedFresh ? normalizeMovingSpeed(state.metrics?.speed) : 0,
  };
};

export const rebuildTrackingMetrics = ({
  metrics,
  now = Date.now(),
  routeSegments,
  session,
}) => {
  const distance = getRouteDistanceFromSegments(routeSegments);
  const duration = getActiveDurationSeconds({ ...session, now });
  const avgSpeed = getAverageSpeedKmh(distance, duration);

  return {
    avgSpeed,
    calories: getCaloriesEstimate({ avgSpeedKmh: avgSpeed, durationSeconds: duration }),
    distance,
    duration,
    maxSpeed: Math.max(
      toNonNegativeNumber(metrics?.maxSpeed),
      getRouteMaxSpeedFromSegments(routeSegments),
    ),
    speed: session.status === TRACKING_STATUS.PAUSED
      ? 0
      : normalizeMovingSpeed(metrics?.speed),
  };
};
