// @ts-check

import {
  TRACKING_METRICS,
  TRACKING_ROUTE_STORAGE,
  TRACKING_SESSION_STORAGE,
  TRACKING_STATUS,
} from '../constants/tracking.constants';
import { normalizeTrackingCoordinate } from './location.normalizer';

/** @typedef {import('../contracts/tracking.contracts').StoredTrackingRouteSummary} StoredTrackingRouteSummary */
/** @typedef {import('../contracts/tracking.contracts').StoredTrackingSession} StoredTrackingSession */
/** @typedef {import('../contracts/tracking.contracts').TrackingCoordinate} TrackingCoordinate */
/** @typedef {import('../contracts/tracking.contracts').TrackingMetrics} TrackingMetrics */
/** @typedef {import('../contracts/tracking.contracts').TrackingRouteSegment} TrackingRouteSegment */

const RESTORABLE_STATUSES = new Set([
  TRACKING_STATUS.TRACKING,
  TRACKING_STATUS.PAUSED,
]);
const ROUTE_STORAGE_VERSIONS = new Set([
  TRACKING_ROUTE_STORAGE.LEGACY_VERSION,
  TRACKING_ROUTE_STORAGE.VERSION,
]);
const SESSION_STORAGE_VERSIONS = new Set([
  TRACKING_SESSION_STORAGE.LEGACY_VERSION,
  TRACKING_SESSION_STORAGE.VERSION,
]);

/** @param {unknown} value */
const isFiniteNumber = (value) => Number.isFinite(value);

/** @param {unknown} value */
const toNonNegativeNumber = (value) => (
  isFiniteNumber(value) && Number(value) >= 0 ? Number(value) : 0
);

/** @param {any} value @returns {TrackingMetrics} */
export const normalizeStoredTrackingMetrics = (value) => ({
  avgSpeed: toNonNegativeNumber(value?.avgSpeed ?? TRACKING_METRICS.avgSpeed),
  calories: toNonNegativeNumber(value?.calories ?? TRACKING_METRICS.calories),
  distance: toNonNegativeNumber(value?.distance ?? TRACKING_METRICS.distance),
  duration: toNonNegativeNumber(value?.duration ?? TRACKING_METRICS.duration),
  maxSpeed: toNonNegativeNumber(value?.maxSpeed ?? TRACKING_METRICS.maxSpeed),
  speed: toNonNegativeNumber(value?.speed ?? TRACKING_METRICS.speed),
});

/** @param {unknown} value @returns {TrackingCoordinate[]} */
export const normalizeStoredTrackingCoordinates = (value) => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    const coordinate = normalizeTrackingCoordinate(entry, { fallbackTimestamp: null });
    return coordinate ? [coordinate] : [];
  });
};

/** @param {unknown} value @returns {TrackingCoordinate[][]} */
export const normalizeStoredCoordinateSegments = (value) => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((coordinates) => {
    const normalized = normalizeStoredTrackingCoordinates(coordinates);
    return normalized.length > 0 ? [normalized] : [];
  });
};

/** @param {any} value @returns {TrackingRouteSegment[]} */
export const normalizeStoredTrackingSegments = (value) => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((segment) => {
    const coordinates = normalizeStoredTrackingCoordinates(segment?.coordinates);
    if (coordinates.length === 0) return [];

    return [{
      coordinates,
      endedAt: isFiniteNumber(segment?.endedAt) ? Number(segment.endedAt) : null,
      startedAt: isFiniteNumber(segment?.startedAt)
        ? Number(segment.startedAt)
        : coordinates[0].timestamp,
    }];
  });
};

const createLegacySessionSegments = (value) => {
  const coordinates = normalizeStoredTrackingCoordinates(value?.routeCoordinates);
  if (coordinates.length === 0) return [];

  const endedAt = value.status === TRACKING_STATUS.PAUSED
    ? (
      isFiniteNumber(value.pausedAt)
        ? Number(value.pausedAt)
        : coordinates[coordinates.length - 1].timestamp
    )
    : null;

  return [{
    coordinates,
    endedAt,
    startedAt: Number(value.startedAt),
  }];
};

