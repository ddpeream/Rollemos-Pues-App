import {
  TRACKING_BACKGROUND,
  TRACKING_BACKGROUND_RESULT,
} from '../constants/trackingBackground.constants';
import { trackingBackgroundProvider } from '../platform/location';

const BACKGROUND_OPTIONS = {
  accuracy: 'navigation',
  deferredUpdatesDistance: TRACKING_BACKGROUND.DEFERRED_UPDATES_DISTANCE_METERS,
  deferredUpdatesInterval: TRACKING_BACKGROUND.DEFERRED_UPDATES_INTERVAL_MS,
  distanceInterval: TRACKING_BACKGROUND.DISTANCE_INTERVAL_METERS,
  notificationBody: TRACKING_BACKGROUND.NOTIFICATION_BODY,
  notificationTitle: TRACKING_BACKGROUND.NOTIFICATION_TITLE,
  timeInterval: TRACKING_BACKGROUND.TIME_INTERVAL_MS,
};

let backgroundStartPromise = null;

export const ensureTrackingBackgroundPermission = async () => {
  let permission = await trackingBackgroundProvider.getPermission();

  if (!permission.granted && permission.canAskAgain) {
    permission = await trackingBackgroundProvider.requestPermission();
  }

  return permission;
};

const startBackgroundTrackingOperation = async () => {
  if (!await trackingBackgroundProvider.isAvailable()) {
    return {
      reason: TRACKING_BACKGROUND_RESULT.NOT_AVAILABLE,
      started: false,
    };
  }

  if (await trackingBackgroundProvider.isStarted()) {
    return {
      reason: TRACKING_BACKGROUND_RESULT.ALREADY_STARTED,
      started: true,
    };
  }

  const permission = await ensureTrackingBackgroundPermission();
  if (!permission.granted) {
    return {
      reason: TRACKING_BACKGROUND_RESULT.PERMISSION_DENIED,
      started: false,
    };
  }

  await trackingBackgroundProvider.start(BACKGROUND_OPTIONS);

  return {
    reason: TRACKING_BACKGROUND_RESULT.STARTED,
    started: true,
  };
};

export const startBackgroundTracking = () => {
  if (!backgroundStartPromise) {
    backgroundStartPromise = startBackgroundTrackingOperation()
      .finally(() => {
        backgroundStartPromise = null;
      });
  }

  return backgroundStartPromise;
};

export const stopBackgroundTracking = async () => {
  if (backgroundStartPromise) {
    await backgroundStartPromise.catch(() => undefined);
  }

  if (!await trackingBackgroundProvider.isAvailable()) {
    return {
      reason: TRACKING_BACKGROUND_RESULT.NOT_AVAILABLE,
      stopped: true,
    };
  }

  await trackingBackgroundProvider.stop();

  return {
    reason: TRACKING_BACKGROUND_RESULT.STOPPED,
    stopped: true,
  };
};
