// @ts-check

import {
  TRACKING_ERROR,
  TRACKING_LOCATION_STATUS,
  TRACKING_METRICS,
  TRACKING_STATUS,
} from '../constants/tracking.constants';
import { hasValidTrackingCoordinates } from '../normalizers/location.normalizer';
import {
  createLocationMetrics,
  createTimedMetrics,
  rebuildTrackingMetrics,
} from './trackingMetrics.logic';
import {
  appendRouteCoordinate,
  closeActiveRouteSegment,
  createRouteSegment,
  getLastRouteCoordinate,
  openRouteSegment,
} from './trackingRoute.logic';

const RESTORABLE_STATUSES = new Set([
  TRACKING_STATUS.TRACKING,
  TRACKING_STATUS.PAUSED,
]);

const createInitialMetrics = () => ({ ...TRACKING_METRICS });

const toNonNegativeNumber = (value) => (
  Number.isFinite(value) && Number(value) >= 0 ? Number(value) : 0
);

const withTimestamp = (coordinate, now = Date.now()) => ({
  ...coordinate,
  timestamp: Number.isFinite(coordinate?.timestamp)
    ? Number(coordinate.timestamp)
    : now,
});

const normalizeRestoredSegments = (session, now) => {
  if (!Array.isArray(session?.routeSegments)) return [];

  const routeSegments = session.routeSegments.flatMap((segment) => {
    if (!Array.isArray(segment?.coordinates)) return [];

    const coordinates = segment.coordinates.filter(hasValidTrackingCoordinates);
    if (coordinates.length === 0) return [];

    return [{
      coordinates,
      endedAt: Number.isFinite(segment.endedAt) ? Number(segment.endedAt) : null,
      startedAt: Number.isFinite(segment.startedAt)
        ? Number(segment.startedAt)
        : coordinates[0].timestamp,
    }];
  });

  if (
    routeSegments.length === 0
    || routeSegments.slice(0, -1).some((segment) => segment.endedAt === null)
  ) {
    return [];
  }

  const lastSegment = routeSegments[routeSegments.length - 1];
  if (session.status === TRACKING_STATUS.TRACKING && lastSegment.endedAt !== null) {
    return [];
  }

  return session.status === TRACKING_STATUS.PAUSED
    ? closeActiveRouteSegment(routeSegments, session.pausedAt || now)
    : routeSegments;
};

export const createAcceptedLocationPatch = (
  state,
  coordinate,
  now = Date.now(),
) => {
  if (!hasValidTrackingCoordinates(coordinate)) return null;

  const acceptedCoordinate = withTimestamp(coordinate, now);
  const routeUpdate = state.status === TRACKING_STATUS.TRACKING
    ? appendRouteCoordinate(state.routeSegments, acceptedCoordinate)
    : null;
  const shouldUpdateMetrics = state.status === TRACKING_STATUS.TRACKING;

  return {
    currentLocation: acceptedCoordinate,
    error: null,
    locationStatus: TRACKING_LOCATION_STATUS.READY,
    ...(routeUpdate?.appended ? { routeSegments: routeUpdate.routeSegments } : {}),
    ...(shouldUpdateMetrics
      ? {
        metrics: createLocationMetrics({
          currentLocation: state.currentLocation,
          distanceDelta: routeUpdate?.distanceDelta,
          metrics: state.metrics,
          nextCoordinate: acceptedCoordinate,
          now,
          routePreviousCoordinate: routeUpdate?.previousCoordinate,
          session: state,
        }),
      }
      : {}),
  };
};

export const createRejectedLocationPatch = (state, error) => ({
  error: error || TRACKING_ERROR.LOCATION_SAMPLE_INVALID,
  ...(state.currentLocation
    ? {}
    : { locationStatus: TRACKING_LOCATION_STATUS.ERROR }),
});

