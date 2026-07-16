// @ts-check

import {
  TRACKING_DATABASE,
  TRACKING_ROUTE_STORAGE,
  TRACKING_STORAGE_ROUTE_STATUS,
} from '../constants/trackingStorage.constants';
import { getRoutePointCount } from '../store/trackingRoute.logic';
import {
  createTrackingRouteId,
  serializeTrackingCoordinate,
  serializeTrackingPreviewSegments,
} from './trackingStorage.logic';

const ROUTE_UPSERT_SQL = `
  INSERT INTO tracking_routes (
    id, status, is_active, storage_version, created_at, updated_at,
    started_at, ended_at, paused_at, total_paused_ms, distance,
    duration, speed, avg_speed, max_speed, calories, points_count,
    current_coordinate, start_coordinate, end_coordinate, preview_segments
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    status = excluded.status,
    is_active = excluded.is_active,
    storage_version = excluded.storage_version,
    updated_at = excluded.updated_at,
    started_at = excluded.started_at,
    ended_at = excluded.ended_at,
    paused_at = excluded.paused_at,
    total_paused_ms = excluded.total_paused_ms,
    distance = excluded.distance,
    duration = excluded.duration,
    speed = excluded.speed,
    avg_speed = excluded.avg_speed,
    max_speed = excluded.max_speed,
    calories = excluded.calories,
    points_count = excluded.points_count,
    current_coordinate = excluded.current_coordinate,
    start_coordinate = excluded.start_coordinate,
    end_coordinate = excluded.end_coordinate,
    preview_segments = excluded.preview_segments
`;

