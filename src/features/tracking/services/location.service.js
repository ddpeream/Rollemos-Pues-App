import { trackingLocationProvider } from '../platform/location';

const LOCATION_WATCH_OPTIONS = {
  accuracy: 'navigation',
  distanceInterval: 1,
  timeInterval: 1000,
};

const LAST_KNOWN_OPTIONS = {
  maxAge: 120000,
  requiredAccuracy: 200,
};

const CURRENT_POSITION_OPTIONS = {
  accuracy: 'highest',
};

export const getTrackingForegroundPermission = () => (
  trackingLocationProvider.getForegroundPermission()
);

export const hasTrackingLocationServicesEnabled = () => (
  trackingLocationProvider.hasLocationServicesEnabled()
);

export const requestTrackingLocationPermission = () => (
  trackingLocationProvider.requestForegroundPermission()
);

export const getLastKnownTrackingPosition = () => (
  trackingLocationProvider.getLastKnownPosition(LAST_KNOWN_OPTIONS)
);

export const getCurrentTrackingPosition = () => (
  trackingLocationProvider.getCurrentPosition(CURRENT_POSITION_OPTIONS)
);

export const watchTrackingPosition = (onPosition, onError) => (
  trackingLocationProvider.watchPosition(LOCATION_WATCH_OPTIONS, onPosition, onError)
);