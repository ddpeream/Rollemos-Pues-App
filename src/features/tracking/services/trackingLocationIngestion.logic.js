import { processTrackingLocationPosition } from '../normalizers/location.normalizer';
import { useTrackingStore } from '../store/trackingStore';

export const ingestTrackingLocationPosition = ({
  options = {},
  position,
  reportRejection = true,
}) => {
  const state = useTrackingStore.getState();
  const { coordinate, error } = processTrackingLocationPosition({
    ...options,
    position,
    previousCoordinate: state.currentLocation,
  });

  if (!coordinate) {
    if (reportRejection) state.rejectTrackingLocation(error);
    return null;
  }

  return state.acceptTrackingLocation(coordinate) ? coordinate : null;
};
