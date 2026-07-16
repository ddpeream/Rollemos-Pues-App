// @ts-check

import * as Location from 'expo-location';
import {
  normalizeExpoLocationPermission,
  resolveExpoLocationAccuracy,
} from './expoLocation.logic';

/** @type {import('../../contracts/trackingPlatform.contracts').TrackingLocationProvider} */
export const expoLocationProvider = Object.freeze({
  async getForegroundPermission() {
    return normalizeExpoLocationPermission(await Location.getForegroundPermissionsAsync());
  },

  hasLocationServicesEnabled() {
    return Location.hasServicesEnabledAsync();
  },

  async requestForegroundPermission() {
    return normalizeExpoLocationPermission(await Location.requestForegroundPermissionsAsync());
  },

  getLastKnownPosition(options) {
    return Location.getLastKnownPositionAsync(options);
  },

  getCurrentPosition({ accuracy, ...options } = {}) {
    return Location.getCurrentPositionAsync({
      ...options,
      accuracy: resolveExpoLocationAccuracy(accuracy),
    });
  },

  watchPosition({ accuracy, ...options }, onPosition, onError) {
    return Location.watchPositionAsync({
      ...options,
      accuracy: resolveExpoLocationAccuracy(accuracy),
    }, onPosition, onError);
  },
});

export default expoLocationProvider;