// @ts-check

import * as Location from 'expo-location';

const LOCATION_ACCURACY = {
  balanced: Location.Accuracy.Balanced,
  high: Location.Accuracy.High,
  highest: Location.Accuracy.Highest,
  navigation: Location.Accuracy.BestForNavigation,
};

const resolveAccuracy = (accuracy) => (
  LOCATION_ACCURACY[accuracy] || Location.Accuracy.High
);

const normalizePermission = ({ canAskAgain, granted, status }) => ({
  canAskAgain,
  granted,
  status,
});

/** @type {import('../../contracts/trackingPlatform.contracts').TrackingLocationProvider} */
export const expoLocationProvider = Object.freeze({
  async getForegroundPermission() {
    return normalizePermission(await Location.getForegroundPermissionsAsync());
  },

  hasLocationServicesEnabled() {
    return Location.hasServicesEnabledAsync();
  },

  async requestForegroundPermission() {
    return normalizePermission(await Location.requestForegroundPermissionsAsync());
  },

  getLastKnownPosition(options) {
    return Location.getLastKnownPositionAsync(options);
  },

  getCurrentPosition({ accuracy, ...options } = {}) {
    return Location.getCurrentPositionAsync({
      ...options,
      accuracy: resolveAccuracy(accuracy),
    });
  },

  watchPosition({ accuracy, ...options }, onPosition, onError) {
    return Location.watchPositionAsync({
      ...options,
      accuracy: resolveAccuracy(accuracy),
    }, onPosition, onError);
  },
});

export default expoLocationProvider;