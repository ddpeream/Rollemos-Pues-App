import AsyncStorage from '@react-native-async-storage/async-storage';

import { TRACKING_ROUTE_STORAGE } from '../constants/tracking.constants';
import {
  normalizeStoredRouteIndex,
  normalizeStoredTrackingCoordinates,
  normalizeStoredTrackingSegments,
} from '../normalizers/storage.normalizer';
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
  chunkRouteCoordinates,
  createRoutePreviewCoordinateSegments,
  getFinalRouteDurationSeconds,
  hydrateRouteSegmentsFromCoordinates,
  shouldSaveCompletedRoute,
} from './routeStorage.logic';

const getRouteChunkKey = (routeId, chunkIndex) => (
  `${TRACKING_ROUTE_STORAGE.ROUTE_KEY_PREFIX}/${routeId}/chunk/${chunkIndex}`
);

const createRouteId = () => (
  `route_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
);

const loadRouteIndex = async () => {
  const rawIndex = await AsyncStorage.getItem(TRACKING_ROUTE_STORAGE.INDEX_KEY);
  if (!rawIndex) return [];

  try {
    return normalizeStoredRouteIndex(JSON.parse(rawIndex));
  } catch {
    return [];
  }
};

const saveRouteIndex = (routesIndex) => (
  AsyncStorage.setItem(
    TRACKING_ROUTE_STORAGE.INDEX_KEY,
    JSON.stringify(normalizeStoredRouteIndex(routesIndex)),
  )
);

export const loadSavedRoutes = async () => loadRouteIndex();

export const hydrateSavedRoute = async (routeId) => {
  const routesIndex = await loadRouteIndex();
  const routeSummary = routesIndex.find((route) => route.id === routeId);
  if (!routeSummary) return null;

  const chunkKeys = Array.from({ length: routeSummary.chunksCount }, (_, index) => (
    getRouteChunkKey(routeId, index)
  ));
  const chunkEntries = await AsyncStorage.multiGet(chunkKeys);
  const routeCoordinates = chunkEntries.flatMap(([, rawChunk]) => {
    if (!rawChunk) return [];

    try {
      return normalizeStoredTrackingCoordinates(JSON.parse(rawChunk));
    } catch {
      return [];
    }
  });

  return {
    ...routeSummary,
    routeSegments: hydrateRouteSegmentsFromCoordinates(
      routeCoordinates,
      routeSummary.segmentPointCounts,
    ),
  };
};

export const deleteSavedRoute = async (routeId) => {
  const routesIndex = await loadRouteIndex();
  const routeSummary = routesIndex.find((route) => route.id === routeId);
  const nextRoutesIndex = routesIndex.filter((route) => route.id !== routeId);
  const chunkKeys = routeSummary
    ? Array.from({ length: routeSummary.chunksCount }, (_, index) => getRouteChunkKey(routeId, index))
    : [];

  await AsyncStorage.multiRemove(chunkKeys);
  await saveRouteIndex(nextRoutesIndex);

  return nextRoutesIndex;
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

  if (!shouldSaveCompletedRoute({ distance, duration, pointsCount })) {
    return { saved: false, reason: 'route_does_not_meet_save_conditions' };
  }

  const id = createRouteId();
  const chunks = chunkRouteCoordinates(routeCoordinates);
  const avgSpeed = getAverageSpeedKmh(distance, duration);
  const maxSpeed = getRouteMaxSpeedFromSegments(safeRouteSegments);
  const calories = getCaloriesEstimate({ avgSpeedKmh: avgSpeed, durationSeconds: duration });
  const routeSummary = {
    id,
    avgSpeed,
    calories,
    chunksCount: chunks.length,
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
  const chunkEntries = chunks.map((chunk, index) => [
    getRouteChunkKey(id, index),
    JSON.stringify(chunk),
  ]);
  const routesIndex = await loadRouteIndex();

  await AsyncStorage.multiSet(chunkEntries);
  await saveRouteIndex([routeSummary, ...routesIndex]);

  return { route: routeSummary, saved: true };
};
