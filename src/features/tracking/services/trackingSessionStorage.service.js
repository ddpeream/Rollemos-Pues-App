import AsyncStorage from '@react-native-async-storage/async-storage';

import { TRACKING_SESSION_STORAGE } from '../constants/tracking.constants';
import { normalizeStoredTrackingSession } from '../normalizers/storage.normalizer';

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
  const session = normalizeStoredTrackingSession({
    currentLocation,
    metrics,
    pausedAt,
    routeCoordinates,
    startFlag,
    startedAt,
    status,
    storageVersion: TRACKING_SESSION_STORAGE.VERSION,
    totalPausedMs,
    updatedAt: Date.now(),
  });

  if (!session) {
    await AsyncStorage.removeItem(TRACKING_SESSION_STORAGE.KEY);
    return { saved: false };
  }

  await AsyncStorage.setItem(TRACKING_SESSION_STORAGE.KEY, JSON.stringify(session));
  return { saved: true, session };
};

export const loadActiveTrackingSession = async () => {
  const rawSession = await AsyncStorage.getItem(TRACKING_SESSION_STORAGE.KEY);
  if (!rawSession) return null;

  try {
    return normalizeStoredTrackingSession(JSON.parse(rawSession));
  } catch (error) {
    return null;
  }
};

export const clearActiveTrackingSession = () => (
  AsyncStorage.removeItem(TRACKING_SESSION_STORAGE.KEY)
);