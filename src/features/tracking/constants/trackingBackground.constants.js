export const TRACKING_BACKGROUND = {
  BUFFER_BATCH_SIZE: 250,
  DEFERRED_UPDATES_DISTANCE_METERS: 5,
  DEFERRED_UPDATES_INTERVAL_MS: 5000,
  DISTANCE_INTERVAL_METERS: 1,
  NOTIFICATION_BODY: 'Registrando tu recorrido en segundo plano.',
  NOTIFICATION_TITLE: 'Rollemos Pues',
  TASK_NAME: 'rollemos-tracking-location-v1',
  TIME_INTERVAL_MS: 1000,
};

export const TRACKING_BACKGROUND_RESULT = {
  ALREADY_STARTED: 'already_started',
  NOT_AVAILABLE: 'not_available',
  PERMISSION_DENIED: 'permission_denied',
  STARTED: 'started',
  STOPPED: 'stopped',
};
