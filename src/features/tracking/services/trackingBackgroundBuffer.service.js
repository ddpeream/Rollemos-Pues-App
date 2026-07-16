// @ts-check

import { TRACKING_BACKGROUND } from '../constants/trackingBackground.constants';
import { TRACKING_STATUS } from '../constants/tracking.constants';
import { normalizeTrackingLocationPosition } from '../normalizers/location.normalizer';
import { getTrackingDatabase } from './trackingDatabase.service';
import {
  enqueueTrackingStorageWrite,
  flushTrackingStorageWrites,
} from './trackingStorageQueue.service';

const BACKGROUND_POINT_INSERT_SQL = `
  INSERT OR IGNORE INTO tracking_background_points (
    route_id, latitude, longitude, accuracy, altitude,
    altitude_accuracy, heading, speed, timestamp, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const mapBackgroundPointRow = (row) => ({
  id: Number(row.id),
  coordinate: {
    accuracy: Number.isFinite(row.accuracy) ? Number(row.accuracy) : null,
    altitude: Number.isFinite(row.altitude) ? Number(row.altitude) : null,
    altitudeAccuracy: Number.isFinite(row.altitude_accuracy)
      ? Number(row.altitude_accuracy)
      : null,
    heading: Number.isFinite(row.heading) ? Number(row.heading) : 0,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    speed: Number.isFinite(row.speed) ? Number(row.speed) : null,
    timestamp: Number(row.timestamp),
  },
});

const getLatestCoordinate = (coordinates) => coordinates.reduce(
  (latest, coordinate) => (
    !latest || coordinate.timestamp > latest.timestamp ? coordinate : latest
  ),
  null,
);

export const appendTrackingBackgroundLocations = async (locations) => {
  const coordinates = (Array.isArray(locations) ? locations : [])
    .map((location) => normalizeTrackingLocationPosition(location))
    .filter(Boolean);

  if (coordinates.length === 0) {
    return { buffered: 0, latestCoordinate: null, routeId: null };
  }

  const database = await getTrackingDatabase();

  return enqueueTrackingStorageWrite(() => (
    database.withExclusiveTransactionAsync(async (transaction) => {
      const activeRoute = await transaction.getFirstAsync(
        `SELECT id
         FROM tracking_routes
         WHERE is_active = 1 AND status = ?
         LIMIT 1`,
        TRACKING_STATUS.TRACKING,
      );

      if (!activeRoute) {
        return { buffered: 0, latestCoordinate: null, routeId: null };
      }

      const statement = await transaction.prepareAsync(BACKGROUND_POINT_INSERT_SQL);

      try {
        for (
          let batchStart = 0;
          batchStart < coordinates.length;
          batchStart += TRACKING_BACKGROUND.BUFFER_BATCH_SIZE
        ) {
          const batch = coordinates.slice(
            batchStart,
            batchStart + TRACKING_BACKGROUND.BUFFER_BATCH_SIZE,
          );

          for (const coordinate of batch) {
            await statement.executeAsync([
              activeRoute.id,
              coordinate.latitude,
              coordinate.longitude,
              coordinate.accuracy,
              coordinate.altitude,
              coordinate.altitudeAccuracy,
              coordinate.heading,
              coordinate.speed,
              coordinate.timestamp,
              Date.now(),
            ]);
          }
        }
      } finally {
        await statement.finalizeAsync();
      }

      return {
        buffered: coordinates.length,
        latestCoordinate: getLatestCoordinate(coordinates),
        routeId: activeRoute.id,
      };
    })
  ));
};

export const loadTrackingBackgroundPoints = async (startedAt) => {
  const database = await getTrackingDatabase();
  await flushTrackingStorageWrites();

  const activeRoute = await database.getFirstAsync(
    `SELECT id
     FROM tracking_routes
     WHERE is_active = 1 AND started_at = ?
     LIMIT 1`,
    startedAt,
  );

  if (!activeRoute) return { points: [], routeId: null };

  const rows = await database.getAllAsync(
    `SELECT *
     FROM tracking_background_points
     WHERE route_id = ?
     ORDER BY timestamp ASC, id ASC`,
    activeRoute.id,
  );

  return {
    points: rows.map(mapBackgroundPointRow),
    routeId: activeRoute.id,
  };
};

export const acknowledgeTrackingBackgroundPoints = async ({ maxId, routeId }) => {
  if (!routeId || !Number.isFinite(maxId)) return;

  const database = await getTrackingDatabase();
  await enqueueTrackingStorageWrite(() => (
    database.runAsync(
      'DELETE FROM tracking_background_points WHERE route_id = ? AND id <= ?',
      routeId,
      maxId,
    )
  ));
};
