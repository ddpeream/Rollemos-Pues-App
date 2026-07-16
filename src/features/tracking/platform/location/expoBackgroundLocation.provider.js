// @ts-check

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { TRACKING_BACKGROUND } from '../../constants/trackingBackground.constants';
import {
  normalizeExpoLocationPermission,
  resolveExpoLocationAccuracy,
} from './expoLocation.logic';

/** @type {import('../../contracts/trackingPlatform.contracts').TrackingBackgroundProvider} */
export const expoBackgroundLocationProvider = Object.freeze({
  async getPermission() {
    return normalizeExpoLocationPermission(
      await Location.getBackgroundPermissionsAsync(),
    );
  },

  async isAvailable() {
    const [taskManagerAvailable, locationAvailable] = await Promise.all([
      TaskManager.isAvailableAsync(),
      Location.isBackgroundLocationAvailableAsync(),
    ]);

    return taskManagerAvailable && locationAvailable;
  },

  isStarted() {
    return Location.hasStartedLocationUpdatesAsync(TRACKING_BACKGROUND.TASK_NAME);
  },

  async requestPermission() {
    return normalizeExpoLocationPermission(
      await Location.requestBackgroundPermissionsAsync(),
    );
  },

  async start(options) {
    await Location.startLocationUpdatesAsync(TRACKING_BACKGROUND.TASK_NAME, {
      accuracy: resolveExpoLocationAccuracy(options.accuracy),
      deferredUpdatesDistance: options.deferredUpdatesDistance,
      deferredUpdatesInterval: options.deferredUpdatesInterval,
      distanceInterval: options.distanceInterval,
      foregroundService: {
        killServiceOnDestroy: false,
        notificationBody: options.notificationBody,
        notificationTitle: options.notificationTitle,
      },
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: false,
      timeInterval: options.timeInterval,
    });
  },

  async stop() {
    const isStarted = await Location.hasStartedLocationUpdatesAsync(
      TRACKING_BACKGROUND.TASK_NAME,
    );

    if (isStarted) {
      await Location.stopLocationUpdatesAsync(TRACKING_BACKGROUND.TASK_NAME);
    }
  },
});

export default expoBackgroundLocationProvider;
