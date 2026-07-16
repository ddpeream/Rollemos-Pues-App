import {
  TRACKING_ROUTE_STORAGE,
  TRACKING_STORAGE_ROUTE_STATUS,
} from '../constants/trackingStorage.constants';
import { normalizeStoredTrackingSegments } from '../normalizers/storage.normalizer';
import {
  closeActiveRouteSegment,
  flattenRouteSegments,
  getRouteDistanceFromSegments,
  getRouteMaxSpeedFromSegments,
  getRoutePointCount,
  getRouteSegmentPointCounts,
} from '../store/trackingRoute.logic';
import { getCaloriesEstimate } from '../utils/calories.utils';
import { getAverageSpeedKmh } from '../utils/speed.utils';
import {
  createRoutePreviewCoordinateSegments,
  getFinalRouteDurationSeconds,
  shouldSaveCompletedRoute,
} from './routeStorage.logic';
import {
  hydrateCompletedTrackingRoute,
  loadCompletedTrackingRoutes,
} from './trackingRouteReader.service';
import {
  deleteCompletedTrackingRoute,
  discardActiveTrackingRoute,
  finalizeTrackingRoute,
} from './trackingRouteWriter.service';
import { createTrackingRouteId } from './trackingStorage.logic';
import { prepareTrackingStorage } from './trackingStorageMigration.service';
import {
  enqueueTrackingStorageWrite,
  flushTrackingStorageWrites,
} from './trackingStorageQueue.service';

export const loadSavedRoutes = async () => {
  const database = await prepareTrackingStorage();
  await flushTrackingStorageWrites();
  return loadCompletedTrackingRoutes(database);
};

export const hydrateSavedRoute = async (routeId) => {
  const database = await prepareTrackingStorage();
  await flushTrackingStorageWrites();
  return hydrateCompletedTrackingRoute(database, routeId);
};

export const deleteSavedRoute = async (routeId) => {
  const database = await prepareTrackingStorage();

  return enqueueTrackingStorageWrite(async () => {
    await deleteCompletedTrackingRoute(database, routeId);
    return loadCompletedTrackingRoutes(database);
  });
};

export const saveCompletedRoute = async ({
  endedAt = Date.now(),
  metrics = {},
  pausedAt = null,
  routeSegments = [],
  startedAt,
  totalPausedMs = 0,
}) => {
  const safeRouteSegments = closeActiveRouteSegment(
    normalizeStoredTrackingSegments(routeSegments),
    endedAt,
  );
  const routeCoordinates = flattenRouteSegments(safeRouteSegments);
  const pointsCount = getRoutePointCount(safeRouteSegments);
  const distance = getRouteDistanceFromSegments(safeRouteSegments);
  const duration = Number.isFinite(metrics.duration) && metrics.duration > 0
    ? metrics.duration
    : getFinalRouteDurationSeconds({ endedAt, pausedAt, startedAt, totalPausedMs });
  const database = await prepareTrackingStorage();

  if (!shouldSaveCompletedRoute({ distance, duration, pointsCount })) {
    await enqueueTrackingStorageWrite(
      () => discardActiveTrackingRoute(database, startedAt),
    );
    return { saved: false, reason: 'route_does_not_meet_save_conditions' };
  }

  const avgSpeed = getAverageSpeedKmh(distance, duration);
  const maxSpeed = getRouteMaxSpeedFromSegments(safeRouteSegments);
  const calories = getCaloriesEstimate({ avgSpeedKmh: avgSpeed, durationSeconds: duration });
  const routeSummary = {
    id: createTrackingRouteId(startedAt),
    avgSpeed,
    calories,
    chunksCount: Math.ceil(pointsCount / TRACKING_ROUTE_STORAGE.CHUNK_SIZE),
    createdAt: endedAt,
    distance,
    duration,
    endCoordinate: routeCoordinates[pointsCount - 1],
    endedAt,
    maxSpeed,
    pointsCount,
    previewSegments: createRoutePreviewCoordinateSegments(safeRouteSegments),
    segmentPointCounts: getRouteSegmentPointCounts(safeRouteSegments),
    startCoordinate: routeCoordinates[0],
    startedAt,
    storageVersion: TRACKING_ROUTE_STORAGE.VERSION,
  };
  const completedSnapshot = {
    currentLocation: routeSummary.endCoordinate,
    metrics: {
      avgSpeed,
      calories,
      distance,
      duration,
      maxSpeed,
      speed: 0,
    },
    pausedAt,
    routeSegments: safeRouteSegments,
    startFlag: routeSummary.startCoordinate,
    startedAt,
    status: TRACKING_STORAGE_ROUTE_STATUS.COMPLETED,
    totalPausedMs,
    updatedAt: endedAt,
  };

  await enqueueTrackingStorageWrite(
    () => finalizeTrackingRoute(database, completedSnapshot, routeSummary),
  );

  return { route: routeSummary, saved: true };
};
