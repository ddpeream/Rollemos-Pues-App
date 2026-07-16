import {
  TRACKING_AUTO_STOP,
  TRACKING_AUTO_STOP_ACTION,
  TRACKING_AUTO_STOP_REASON,
  TRACKING_STATUS,
} from '../constants/tracking.constants';
import {
  closeActiveRouteSegment,
  getLastRouteCoordinate,
} from '../store/trackingRoute.logic';

const getLastActivityAt = (session) => {
  const lastRouteCoordinate = getLastRouteCoordinate(session?.routeSegments);

  return (
    session?.currentLocation?.timestamp
    || lastRouteCoordinate?.timestamp
    || session?.updatedAt
    || session?.startedAt
    || null
  );
};

const createDecision = (action, reason = null) => ({
  action,
  reason,
  checkedAt: Date.now(),
});

export const getTrackingAutoStopDecision = ({
  now = Date.now(),
  session,
} = {}) => {
  if (!session) {
    return createDecision(TRACKING_AUTO_STOP_ACTION.NONE);
  }

  if (!session.startedAt || !Array.isArray(session.routeSegments)) {
    return createDecision(
      TRACKING_AUTO_STOP_ACTION.CLEAN_SESSION,
      TRACKING_AUTO_STOP_REASON.BROKEN_SESSION,
    );
  }

  const sessionAgeMs = now - session.startedAt;
  if (sessionAgeMs >= TRACKING_AUTO_STOP.BROKEN_SESSION_TIMEOUT_MS) {
    return createDecision(
      TRACKING_AUTO_STOP_ACTION.CLEAN_SESSION,
      TRACKING_AUTO_STOP_REASON.BROKEN_SESSION,
    );
  }

  if (session.status !== TRACKING_STATUS.TRACKING) {
    return createDecision(TRACKING_AUTO_STOP_ACTION.NONE);
  }

  const updatedAgeMs = session.updatedAt ? now - session.updatedAt : 0;
  if (updatedAgeMs >= TRACKING_AUTO_STOP.ORPHANED_SESSION_TIMEOUT_MS) {
    return createDecision(
      TRACKING_AUTO_STOP_ACTION.AUTO_PAUSE,
      TRACKING_AUTO_STOP_REASON.ORPHANED_SESSION,
    );
  }

  const lastActivityAt = getLastActivityAt(session);
  const inactiveMs = lastActivityAt ? now - lastActivityAt : 0;
  if (inactiveMs >= TRACKING_AUTO_STOP.INACTIVITY_TIMEOUT_MS) {
    return createDecision(
      TRACKING_AUTO_STOP_ACTION.AUTO_PAUSE,
      TRACKING_AUTO_STOP_REASON.INACTIVE_LOCATION,
    );
  }

  return createDecision(TRACKING_AUTO_STOP_ACTION.NONE);
};

export const createAutoStopEvent = (decision) => ({
  action: decision.action,
  reason: decision.reason,
  createdAt: Date.now(),
  notifyUser: decision.action !== TRACKING_AUTO_STOP_ACTION.NONE,
});

export const createAutoPausedSession = (session, now = Date.now()) => ({
  ...session,
  metrics: {
    ...session.metrics,
    speed: 0,
  },
  pausedAt: session.pausedAt || now,
  routeSegments: closeActiveRouteSegment(session.routeSegments, now),
  status: TRACKING_STATUS.PAUSED,
  updatedAt: now,
});
