// @ts-check

import { openDatabaseAsync } from 'expo-sqlite';

import { TRACKING_STATUS } from '../constants/tracking.constants';
import {
  TRACKING_DATABASE,
  TRACKING_STORAGE_ROUTE_STATUS,
} from '../constants/trackingStorage.constants';

const TRACKING_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS tracking_storage_meta (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tracking_routes (
    id TEXT PRIMARY KEY NOT NULL,
    status TEXT NOT NULL CHECK (
      status IN (
        '${TRACKING_STATUS.TRACKING}',
        '${TRACKING_STATUS.PAUSED}',
        '${TRACKING_STORAGE_ROUTE_STATUS.COMPLETED}'
      )
    ),
    is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0, 1)),
    storage_version INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    started_at INTEGER NOT NULL,
    ended_at INTEGER,
    paused_at INTEGER,
    total_paused_ms REAL NOT NULL DEFAULT 0,
    distance REAL NOT NULL DEFAULT 0,
    duration REAL NOT NULL DEFAULT 0,
    speed REAL NOT NULL DEFAULT 0,
    avg_speed REAL NOT NULL DEFAULT 0,
    max_speed REAL NOT NULL DEFAULT 0,
    calories REAL NOT NULL DEFAULT 0,
    points_count INTEGER NOT NULL DEFAULT 0,
    current_coordinate TEXT,
    start_coordinate TEXT,
    end_coordinate TEXT,
    preview_segments TEXT NOT NULL DEFAULT '[]'
  );

  CREATE UNIQUE INDEX IF NOT EXISTS tracking_routes_one_active
    ON tracking_routes(is_active)
    WHERE is_active = 1;

  CREATE INDEX IF NOT EXISTS tracking_routes_status_created
    ON tracking_routes(status, created_at DESC);

  CREATE TABLE IF NOT EXISTS tracking_route_segments (
    route_id TEXT NOT NULL,
    segment_index INTEGER NOT NULL,
    started_at INTEGER NOT NULL,
    ended_at INTEGER,
    points_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (route_id, segment_index),
    FOREIGN KEY (route_id) REFERENCES tracking_routes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tracking_route_points (
    route_id TEXT NOT NULL,
    segment_index INTEGER NOT NULL,
    point_index INTEGER NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    accuracy REAL,
    altitude REAL,
    altitude_accuracy REAL,
    heading REAL NOT NULL DEFAULT 0,
    speed REAL,
    timestamp INTEGER NOT NULL,
    PRIMARY KEY (route_id, segment_index, point_index),
    FOREIGN KEY (route_id, segment_index)
      REFERENCES tracking_route_segments(route_id, segment_index)
      ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS tracking_route_points_route
    ON tracking_route_points(route_id, segment_index, point_index);
`;
const TRACKING_BACKGROUND_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS tracking_background_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_id TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    accuracy REAL,
    altitude REAL,
    altitude_accuracy REAL,
    heading REAL NOT NULL DEFAULT 0,
    speed REAL,
    timestamp INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (route_id) REFERENCES tracking_routes(id) ON DELETE CASCADE,
    UNIQUE (route_id, timestamp, latitude, longitude) ON CONFLICT IGNORE
  );

  CREATE INDEX IF NOT EXISTS tracking_background_points_route
    ON tracking_background_points(route_id, timestamp, id);
`;
const TRACKING_LIVE_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS tracking_live_checkpoints (
    user_id TEXT PRIMARY KEY NOT NULL,
    route_id TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    heading REAL NOT NULL DEFAULT 0,
    speed REAL,
    coordinate_timestamp INTEGER NOT NULL,
    published_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS tracking_live_checkpoints_published
    ON tracking_live_checkpoints(published_at);
`;
const TRACKING_LIVE_DIAGNOSTIC_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS tracking_live_diagnostics (
    user_key TEXT PRIMARY KEY NOT NULL,
    user_id TEXT,
    route_id TEXT,
    attempted_at INTEGER NOT NULL,
    ok INTEGER NOT NULL CHECK (ok IN (0, 1)),
    published INTEGER NOT NULL CHECK (published IN (0, 1)),
    reason TEXT NOT NULL,
    error TEXT
  );

  CREATE INDEX IF NOT EXISTS tracking_live_diagnostics_attempted
    ON tracking_live_diagnostics(attempted_at DESC);
`;

const setDatabaseVersion = (database, version) => (
  database.execAsync(`PRAGMA user_version = ${version}`)
);


let databasePromise = null;

const initializeTrackingDatabase = async () => {
  const database = await openDatabaseAsync(TRACKING_DATABASE.NAME);

  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
  `);

  const versionRow = await database.getFirstAsync('PRAGMA user_version');
  const currentVersion = Number(versionRow?.user_version || 0);

  if (currentVersion > TRACKING_DATABASE.SCHEMA_VERSION) {
    throw new Error('tracking_database_version_unsupported');
  }

  if (currentVersion < 1) {
    await database.execAsync(TRACKING_SCHEMA_SQL);
    await setDatabaseVersion(database, 1);
  }

  if (currentVersion < 2) {
    await database.execAsync(TRACKING_BACKGROUND_SCHEMA_SQL);
    await setDatabaseVersion(database, 2);
  }

  if (currentVersion < 3) {
    await database.execAsync(TRACKING_LIVE_SCHEMA_SQL);
    await setDatabaseVersion(database, 3);
  }

  if (currentVersion < 4) {
    await database.execAsync(TRACKING_LIVE_DIAGNOSTIC_SCHEMA_SQL);
    await setDatabaseVersion(database, 4);
  }

  return database;
};

export const getTrackingDatabase = () => {
  if (!databasePromise) {
    databasePromise = initializeTrackingDatabase().catch((error) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
};
