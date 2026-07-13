import AsyncStorage from '@react-native-async-storage/async-storage';

import { TRACKING_PRIVACY_STORAGE } from '../constants/tracking.constants';

export const saveTrackingPrivacy = async (isPrivate) => {
  await AsyncStorage.setItem(
    TRACKING_PRIVACY_STORAGE.KEY,
    JSON.stringify(!!isPrivate),
  );

  return !!isPrivate;
};

export const loadTrackingPrivacy = async () => {
  const storedPrivacy = await AsyncStorage.getItem(TRACKING_PRIVACY_STORAGE.KEY);
  if (storedPrivacy == null) return false;

  try {
    return !!JSON.parse(storedPrivacy);
  } catch (error) {
    return false;
  }
};
