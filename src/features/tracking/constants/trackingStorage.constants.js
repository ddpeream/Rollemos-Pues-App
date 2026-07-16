export const TRACKING_DATABASE = {
  BATCH_SIZE: 250,
  NAME: 'tracking.db',
  SCHEMA_VERSION: 3,
};

export const TRACKING_ROUTE_STORAGE = {
  CHUNK_SIZE: 250,
  INDEX_KEY: '@tracking/routes/index',
  LEGACY_VERSION: 1,
  PREVIEW_POINTS: 24,
  ROUTE_KEY_PREFIX: '@tracking/routes',
  VERSION: 2,
};

export const TRACKING_SESSION_STORAGE = {
  KEY: '@tracking/session/active',
  LEGACY_VERSION: 1,
  VERSION: 2,
};

export const TRACKING_STORAGE_META = {
  LEGACY_MIGRATION_KEY: 'legacy_async_storage_migrated_v1',
  LEGACY_MIGRATION_VALUE: 'complete',
};

export const TRACKING_STORAGE_ROUTE_STATUS = {
  COMPLETED: 'completed',
};
