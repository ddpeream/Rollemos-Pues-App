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

const RESTORABLE_STATUSES = new Set([
  TRACKING_STATUS.TRACKING,
  TRACKING_STATUS.PAUSED,
]);

/** @param {unknown} value */
const isFiniteNumber = (value) => Number.isFinite(value);

/** @param {unknown} value */
const toNonNegativeNumber = (value) => (
  isFiniteNumber(value) && Number(value) >= 0 ? Number(value) : 0
);

/**
 * @param {any} value
 * @returns {TrackingMetrics}
 */
export const normalizeStoredTrackingMetrics = (value) => ({
  avgSpeed: toNonNegativeNumber(value?.avgSpeed ?? TRACKING_METRICS.avgSpeed),
  calories: toNonNegativeNumber(value?.calories ?? TRACKING_METRICS.calories),
  distance: toNonNegativeNumber(value?.distance ?? TRACKING_METRICS.distance),
  duration: toNonNegativeNumber(value?.duration ?? TRACKING_METRICS.duration),
  maxSpeed: toNonNegativeNumber(value?.maxSpeed ?? TRACKING_METRICS.maxSpeed),
  speed: toNonNegativeNumber(value?.speed ?? TRACKING_METRICS.speed),
});

/**
 * @param {unknown} value
 * @returns {TrackingCoordinate[]}
 */
export const normalizeStoredTrackingCoordinates = (value) => {
  if (!Array.isArray(value)) return [];

  /** @type {TrackingCoordinate[]} */
  const coordinates = [];

  value.forEach((entry) => {
    const coordinate = normalizeTrackingCoordinate(entry, { fallbackTimestamp: null });
    if (coordinate) coordinates.push(coordinate);
  });

  return coordinates;
};

/**
 * @param {any} value
 * @returns {StoredTrackingSession|null}
 */
export const normalizeStoredTrackingSession = (value) => {
  if (
    value?.storageVersion !== TRACKING_SESSION_STORAGE.VERSION
    || !RESTORABLE_STATUSES.has(value?.status)
    || !isFiniteNumber(value?.startedAt)
    || !Array.isArray(value?.routeCoordinates)
  ) {
    return null;
  }

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
    routeCoordinates: normalizeStoredTrackingCoordinates(value.routeCoordinates),
    startFlag,
    startedAt: Number(value.startedAt),
    status: value.status,
    storageVersion: TRACKING_SESSION_STORAGE.VERSION,
    totalPausedMs: toNonNegativeNumber(value.totalPausedMs),
    updatedAt: isFiniteNumber(value.updatedAt) ? Number(value.updatedAt) : Number(value.startedAt),
  };
};

/**
 * @param {any} value
 * @returns {StoredTrackingRouteSummary|null}
 */
export const normalizeStoredRouteSummary = (value) => {
  if (
    typeof value?.id !== 'string'
    || value.storageVersion !== TRACKING_ROUTE_STORAGE.VERSION
    || !Number.isInteger(value.chunksCount)
    || value.chunksCount < 0
    || !isFiniteNumber(value.startedAt)
    || !isFiniteNumber(value.endedAt)
  ) {
    return null;
  }

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
    pointsCount: Number.isInteger(value.pointsCount) && value.pointsCount >= 0
      ? value.pointsCount
      : 0,
    previewCoordinates: normalizeStoredTrackingCoordinates(value.previewCoordinates),
    startCoordinate: value.startCoordinate
      ? normalizeTrackingCoordinate(value.startCoordinate, { fallbackTimestamp: null })
      : null,
    startedAt: Number(value.startedAt),
    storageVersion: TRACKING_ROUTE_STORAGE.VERSION,
  };
};

/**
 * @param {unknown} value
 * @returns {StoredTrackingRouteSummary[]}
 */
export const normalizeStoredRouteIndex = (value) => {
  if (!Array.isArray(value)) return [];

  /** @type {StoredTrackingRouteSummary[]} */
  const routes = [];

  value.forEach((entry) => {
    const route = normalizeStoredRouteSummary(entry);
    if (route) routes.push(route);
  });

  return routes;
};
