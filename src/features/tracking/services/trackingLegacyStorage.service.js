import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  TRACKING_ROUTE_STORAGE,
  TRACKING_SESSION_STORAGE,
} from '../constants/trackingStorage.constants';
import {
  normalizeStoredRouteIndex,
  normalizeStoredTrackingCoordinates,
  normalizeStoredTrackingSession,
} from '../normalizers/storage.normalizer';
import { getRoutePointCount } from '../store/trackingRoute.logic';
import { hydrateRouteSegmentsFromCoordinates } from './routeStorage.logic';

const getLegacyRouteChunkKey = (routeId, chunkIndex) => (
  `${TRACKING_ROUTE_STORAGE.ROUTE_KEY_PREFIX}/${routeId}/chunk/${chunkIndex}`
);

const parseLegacyJson = (rawValue, errorCode) => {
  try {
    return JSON.parse(rawValue);
  } catch {
    throw new Error(errorCode);
  }
};

const loadLegacyRoute = async (summary) => {
  const chunkKeys = Array.from({ length: summary.chunksCount }, (_, index) => (
    getLegacyRouteChunkKey(summary.id, index)
  ));
  const chunkEntries = await AsyncStorage.multiGet(chunkKeys);
  const routeCoordinates = chunkEntries.flatMap(([, rawChunk]) => {
    if (!rawChunk) throw new Error('tracking_legacy_route_chunk_missing');

    return normalizeStoredTrackingCoordinates(
      parseLegacyJson(rawChunk, 'tracking_legacy_route_chunk_invalid'),
    );
  });
  const routeSegments = hydrateRouteSegmentsFromCoordinates(
    routeCoordinates,
    summary.segmentPointCounts,
  );

  if (getRoutePointCount(routeSegments) !== summary.pointsCount) {
    throw new Error('tracking_legacy_route_points_mismatch');
  }

  return { ...summary, routeSegments };
};

export const loadLegacyTrackingStorage = async () => {
  const [rawIndex, rawSession] = await Promise.all([
    AsyncStorage.getItem(TRACKING_ROUTE_STORAGE.INDEX_KEY),
    AsyncStorage.getItem(TRACKING_SESSION_STORAGE.KEY),
  ]);
  const parsedIndex = rawIndex
    ? parseLegacyJson(rawIndex, 'tracking_legacy_route_index_invalid')
    : [];
  const routeSummaries = normalizeStoredRouteIndex(parsedIndex);

  if (!Array.isArray(parsedIndex) || routeSummaries.length !== parsedIndex.length) {
    throw new Error('tracking_legacy_route_index_not_restorable');
  }

  const routes = await Promise.all(routeSummaries.map(loadLegacyRoute));
  const parsedSession = rawSession
    ? parseLegacyJson(rawSession, 'tracking_legacy_session_invalid')
    : null;
  const activeSession = parsedSession
    ? normalizeStoredTrackingSession(parsedSession)
    : null;

  if (parsedSession && !activeSession) {
    throw new Error('tracking_legacy_session_not_restorable');
  }

  return { activeSession, routeSummaries, routes };
};

export const clearLegacyTrackingStorage = async ({ routeSummaries }) => {
  const chunkKeys = routeSummaries.flatMap((summary) => (
    Array.from({ length: summary.chunksCount }, (_, index) => (
      getLegacyRouteChunkKey(summary.id, index)
    ))
  ));

  await AsyncStorage.multiRemove([
    TRACKING_ROUTE_STORAGE.INDEX_KEY,
    TRACKING_SESSION_STORAGE.KEY,
    ...chunkKeys,
  ]);
};