const POINT_INSERT_SQL = `
  INSERT INTO tracking_route_points (
    route_id, segment_index, point_index, latitude, longitude,
    accuracy, altitude, altitude_accuracy, heading, speed, timestamp
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const getFirstCoordinate = (routeSegments) => (
  routeSegments[0]?.coordinates?.[0] || null
);

const getLastCoordinate = (routeSegments) => {
  const lastSegment = routeSegments[routeSegments.length - 1];
  return lastSegment?.coordinates?.[lastSegment.coordinates.length - 1] || null;
};

const deleteRouteData = async (transaction, routeId) => {
  await transaction.runAsync('DELETE FROM tracking_route_points WHERE route_id = ?', routeId);
  await transaction.runAsync('DELETE FROM tracking_route_segments WHERE route_id = ?', routeId);
  await transaction.runAsync('DELETE FROM tracking_routes WHERE id = ?', routeId);
};

const upsertRouteRow = async (transaction, {
  id,
  isActive,
  snapshot,
  status,
  summary,
}) => {
  const routeSegments = snapshot.routeSegments || [];
  const metrics = snapshot.metrics || {};
  const startCoordinate = (
    summary?.startCoordinate
    || snapshot.startFlag
    || getFirstCoordinate(routeSegments)
  );
  const endCoordinate = summary?.endCoordinate || (
    isActive ? null : getLastCoordinate(routeSegments)
  );
  const currentCoordinate = snapshot.currentLocation || endCoordinate;
  const updatedAt = snapshot.updatedAt || summary?.endedAt || Date.now();

  await transaction.runAsync(
    ROUTE_UPSERT_SQL,
    id,
    status,
    isActive ? 1 : 0,
    TRACKING_ROUTE_STORAGE.VERSION,
    summary?.createdAt || snapshot.startedAt,
    updatedAt,
    snapshot.startedAt,
    summary?.endedAt || null,
    snapshot.pausedAt || null,
    snapshot.totalPausedMs || 0,
    summary?.distance ?? metrics.distance ?? 0,
    summary?.duration ?? metrics.duration ?? 0,
    isActive ? (metrics.speed || 0) : 0,
    summary?.avgSpeed ?? metrics.avgSpeed ?? 0,
    summary?.maxSpeed ?? metrics.maxSpeed ?? 0,
    summary?.calories ?? metrics.calories ?? 0,
    getRoutePointCount(routeSegments),
    serializeTrackingCoordinate(currentCoordinate),
    serializeTrackingCoordinate(startCoordinate),
    serializeTrackingCoordinate(endCoordinate),
    serializeTrackingPreviewSegments(summary?.previewSegments),
  );
};

const syncRouteSegments = async (transaction, routeId, routeSegments) => {
  const persistedRows = await transaction.getAllAsync(
    `SELECT segment_index, COUNT(*) AS points_count
     FROM tracking_route_points
     WHERE route_id = ?
     GROUP BY segment_index`,
    routeId,
  );
  const persistedCounts = new Map(
    persistedRows.map((row) => [Number(row.segment_index), Number(row.points_count)]),
  );

  await transaction.runAsync(
    'DELETE FROM tracking_route_points WHERE route_id = ? AND segment_index >= ?',
    routeId,
    routeSegments.length,
  );
  await transaction.runAsync(
    'DELETE FROM tracking_route_segments WHERE route_id = ? AND segment_index >= ?',
    routeId,
    routeSegments.length,
  );

  const pointStatement = await transaction.prepareAsync(POINT_INSERT_SQL);

  try {
    for (let segmentIndex = 0; segmentIndex < routeSegments.length; segmentIndex += 1) {
      const segment = routeSegments[segmentIndex];
      const coordinates = segment.coordinates || [];
      let persistedCount = persistedCounts.get(segmentIndex) || 0;

      if (persistedCount > coordinates.length) {
        await transaction.runAsync(
          `DELETE FROM tracking_route_points
           WHERE route_id = ? AND segment_index = ? AND point_index >= ?`,
          routeId,
          segmentIndex,
          coordinates.length,
        );
        persistedCount = coordinates.length;
      }

      await transaction.runAsync(
        `INSERT INTO tracking_route_segments (
           route_id, segment_index, started_at, ended_at, points_count
         ) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(route_id, segment_index) DO UPDATE SET
           started_at = excluded.started_at,
           ended_at = excluded.ended_at,
           points_count = excluded.points_count`,
        routeId,
        segmentIndex,
        segment.startedAt,
        segment.endedAt,
        coordinates.length,
      );

      for (
        let batchStart = persistedCount;
        batchStart < coordinates.length;
        batchStart += TRACKING_DATABASE.BATCH_SIZE
      ) {
        const batchEnd = Math.min(
          batchStart + TRACKING_DATABASE.BATCH_SIZE,
          coordinates.length,
        );

        for (let pointIndex = batchStart; pointIndex < batchEnd; pointIndex += 1) {
          const coordinate = coordinates[pointIndex];

          await pointStatement.executeAsync([
            routeId,
            segmentIndex,
            pointIndex,
            coordinate.latitude,
            coordinate.longitude,
            coordinate.accuracy,
            coordinate.altitude,
            coordinate.altitudeAccuracy,
            coordinate.heading,
            coordinate.speed,
            coordinate.timestamp,
          ]);
        }
      }
    }
  } finally {
    await pointStatement.finalizeAsync();
  }
};

export const writeTrackingRouteSnapshot = async (transaction, options) => {
  await upsertRouteRow(transaction, options);
  await syncRouteSegments(
    transaction,
    options.id,
    options.snapshot.routeSegments || [],
  );
};

export const persistActiveTrackingRoute = async (database, session) => {
  await database.withExclusiveTransactionAsync(async (transaction) => {
    const activeRoute = await transaction.getFirstAsync(
      'SELECT id, started_at FROM tracking_routes WHERE is_active = 1 LIMIT 1',
    );

    if (activeRoute && Number(activeRoute.started_at) !== session.startedAt) {
      await deleteRouteData(transaction, activeRoute.id);
    }

    const id = activeRoute && Number(activeRoute.started_at) === session.startedAt
      ? activeRoute.id
      : createTrackingRouteId(session.startedAt);

    await writeTrackingRouteSnapshot(transaction, {
      id,
      isActive: true,
      snapshot: session,
      status: session.status,
      summary: null,
    });
  });
};

export const finalizeTrackingRoute = async (database, snapshot, summary) => {
  await database.withExclusiveTransactionAsync(async (transaction) => {
    const activeRoute = await transaction.getFirstAsync(
      'SELECT id, started_at FROM tracking_routes WHERE is_active = 1 LIMIT 1',
    );
    const hasMatchingActiveRoute = (
      activeRoute
      && Number(activeRoute.started_at) === snapshot.startedAt
    );

    if (activeRoute && !hasMatchingActiveRoute) {
      await deleteRouteData(transaction, activeRoute.id);
    }

    await writeTrackingRouteSnapshot(transaction, {
      id: hasMatchingActiveRoute ? activeRoute.id : createTrackingRouteId(snapshot.startedAt),
      isActive: false,
      snapshot,
      status: TRACKING_STORAGE_ROUTE_STATUS.COMPLETED,
      summary,
    });
  });
};

export const deleteCompletedTrackingRoute = (database, routeId) => (
  database.runAsync(
    'DELETE FROM tracking_routes WHERE id = ? AND status = ?',
    routeId,
    TRACKING_STORAGE_ROUTE_STATUS.COMPLETED,
  )
);

export const clearActiveTrackingRoute = (database) => (
  database.runAsync('DELETE FROM tracking_routes WHERE is_active = 1')
);

export const discardActiveTrackingRoute = (database, startedAt) => (
  database.runAsync(
    'DELETE FROM tracking_routes WHERE is_active = 1 AND started_at = ?',
    startedAt,
  )
);
