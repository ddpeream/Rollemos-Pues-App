import * as Location from 'expo-location';

const LOCATION_WATCH_OPTIONS = {
  accuracy: Location.Accuracy.BestForNavigation,
  distanceInterval: 1,
  timeInterval: 1000,
};

const LAST_KNOWN_OPTIONS = {
  maxAge: 120000,
  requiredAccuracy: 200,
};

const CURRENT_POSITION_OPTIONS = {
  accuracy: Location.Accuracy.Highest,
};

export const requestTrackingLocationPermission = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status;
};

export const getLastKnownTrackingPosition = () => (
  Location.getLastKnownPositionAsync(LAST_KNOWN_OPTIONS)
);

export const getCurrentTrackingPosition = () => (
  Location.getCurrentPositionAsync(CURRENT_POSITION_OPTIONS)
);

export const watchTrackingPosition = (onPosition, onError) => (
  Location.watchPositionAsync(LOCATION_WATCH_OPTIONS, onPosition, onError)
);
