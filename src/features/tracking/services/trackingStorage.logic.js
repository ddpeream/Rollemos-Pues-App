// @ts-check

import {
  TRACKING_ROUTE_STORAGE,
  TRACKING_SESSION_STORAGE,
} from '../constants/trackingStorage.constants';
import {
  normalizeStoredCoordinateSegments,
  normalizeStoredRouteSummary,
  normalizeStoredTrackingSession,
} from '../normalizers/storage.normalizer';

/** @typedef {import('../contracts/trackingStorage.contracts').TrackingStoredPointRow} TrackingStoredPointRow */
/** @typedef {import('../contracts/trackingStorage.contracts').TrackingStoredRouteRow} TrackingStoredRouteRow */
/** @typedef {import('../contracts/trackingStorage.contracts').TrackingStoredSegmentRow} TrackingStoredSegmentRow */

const parseJson = (value, fallback) => {
  if (typeof value !== 'string') return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const createTrackingRouteId = (startedAt) => `route_${startedAt}`;

export const serializeTrackingCoordinate = (coordinate) => (
  coordinate ? JSON.stringify(coordinate) : null
);

export const serializeTrackingPreviewSegments = (segments) => (
  JSON.stringify(Array.isArray(segments) ? segments : [])
);

/** @param {TrackingStoredPointRow} row */
const mapPointRow = (row) => ({
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
});

/**
 * @param {TrackingStoredSegmentRow[]} segmentRows
 * @param {TrackingStoredPointRow[]} pointRows
 */
export const mapTrackingRouteSegments = (segmentRows, pointRows) => {
  const pointsBySegment = new Map();

  pointRows.forEach((row) => {
    const points = pointsBySegment.get(row.segment_index) || [];
    points.push(mapPointRow(row));
    pointsBySegment.set(row.segment_index, points);
  });

  return segmentRows.flatMap((row) => {
    const coordinates = pointsBySegment.get(row.segment_index) || [];
    if (coordinates.length === 0) return [];

    return [{
      coordinates,
      endedAt: Number.isFinite(row.ended_at) ? Number(row.ended_at) : null,
      startedAt: Number(row.started_at),
    }];
  });
};

/**
 * @param {TrackingStoredRouteRow} routeRow
 * @param {TrackingStoredSegmentRow[]} segmentRows
 */
export const mapTrackingRouteSummary = (routeRow, segmentRows) => (
  normalizeStoredRouteSummary({
    avgSpeed: routeRow.avg_speed,
    calories: routeRow.calories,
    chunksCount: Math.ceil(routeRow.points_count / TRACKING_ROUTE_STORAGE.CHUNK_SIZE),
    createdAt: routeRow.created_at,
    distance: routeRow.distance,
    duration: routeRow.duration,
    endCoordinate: parseJson(routeRow.end_coordinate, null),
    endedAt: routeRow.ended_at,
    id: routeRow.id,
    maxSpeed: routeRow.max_speed,
    pointsCount: routeRow.points_count,
    previewSegments: normalizeStoredCoordinateSegments(
      parseJson(routeRow.preview_segments, []),
    ),
    segmentPointCounts: segmentRows.map((row) => Number(row.points_count)),
    startCoordinate: parseJson(routeRow.start_coordinate, null),
    startedAt: routeRow.started_at,
    storageVersion: TRACKING_ROUTE_STORAGE.VERSION,
  })
);

/**
 * @param {TrackingStoredRouteRow} routeRow
 * @param {import('../contracts/tracking.contracts').TrackingRouteSegment[]} routeSegments
 */
export const mapTrackingStoredSession = (routeRow, routeSegments) => (
  normalizeStoredTrackingSession({
    currentLocation: parseJson(routeRow.current_coordinate, null),
    metrics: {
      avgSpeed: routeRow.avg_speed,
      calories: routeRow.calories,
      distance: routeRow.distance,
      duration: routeRow.duration,
      maxSpeed: routeRow.max_speed,
      speed: routeRow.speed,
    },
    pausedAt: routeRow.paused_at,
    routeSegments,
    startFlag: parseJson(routeRow.start_coordinate, null),
    startedAt: routeRow.started_at,
    status: routeRow.status,
    storageVersion: TRACKING_SESSION_STORAGE.VERSION,
    totalPausedMs: routeRow.total_paused_ms,
    updatedAt: routeRow.updated_at,
  })
);
