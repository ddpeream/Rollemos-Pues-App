export const TRACKING_LIVE = Object.freeze({
  ACTIVE_FUNCTION_NAME: 'get_active_tracking_live',
  CHANNEL_NAME: 'tracking-live',
  HEARTBEAT_INTERVAL_MS: 15 * 1000,
  MAX_PATH_POINTS: 120,
  MIN_PUBLISH_DISTANCE_METERS: 5,
  MIN_PUBLISH_INTERVAL_MS: 3 * 1000,
  PRUNE_INTERVAL_MS: 15 * 1000,
  STALE_TIMEOUT_MS: 2 * 60 * 1000,
  TABLE_NAME: 'tracking_live',
});

export const TRACKING_LIVE_ERROR = Object.freeze({
  BACKGROUND_PUBLISH_FAILED: 'tracking_live_background_publish_failed',
  FETCH_FAILED: 'tracking_live_fetch_failed',
  INACTIVE_FAILED: 'tracking_live_inactive_failed',
  PROFILE_FETCH_FAILED: 'tracking_live_profile_fetch_failed',
  PUBLISH_FAILED: 'tracking_live_publish_failed',
  SUBSCRIPTION_FAILED: 'tracking_live_subscription_failed',
});

export const TRACKING_LIVE_PUBLISH_REASON = Object.freeze({
  INVALID_COORDINATE: 'invalid_coordinate',
  MISSING_USER: 'missing_user',
  OUT_OF_ORDER: 'out_of_order',
  PRIVATE: 'private',
  PUBLISHED: 'published',
  THROTTLED: 'throttled',
});

export const TRACKING_LIVE_SUBSCRIPTION_STATUS = Object.freeze({
  CLOSED: 'CLOSED',
  CONNECTING: 'CONNECTING',
  ERROR: 'CHANNEL_ERROR',
  IDLE: 'IDLE',
  SUBSCRIBED: 'SUBSCRIBED',
  TIMED_OUT: 'TIMED_OUT',
});

/** @type {Readonly<import('../contracts/trackingLive.contracts').TrackingLiveConnectionState>} */
export const TRACKING_LIVE_CONNECTION_INITIAL_STATE = Object.freeze({
  initialFetchCount: 0,
  lastEventAt: null,
  lastSynchronizedAt: null,
  status: TRACKING_LIVE_SUBSCRIPTION_STATUS.IDLE,
});
