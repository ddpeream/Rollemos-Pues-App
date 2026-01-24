import AsyncStorage from '@react-native-async-storage/async-storage';

const TRACKING_PRIVACY_KEY = '@tracking_privacy';

export const setTrackingPrivacy = async (isPrivate) => {
  try {
    await AsyncStorage.setItem(TRACKING_PRIVACY_KEY, JSON.stringify(!!isPrivate));
  } catch (error) {
    console.error('Error guardando privacidad de tracking:', error);
  }
};

export const getTrackingPrivacy = async () => {
  try {
    const stored = await AsyncStorage.getItem(TRACKING_PRIVACY_KEY);
    if (stored == null) return false;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error leyendo privacidad de tracking:', error);
    return false;
  }
};
