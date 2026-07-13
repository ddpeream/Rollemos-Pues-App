export const TRACKING_INITIAL_REGION = {
  latitude: 6.2442,
  longitude: -75.5812,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export const TRACKING_FOCUS_DELTA = {
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export const TRACKING_STATUS = {
  IDLE: 'idle',
  TRACKING: 'tracking',
  PAUSED: 'paused',
};

export const TRACKING_LOADING_STATE = {
  isStarting: false,
  isPausing: false,
  isResuming: false,
  isStopping: false,
};

export const TRACKING_METRICS = {
  avgSpeed: 0,
  calories: 0,
  distance: 0,
  duration: 0,
  maxSpeed: 0,
  speed: 0,
};

export const TRACKING_ROUTE_MIN_DISTANCE_METERS = 2;

export const TRACKING_ROUTE_STORAGE = {
  CHUNK_SIZE: 250,
  INDEX_KEY: '@tracking/routes/index',
  ROUTE_KEY_PREFIX: '@tracking/routes',
  VERSION: 1,
};

export const TRACKING_ROUTE_SAVE_CONDITIONS = {
  MIN_DISTANCE_METERS: 20,
  MIN_DURATION_SECONDS: 10,
  MIN_POINTS: 2,
};

export const TRACKING_SESSION_STORAGE = {
  KEY: '@tracking/session/active',
  VERSION: 1,
};

export const TRACKING_AUTO_STOP = {
  CHECK_INTERVAL_MS: 30000,
  INACTIVITY_TIMEOUT_MS: 5 * 60 * 1000,
  ORPHANED_SESSION_TIMEOUT_MS: 30 * 60 * 1000,
  BROKEN_SESSION_TIMEOUT_MS: 24 * 60 * 60 * 1000,
};

export const TRACKING_AUTO_STOP_ACTION = {
  NONE: 'none',
  AUTO_PAUSE: 'auto_pause',
  CLEAN_SESSION: 'clean_session',
};

export const TRACKING_AUTO_STOP_REASON = {
  INACTIVE_LOCATION: 'inactive_location',
  ORPHANED_SESSION: 'orphaned_session',
  BROKEN_SESSION: 'broken_session',
};

export const TRACKING_LIVE = {
  MAX_PATH_POINTS: 120,
  STALE_TIMEOUT_MS: 2 * 60 * 1000,
};

export const TRACKING_PRIVACY_STORAGE = {
  KEY: '@tracking/privacy/is-live-private',
};