/** @param {any} value @returns {StoredTrackingSession|null} */
export const normalizeStoredTrackingSession = (value) => {
  if (
    !SESSION_STORAGE_VERSIONS.has(value?.storageVersion)
    || !RESTORABLE_STATUSES.has(value?.status)
    || !isFiniteNumber(value?.startedAt)
  ) {
    return null;
  }

  const routeSegments = value.storageVersion === TRACKING_SESSION_STORAGE.LEGACY_VERSION
    ? createLegacySessionSegments(value)
    : normalizeStoredTrackingSegments(value.routeSegments);
  if (routeSegments.length === 0) return null;

  const currentLocation = value.currentLocation
    ? normalizeTrackingCoordinate(value.currentLocation, { fallbackTimestamp: null })
    : null;
  const startFlag = value.startFlag
    ? normalizeTrackingCoordinate(value.startFlag, { fallbackTimestamp: null })
    : null;

  return {
    currentLocation,
    metrics: normalizeStoredTrackingMetrics(value.metrics),
    pausedAt: isFiniteNumber(value.pausedAt) ? Number(value.pausedAt) : null,
    routeSegments,
    startFlag,
    startedAt: Number(value.startedAt),
    status: value.status,
    storageVersion: TRACKING_SESSION_STORAGE.VERSION,
    totalPausedMs: toNonNegativeNumber(value.totalPausedMs),
    updatedAt: isFiniteNumber(value.updatedAt) ? Number(value.updatedAt) : Number(value.startedAt),
  };
};

const normalizeSegmentPointCounts = (value, pointsCount) => {
  if (!Array.isArray(value)) return pointsCount > 0 ? [pointsCount] : [];

  const counts = value.filter((count) => Number.isInteger(count) && count > 0);
  return counts.reduce((total, count) => total + count, 0) === pointsCount
    ? counts
    : (pointsCount > 0 ? [pointsCount] : []);
};

/** @param {any} value @returns {StoredTrackingRouteSummary|null} */
export const normalizeStoredRouteSummary = (value) => {
  if (
    typeof value?.id !== 'string'
    || !ROUTE_STORAGE_VERSIONS.has(value.storageVersion)
    || !Number.isInteger(value.chunksCount)
    || value.chunksCount < 0
    || !isFiniteNumber(value.startedAt)
    || !isFiniteNumber(value.endedAt)
  ) {
    return null;
  }

  const pointsCount = Number.isInteger(value.pointsCount) && value.pointsCount >= 0
    ? value.pointsCount
    : 0;
  const legacyPreview = normalizeStoredTrackingCoordinates(value.previewCoordinates);
  const previewSegments = value.storageVersion === TRACKING_ROUTE_STORAGE.LEGACY_VERSION
    ? (legacyPreview.length > 0 ? [legacyPreview] : [])
    : normalizeStoredCoordinateSegments(value.previewSegments);

  return {
    avgSpeed: toNonNegativeNumber(value.avgSpeed),
    calories: toNonNegativeNumber(value.calories),
    chunksCount: value.chunksCount,
    createdAt: isFiniteNumber(value.createdAt) ? Number(value.createdAt) : Number(value.endedAt),
    distance: toNonNegativeNumber(value.distance),
    duration: toNonNegativeNumber(value.duration),
    endCoordinate: value.endCoordinate
      ? normalizeTrackingCoordinate(value.endCoordinate, { fallbackTimestamp: null })
      : null,
    endedAt: Number(value.endedAt),
    id: value.id,
    maxSpeed: toNonNegativeNumber(value.maxSpeed),
    pointsCount,
    previewSegments,
    segmentPointCounts: normalizeSegmentPointCounts(value.segmentPointCounts, pointsCount),
    startCoordinate: value.startCoordinate
      ? normalizeTrackingCoordinate(value.startCoordinate, { fallbackTimestamp: null })
      : null,
    startedAt: Number(value.startedAt),
    storageVersion: TRACKING_ROUTE_STORAGE.VERSION,
  };
};

/** @param {unknown} value @returns {StoredTrackingRouteSummary[]} */
export const normalizeStoredRouteIndex = (value) => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    const route = normalizeStoredRouteSummary(entry);
    return route ? [route] : [];
  });
};
