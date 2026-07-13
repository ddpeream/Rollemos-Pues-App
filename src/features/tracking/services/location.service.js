import { expoLocationProvider } from '../platform/location/expoLocation.provider';

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

export const requestTrackingLocationPermission = () => (
  expoLocationProvider.requestForegroundPermission()
);

export const getLastKnownTrackingPosition = () => (
  expoLocationProvider.getLastKnownPosition(LAST_KNOWN_OPTIONS)
);

export const getCurrentTrackingPosition = () => (
  expoLocationProvider.getCurrentPosition(CURRENT_POSITION_OPTIONS)
);

export const watchTrackingPosition = (onPosition, onError) => (
  expoLocationProvider.watchPosition(LOCATION_WATCH_OPTIONS, onPosition, onError)
);
