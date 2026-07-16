// @ts-check

import * as Location from 'expo-location';

const LOCATION_ACCURACY = {
  balanced: Location.Accuracy.Balanced,
  high: Location.Accuracy.High,
  highest: Location.Accuracy.Highest,
  navigation: Location.Accuracy.BestForNavigation,
};

export const resolveExpoLocationAccuracy = (accuracy) => (
  LOCATION_ACCURACY[accuracy] || Location.Accuracy.High
);

export const normalizeExpoLocationPermission = ({ canAskAgain, granted, status }) => ({
  canAskAgain,
  granted,
  status,
});
