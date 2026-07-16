import { TRACKING_SESSION_STORAGE } from '../constants/trackingStorage.constants';
import { normalizeStoredTrackingSession } from '../normalizers/storage.normalizer';
import { loadActiveTrackingRoute } from './trackingRouteReader.service';
import {
  clearActiveTrackingRoute,
  persistActiveTrackingRoute,
} from './trackingRouteWriter.service';
import { prepareTrackingStorage } from './trackingStorageMigration.service';
import {
  enqueueTrackingStorageWrite,
  flushTrackingStorageWrites,
} from './trackingStorageQueue.service';

export const saveActiveTrackingSession = async ({
  currentLocation,
  metrics,
  pausedAt,
  routeSegments,
  startFlag,
  startedAt,
  status,
  totalPausedMs,
}) => {
  const session = normalizeStoredTrackingSession({
    currentLocation,
    metrics,
    pausedAt,
    routeSegments,
    startFlag,
    startedAt,
    status,
    storageVersion: TRACKING_SESSION_STORAGE.VERSION,
    totalPausedMs,
    updatedAt: Date.now(),
  });
  const database = await prepareTrackingStorage();

  if (!session) {
    await enqueueTrackingStorageWrite(() => clearActiveTrackingRoute(database));
    return { saved: false };
  }

  await enqueueTrackingStorageWrite(
    () => persistActiveTrackingRoute(database, session),
  );

  return { saved: true, session };
};

export const loadActiveTrackingSession = async () => {
  const database = await prepareTrackingStorage();
  await flushTrackingStorageWrites();
  return loadActiveTrackingRoute(database);
};

export const clearActiveTrackingSession = async () => {
  const database = await prepareTrackingStorage();
  return enqueueTrackingStorageWrite(() => clearActiveTrackingRoute(database));
};
