// @ts-check

import { TRACKING_LIVE } from '../constants/trackingLive.constants';

/** @typedef {import('../contracts/tracking.contracts').TrackingLiveSkater} TrackingLiveSkater */
/** @typedef {import('../contracts/trackingLive.contracts').TrackingLiveState} TrackingLiveState */

/** @param {TrackingLiveSkater} skater */
export const isTrackingLiveSkaterFresh = (skater, now = Date.now()) => {
  const receivedAt = Number(skater?.receivedAt);
  return Number.isFinite(receivedAt)
    && Math.max(0, now - receivedAt) <= TRACKING_LIVE.STALE_TIMEOUT_MS;
};

const appendLivePathCoordinate = (currentPath, coordinate) => {
  const path = Array.isArray(currentPath) ? currentPath : [];
  const lastPoint = path[path.length - 1];

  if (
    lastPoint?.latitude === coordinate.latitude
    && lastPoint?.longitude === coordinate.longitude
  ) {
    return path;
  }

  return [...path, coordinate].slice(-TRACKING_LIVE.MAX_PATH_POINTS);
};

export const synchronizeTrackingLiveState = (
  state,
  { myUserId, now = Date.now(), skaters },
) => {
  const livePaths = {};
  const liveSkaters = (Array.isArray(skaters) ? skaters : []).filter((skater) => (
    skater.userId !== myUserId
    && skater.isActive
    && isTrackingLiveSkaterFresh(skater, now)
  ));

  liveSkaters.forEach((skater) => {
    livePaths[skater.userId] = appendLivePathCoordinate(
      state.livePaths?.[skater.userId],
      skater.coordinate,
    );
  });

  return { livePaths, liveSkaters };
};

export const createInitialTrackingLiveState = ({ myUserId, now, skaters }) => (
  synchronizeTrackingLiveState(
    { livePaths: {}, liveSkaters: [] },
    { myUserId, now, skaters },
  )
);

/**
 * @param {TrackingLiveState} state
 * @param {{change: Object, myUserId: string|null, now?: number}} options
 * @returns {TrackingLiveState}
 */
export const applyTrackingLiveChange = (state, { change, myUserId, now = Date.now() }) => {
  const userId = change?.userId;
  if (!userId) return state;

  const liveSkaters = state.liveSkaters.filter((skater) => skater.userId !== userId);
  const livePaths = { ...state.livePaths };
  const skater = change.skater;

  if (
    !skater
    || userId === myUserId
    || !skater.isActive
    || !isTrackingLiveSkaterFresh(skater, now)
  ) {
    delete livePaths[userId];
    return { livePaths, liveSkaters };
  }

  livePaths[userId] = appendLivePathCoordinate(livePaths[userId], skater.coordinate);
  return { livePaths, liveSkaters: [...liveSkaters, skater] };
};

/** @param {TrackingLiveState} state */
export const pruneTrackingLiveState = (state, now = Date.now()) => {
  const liveSkaters = state.liveSkaters.filter((skater) => (
    skater.isActive && isTrackingLiveSkaterFresh(skater, now)
  ));
  const activeUserIds = new Set(liveSkaters.map((skater) => skater.userId));
  const livePaths = Object.fromEntries(
    Object.entries(state.livePaths).filter(([userId]) => activeUserIds.has(userId)),
  );

  return { livePaths, liveSkaters };
};

/** @param {TrackingLiveState} state */
export const attachTrackingLiveProfile = (state, { profile, userId }) => ({
  livePaths: state.livePaths,
  liveSkaters: state.liveSkaters.map((skater) => (
    skater.userId === userId ? { ...skater, user: profile } : skater
  )),
});