export const createStartedSessionPatch = (
  state,
  initialLocation,
  now = Date.now(),
) => {
  if (
    state.status !== TRACKING_STATUS.IDLE
    || !hasValidTrackingCoordinates(initialLocation)
  ) {
    return null;
  }

  const startedAt = Number.isFinite(now) ? Number(now) : Date.now();
  const startCoordinate = withTimestamp(initialLocation, startedAt);
  const initialSegment = createRouteSegment(startCoordinate, startedAt);
  if (!initialSegment) return null;

  return {
    autoStopEvent: null,
    currentLocation: startCoordinate,
    error: null,
    metrics: createInitialMetrics(),
    pausedAt: null,
    routeSegments: [initialSegment],
    startFlag: startCoordinate,
    startedAt,
    status: TRACKING_STATUS.TRACKING,
    totalPausedMs: 0,
  };
};

export const createPausedSessionPatch = (state, now = Date.now()) => {
  if (state.status !== TRACKING_STATUS.TRACKING) return null;

  const pausedAt = Number.isFinite(now) ? Number(now) : Date.now();

  return {
    metrics: {
      ...createTimedMetrics(state, pausedAt),
      speed: 0,
    },
    pausedAt,
    routeSegments: closeActiveRouteSegment(state.routeSegments, pausedAt),
    status: TRACKING_STATUS.PAUSED,
  };
};

export const createResumedSessionPatch = (state, now = Date.now()) => {
  if (
    state.status !== TRACKING_STATUS.PAUSED
    || !hasValidTrackingCoordinates(state.currentLocation)
  ) {
    return null;
  }

  const resumedAt = Number.isFinite(now) ? Number(now) : Date.now();
  const pausedAt = Number.isFinite(state.pausedAt)
    ? Number(state.pausedAt)
    : resumedAt;
  const resumeCoordinate = {
    ...state.currentLocation,
    timestamp: resumedAt,
  };
  const routeSegments = openRouteSegment(
    state.routeSegments,
    resumeCoordinate,
    resumedAt,
  );
  if (!routeSegments) return null;

  return {
    autoStopEvent: null,
    currentLocation: resumeCoordinate,
    metrics: {
      ...state.metrics,
      speed: 0,
    },
    pausedAt: null,
    routeSegments,
    status: TRACKING_STATUS.TRACKING,
    totalPausedMs: toNonNegativeNumber(state.totalPausedMs) + Math.max(0, resumedAt - pausedAt),
  };
};

export const createStoppedSessionPatch = (state) => {
  if (state.status === TRACKING_STATUS.IDLE) return null;

  return {
    autoStopEvent: null,
    metrics: createInitialMetrics(),
    pausedAt: null,
    routeSegments: [],
    startFlag: null,
    startedAt: null,
    status: TRACKING_STATUS.IDLE,
    totalPausedMs: 0,
  };
};

export const createRestoredSessionPatch = (session, now = Date.now()) => {
  if (
    !RESTORABLE_STATUSES.has(session?.status)
    || !Number.isFinite(session?.startedAt)
  ) {
    return null;
  }

  const restoredAt = Number.isFinite(now) ? Number(now) : Date.now();
  const routeSegments = normalizeRestoredSegments(session, restoredAt);
  if (routeSegments.length === 0) return null;

  const firstCoordinate = routeSegments[0].coordinates[0];
  const lastCoordinate = getLastRouteCoordinate(routeSegments);
  const currentLocation = hasValidTrackingCoordinates(session.currentLocation)
    ? session.currentLocation
    : lastCoordinate;
  const startFlag = hasValidTrackingCoordinates(session.startFlag)
    ? session.startFlag
    : firstCoordinate;
  const pausedAt = session.status === TRACKING_STATUS.PAUSED
    ? (Number.isFinite(session.pausedAt) ? Number(session.pausedAt) : restoredAt)
    : null;
  const sessionState = {
    currentLocation,
    pausedAt,
    startedAt: Number(session.startedAt),
    status: session.status,
    totalPausedMs: toNonNegativeNumber(session.totalPausedMs),
  };

  return {
    ...sessionState,
    error: null,
    metrics: rebuildTrackingMetrics({
      metrics: session.metrics,
      now: restoredAt,
      routeSegments,
      session: sessionState,
    }),
    routeSegments,
    startFlag,
  };
};
