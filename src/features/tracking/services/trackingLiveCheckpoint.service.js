// @ts-check

import { getTrackingDatabase } from './trackingDatabase.service';
import { enqueueTrackingStorageWrite } from './trackingStorageQueue.service';

const mapCheckpointRow = (row) => {
  if (!row) return null;

  return {
    coordinate: {
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: Number(row.heading || 0),
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      speed: Number.isFinite(row.speed) ? Number(row.speed) : null,
      timestamp: Number(row.coordinate_timestamp),
    },
    publishedAt: Number(row.published_at),
    routeId: row.route_id || null,
    userId: row.user_id,
  };
};

export const loadTrackingLiveCheckpoint = async (userId) => {
  if (!userId) return null;

  const database = await getTrackingDatabase();
  const row = await database.getFirstAsync(
    'SELECT * FROM tracking_live_checkpoints WHERE user_id = ? LIMIT 1',
    userId,
  );

  return mapCheckpointRow(row);
};

export const saveTrackingLiveCheckpoint = async ({
  coordinate,
  publishedAt,
  routeId,
  userId,
}) => {
  const database = await getTrackingDatabase();

  return enqueueTrackingStorageWrite(() => database.runAsync(
    `INSERT INTO tracking_live_checkpoints (
       user_id, route_id, latitude, longitude, heading, speed,
       coordinate_timestamp, published_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       route_id = excluded.route_id,
       latitude = excluded.latitude,
       longitude = excluded.longitude,
       heading = excluded.heading,
       speed = excluded.speed,
       coordinate_timestamp = excluded.coordinate_timestamp,
       published_at = excluded.published_at`,
    userId,
    routeId,
    coordinate.latitude,
    coordinate.longitude,
    coordinate.heading,
    coordinate.speed,
    coordinate.timestamp,
    publishedAt,
  ));
};

export const clearTrackingLiveCheckpoint = async (userId) => {
  if (!userId) return;

  const database = await getTrackingDatabase();
  await enqueueTrackingStorageWrite(() => database.runAsync(
    'DELETE FROM tracking_live_checkpoints WHERE user_id = ?',
    userId,
  ));
};
