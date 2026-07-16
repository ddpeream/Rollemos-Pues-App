// @ts-check

import { TRACKING_STORAGE_ROUTE_STATUS } from '../constants/trackingStorage.constants';
import {
  mapTrackingRouteSegments,
  mapTrackingRouteSummary,
  mapTrackingStoredSession,
} from './trackingStorage.logic';

/** @typedef {import('../contracts/trackingStorage.contracts').TrackingStoredPointRow} TrackingStoredPointRow */
/** @typedef {import('../contracts/trackingStorage.contracts').TrackingStoredRouteRow} TrackingStoredRouteRow */
/** @typedef {import('../contracts/trackingStorage.contracts').TrackingStoredSegmentRow} TrackingStoredSegmentRow */

const loadRouteSegments = async (database, routeId) => {
  /** @type {TrackingStoredSegmentRow[]} */
  const segmentRows = await database.getAllAsync(
    `SELECT route_id, segment_index, started_at, ended_at, points_count
     FROM tracking_route_segments
     WHERE route_id = ?
     ORDER BY segment_index ASC`,
    routeId,
  );
  /** @type {TrackingStoredPointRow[]} */
  const pointRows = await database.getAllAsync(
    `SELECT route_id, segment_index, point_index, latitude, longitude,
            accuracy, altitude, altitude_accuracy, heading, speed, timestamp
     FROM tracking_route_points
     WHERE route_id = ?
     ORDER BY segment_index ASC, point_index ASC`,
    routeId,
  );

  return {
    routeSegments: mapTrackingRouteSegments(segmentRows, pointRows),
    segmentRows,
  };
};

export const loadCompletedTrackingRoutes = async (database) => {
  /** @type {TrackingStoredRouteRow[]} */
  const routeRows = await database.getAllAsync(
    `SELECT *
     FROM tracking_routes
     WHERE status = ?
     ORDER BY created_at DESC`,
    TRACKING_STORAGE_ROUTE_STATUS.COMPLETED,
  );
  /** @type {TrackingStoredSegmentRow[]} */
  const segmentRows = await database.getAllAsync(
    `SELECT segments.*
     FROM tracking_route_segments AS segments
     INNER JOIN tracking_routes AS routes ON routes.id = segments.route_id
     WHERE routes.status = ?
     ORDER BY segments.route_id ASC, segments.segment_index ASC`,
    TRACKING_STORAGE_ROUTE_STATUS.COMPLETED,
  );
  const segmentsByRoute = new Map();

  segmentRows.forEach((row) => {
    const rows = segmentsByRoute.get(row.route_id) || [];
    rows.push(row);
    segmentsByRoute.set(row.route_id, rows);
  });

  return routeRows.flatMap((routeRow) => {
    const summary = mapTrackingRouteSummary(
      routeRow,
      segmentsByRoute.get(routeRow.id) || [],
    );
    return summary ? [summary] : [];
  });
};

export const hydrateCompletedTrackingRoute = async (database, routeId) => {
  /** @type {TrackingStoredRouteRow|null} */
  const routeRow = await database.getFirstAsync(
    'SELECT * FROM tracking_routes WHERE id = ? AND status = ? LIMIT 1',
    routeId,
    TRACKING_STORAGE_ROUTE_STATUS.COMPLETED,
  );
  if (!routeRow) return null;

  const { routeSegments, segmentRows } = await loadRouteSegments(database, routeId);
  const summary = mapTrackingRouteSummary(routeRow, segmentRows);
  if (!summary) return null;

  return { ...summary, routeSegments };
};

export const loadActiveTrackingRoute = async (database) => {
  /** @type {TrackingStoredRouteRow|null} */
  const routeRow = await database.getFirstAsync(
    'SELECT * FROM tracking_routes WHERE is_active = 1 LIMIT 1',
  );
  if (!routeRow) return null;

  const { routeSegments } = await loadRouteSegments(database, routeRow.id);
  return mapTrackingStoredSession(routeRow, routeSegments);
};
