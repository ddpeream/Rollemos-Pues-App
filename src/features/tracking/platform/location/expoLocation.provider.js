import * as Location from 'expo-location';

const LOCATION_ACCURACY = {
  highest: Location.Accuracy.Highest,
  navigation: Location.Accuracy.BestForNavigation,
};

const resolveAccuracy = (accuracy) => (
  LOCATION_ACCURACY[accuracy] || Location.Accuracy.High
);

/** @type {import('../../contracts/trackingPlatform.contracts').TrackingLocationProvider} */
export const expoLocationProvider = Object.freeze({
  async requestForegroundPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status;
  },

  getLastKnownPosition(options) {
    return Location.getLastKnownPositionAsync(options);
  },

  getCurrentPosition({ accuracy, ...options }) {
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
