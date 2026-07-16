import { TRACKING_STATUS } from '../constants/tracking.constants';
import { useTrackingStore } from '../store/trackingStore';
import {
  acknowledgeTrackingBackgroundPoints,
  loadTrackingBackgroundPoints,
} from './trackingBackgroundBuffer.service';
import { ingestTrackingLocationPosition } from './trackingLocationIngestion.logic';

const toLocationSample = (coordinate) => ({
  coords: {
    accuracy: coordinate.accuracy,
    altitude: coordinate.altitude,
    altitudeAccuracy: coordinate.altitudeAccuracy,
    heading: coordinate.heading,
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    speed: coordinate.speed,
  },
  timestamp: coordinate.timestamp,
});

export const reconcileTrackingBackgroundPoints = async ({ persistSession }) => {
  const session = useTrackingStore.getState();
  if (
    session.status !== TRACKING_STATUS.TRACKING
    || !Number.isFinite(session.startedAt)
  ) {
    return { accepted: 0, processed: 0 };
  }

  const { points, routeId } = await loadTrackingBackgroundPoints(session.startedAt);
  if (!routeId || points.length === 0) {
    return { accepted: 0, processed: 0 };
  }

  let accepted = 0;

  points.forEach(({ coordinate }) => {
    const acceptedCoordinate = ingestTrackingLocationPosition({
      options: { allowStale: true },
      position: toLocationSample(coordinate),
      reportRejection: false,
    });

    if (acceptedCoordinate) accepted += 1;
  });

  if (accepted > 0) {
    const persisted = await persistSession();
    if (!persisted) {
      throw new Error('tracking_background_persist_failed');
    }
  }

  await acknowledgeTrackingBackgroundPoints({
    maxId: points[points.length - 1].id,
    routeId,
  });

  return { accepted, processed: points.length };
};
