import AsyncStorage from '@react-native-async-storage/async-storage';

import { TRACKING_PRIVACY_STORAGE } from '../constants/tracking.constants';

let privacyLoadPromise = null;

export const saveTrackingPrivacy = async (isPrivate) => {
  const normalizedPrivacy = !!isPrivate;
  await AsyncStorage.setItem(
    TRACKING_PRIVACY_STORAGE.KEY,
    JSON.stringify(normalizedPrivacy),
  );
  privacyLoadPromise = Promise.resolve(normalizedPrivacy);

  return normalizedPrivacy;
};

const readTrackingPrivacy = async () => {
  const storedPrivacy = await AsyncStorage.getItem(
    TRACKING_PRIVACY_STORAGE.KEY,
  );
  if (storedPrivacy == null) return false;

  try {
    return !!JSON.parse(storedPrivacy);
  } catch {
    return false;
  }
};

export const loadTrackingPrivacy = () => {
  if (!privacyLoadPromise) {
    privacyLoadPromise = readTrackingPrivacy().catch((error) => {
      privacyLoadPromise = null;
      throw error;
    });
  }

  return privacyLoadPromise;
};
