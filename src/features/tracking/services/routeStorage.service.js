import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  TRACKING_ROUTE_SAVE_CONDITIONS,
  TRACKING_ROUTE_STORAGE,
} from '../constants/tracking.constants';
import { getCaloriesEstimate } from '../utils/calories.utils';
import { getRouteDistance } from '../utils/distance.utils';
import { getAverageSpeedKmh, getMaxSpeedKmh } from '../utils/speed.utils';

const getRouteChunkKey = (routeId, chunkIndex) => (
  `${TRACKING_ROUTE_STORAGE.ROUTE_KEY_PREFIX}/${routeId}/chunk/${chunkIndex}`
);

const createRouteId = () => (
  `route_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
);

const chunkCoordinates = (coordinates) => {
  const chunks = [];

  for (let index = 0; index < coordinates.length; index += TRACKING_ROUTE_STORAGE.CHUNK_SIZE) {
    chunks.push(coordinates.slice(index, index + TRACKING_ROUTE_STORAGE.CHUNK_SIZE));
  }

  return chunks;
};

const createRoutePreviewCoordinates = (coordinates) => {
  if (coordinates.length <= 24) return coordinates;

  const lastIndex = coordinates.length - 1;
  const step = lastIndex / 23;

  return Array.from({ length: 24 }, (_, index) => (
    coordinates[Math.round(index * step)]
  ));
};

const getFinalDurationSeconds = ({
  endedAt,
  pausedAt,
  startedAt,
  totalPausedMs,
}) => {
  if (!startedAt || !endedAt) return 0;

  const pendingPausedMs = pausedAt ? endedAt - pausedAt : 0;
  return Math.max(0, Math.floor((endedAt - startedAt - totalPausedMs - pendingPausedMs) / 1000));
};

const shouldSaveRoute = ({ distance, duration, pointsCount }) => (
  pointsCount >= TRACKING_ROUTE_SAVE_CONDITIONS.MIN_POINTS &&
  distance >= TRACKING_ROUTE_SAVE_CONDITIONS.MIN_DISTANCE_METERS &&
  duration >= TRACKING_ROUTE_SAVE_CONDITIONS.MIN_DURATION_SECONDS
);

const loadRouteIndex = async () => {
  const rawIndex = await AsyncStorage.getItem(TRACKING_ROUTE_STORAGE.INDEX_KEY);
  if (!rawIndex) return [];

  try {
    const parsedIndex = JSON.parse(rawIndex);
    return Array.isArray(parsedIndex) ? parsedIndex : [];
  } catch (error) {
    return [];
  }
};

const saveRouteIndex = (routesIndex) => (
  AsyncStorage.setItem(TRACKING_ROUTE_STORAGE.INDEX_KEY, JSON.stringify(routesIndex))
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
      const parsedChunk = JSON.parse(rawChunk);
      return Array.isArray(parsedChunk) ? parsedChunk : [];
    } catch (error) {
      return [];
    }
  });

  return {
    ...routeSummary,
    routeCoordinates,
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
  routeCoordinates = [],
  startedAt,
  totalPausedMs = 0,
}) => {
  const safeRouteCoordinates = Array.isArray(routeCoordinates) ? routeCoordinates : [];
  const pointsCount = safeRouteCoordinates.length;
  const distance = getRouteDistance(safeRouteCoordinates);
  const duration = Number.isFinite(metrics.duration) && metrics.duration > 0
    ? metrics.duration
    : getFinalDurationSeconds({ endedAt, pausedAt, startedAt, totalPausedMs });

  if (!shouldSaveRoute({ distance, duration, pointsCount })) {
    return { saved: false, reason: 'route_does_not_meet_save_conditions' };
  }

  const id = createRouteId();
  const chunks = chunkCoordinates(safeRouteCoordinates);
  const avgSpeed = getAverageSpeedKmh(distance, duration);
  const maxSpeed = getMaxSpeedKmh(safeRouteCoordinates);
  const calories = getCaloriesEstimate({ avgSpeedKmh: avgSpeed, durationSeconds: duration });

  const routeSummary = {
    id,
    avgSpeed,
    calories,
    chunksCount: chunks.length,
    createdAt: endedAt,
    distance,
    duration,
    endCoordinate: safeRouteCoordinates[pointsCount - 1],
    endedAt,
    maxSpeed,
    pointsCount,
    previewCoordinates: createRoutePreviewCoordinates(safeRouteCoordinates),
    startCoordinate: safeRouteCoordinates[0],
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
