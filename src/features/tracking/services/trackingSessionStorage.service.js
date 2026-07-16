import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  TRACKING_SESSION_STORAGE,
  TRACKING_STATUS,
} from '../constants/tracking.constants';

const VALID_RESTORABLE_STATUS = new Set([
  TRACKING_STATUS.TRACKING,
  TRACKING_STATUS.PAUSED,
]);

const isRestorableSession = (session) => (
  session?.storageVersion === TRACKING_SESSION_STORAGE.VERSION &&
  VALID_RESTORABLE_STATUS.has(session?.status) &&
  Number.isFinite(session?.startedAt) &&
  Array.isArray(session?.routeCoordinates)
);

export const saveActiveTrackingSession = async ({
  currentLocation,
  metrics,
  pausedAt,
  routeCoordinates,
  startFlag,
  startedAt,
  status,
  totalPausedMs,
}) => {
  if (!VALID_RESTORABLE_STATUS.has(status) || !startedAt) {
    await AsyncStorage.removeItem(TRACKING_SESSION_STORAGE.KEY);
    return { saved: false };
  }

  const session = {
    currentLocation,
    metrics,
    pausedAt,
    routeCoordinates: Array.isArray(routeCoordinates) ? routeCoordinates : [],
    startFlag,
    startedAt,
    status,
    storageVersion: TRACKING_SESSION_STORAGE.VERSION,
    totalPausedMs,
    updatedAt: Date.now(),
  };

  await AsyncStorage.setItem(TRACKING_SESSION_STORAGE.KEY, JSON.stringify(session));
  return { saved: true, session };
};

export const loadActiveTrackingSession = async () => {
  const rawSession = await AsyncStorage.getItem(TRACKING_SESSION_STORAGE.KEY);
  if (!rawSession) return null;

  try {
    const session = JSON.parse(rawSession);
    return isRestorableSession(session) ? session : null;
  } catch (error) {
    return null;
  }
};

export const clearActiveTrackingSession = () => (
  AsyncStorage.removeItem(TRACKING_SESSION_STORAGE.KEY)
);
