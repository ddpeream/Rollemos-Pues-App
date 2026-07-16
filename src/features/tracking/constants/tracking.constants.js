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

export const TRACKING_LOCATION_STATUS = {
  IDLE: 'idle',
  CHECKING_AVAILABILITY: 'checking_availability',
  REQUESTING_PERMISSION: 'requesting_permission',
  READY: 'ready',
  UNAVAILABLE: 'unavailable',
  ERROR: 'error',
};

export const TRACKING_LOCATION_FILTER = {
  MAX_ACCURACY_METERS: 100,
  MAX_INITIAL_ACCURACY_METERS: 200,
  MAX_FUTURE_SKEW_MS: 10000,
  MAX_PLAUSIBLE_SPEED_MPS: 45,
  MAX_REPORTED_SPEED_MPS: 45,
  MAX_SAMPLE_AGE_MS: 30000,
};

export const TRACKING_LOCATION_REJECTION = {
  NONE: null,
  INVALID_COORDINATE: 'invalid_coordinate',
  FUTURE_TIMESTAMP: 'future_timestamp',
  STALE_TIMESTAMP: 'stale_timestamp',
  OUT_OF_ORDER: 'out_of_order',
  LOW_ACCURACY: 'low_accuracy',
  IMPLAUSIBLE_SPEED: 'implausible_speed',
  IMPOSSIBLE_JUMP: 'impossible_jump',
};

export const TRACKING_ERROR = {
  LOCATION_PERMISSION_DENIED: 'location_permission_denied',
  LOCATION_PERMISSION_FAILED: 'location_permission_failed',
  LOCATION_SERVICES_DISABLED: 'location_services_disabled',
  LOCATION_WATCH_FAILED: 'tracking_watch_failed',
  LOCATION_HYDRATE_FAILED: 'tracking_location_hydrate_failed',
  LOCATION_SAMPLE_INVALID: 'tracking_location_sample_invalid',
  LOCATION_SAMPLE_STALE: 'tracking_location_sample_stale',
  LOCATION_ACCURACY_LOW: 'tracking_location_accuracy_low',
  LOCATION_SPEED_INVALID: 'tracking_location_speed_invalid',
  LOCATION_JUMP_REJECTED: 'tracking_location_jump_rejected',
  SESSION_SAVE_FAILED: 'tracking_session_save_failed',
  RESTORE_FAILED: 'tracking_restore_failed',
  START_FAILED: 'tracking_start_failed',
  RESUME_FAILED: 'tracking_resume_failed',
  ROUTE_SAVE_FAILED: 'route_save_failed',
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

export const TRACKING_METRICS_FILTER = {
  MIN_MOVING_SPEED_KMH: 1,
  SPEED_STALE_TIMEOUT_MS: 5000,
  TICK_INTERVAL_MS: 1000,
};

export const TRACKING_ROUTE_MIN_DISTANCE_METERS = 2;

export const TRACKING_ROUTE_STORAGE = {
  CHUNK_SIZE: 250,
  INDEX_KEY: '@tracking/routes/index',
  LEGACY_VERSION: 1,
  PREVIEW_POINTS: 24,
  ROUTE_KEY_PREFIX: '@tracking/routes',
  VERSION: 2,
};

export const TRACKING_ROUTE_SAVE_CONDITIONS = {
  MIN_DISTANCE_METERS: 20,
  MIN_DURATION_SECONDS: 10,
  MIN_POINTS: 2,
};

export const TRACKING_SESSION_STORAGE = {
  KEY: '@tracking/session/active',
  LEGACY_VERSION: 1,
  VERSION: 2,
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
