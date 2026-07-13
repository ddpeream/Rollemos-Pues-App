import {
  TRACKING_ERROR,
  TRACKING_LOCATION_FILTER,
  TRACKING_LOCATION_REJECTION,
} from '../constants/tracking.constants';
import { getDistanceBetweenCoordinates } from '../utils/distance.utils';

/** @typedef {import('../contracts/tracking.contracts').TrackingCoordinate} TrackingCoordinate */

const isFiniteNumber = (value) => Number.isFinite(value);

export const hasValidTrackingCoordinates = (coords) => (
  isFiniteNumber(coords?.latitude)
  && isFiniteNumber(coords?.longitude)
  && coords.latitude >= -90
  && coords.latitude <= 90
  && coords.longitude >= -180
  && coords.longitude <= 180
);

/** @returns {TrackingCoordinate|null} */
export const normalizeTrackingLocationPosition = (position, now = Date.now()) => {
  if (!hasValidTrackingCoordinates(position?.coords)) return null;

  const { coords } = position;
  const timestamp = isFiniteNumber(position.timestamp) ? position.timestamp : now;

  return {
    accuracy: isFiniteNumber(coords.accuracy) ? coords.accuracy : null,
    altitude: isFiniteNumber(coords.altitude) ? coords.altitude : null,
    altitudeAccuracy: isFiniteNumber(coords.altitudeAccuracy) ? coords.altitudeAccuracy : null,
    heading: isFiniteNumber(coords.heading) && coords.heading >= 0 ? coords.heading % 360 : 0,
    latitude: coords.latitude,
    longitude: coords.longitude,
    speed: isFiniteNumber(coords.speed) && coords.speed >= 0 ? coords.speed : null,
    timestamp,
  };
};

export const processTrackingLocationPosition = ({
  allowStale = false,
  maxAccuracyMeters = TRACKING_LOCATION_FILTER.MAX_ACCURACY_METERS,
  now = Date.now(),
  position,
  previousCoordinate,
  validateJump = true,
}) => {
  const coordinate = normalizeTrackingLocationPosition(position, now);

  if (!coordinate) {
    return {
      coordinate: null,
      error: TRACKING_ERROR.LOCATION_SAMPLE_INVALID,
      rejection: TRACKING_LOCATION_REJECTION.INVALID_COORDINATE,
    };
  }

  if (coordinate.timestamp > now + TRACKING_LOCATION_FILTER.MAX_FUTURE_SKEW_MS) {
    return {
      coordinate: null,
      error: TRACKING_ERROR.LOCATION_SAMPLE_INVALID,
      rejection: TRACKING_LOCATION_REJECTION.FUTURE_TIMESTAMP,
    };
  }

  if (!allowStale && now - coordinate.timestamp > TRACKING_LOCATION_FILTER.MAX_SAMPLE_AGE_MS) {
    return {
      coordinate: null,
      error: TRACKING_ERROR.LOCATION_SAMPLE_STALE,
      rejection: TRACKING_LOCATION_REJECTION.STALE_TIMESTAMP,
    };
  }

  if (coordinate.accuracy !== null && coordinate.accuracy > maxAccuracyMeters) {
    return {
      coordinate: null,
      error: TRACKING_ERROR.LOCATION_ACCURACY_LOW,
      rejection: TRACKING_LOCATION_REJECTION.LOW_ACCURACY,
    };
  }

  if (previousCoordinate?.timestamp && coordinate.timestamp <= previousCoordinate.timestamp) {
    return {
      coordinate: null,
      error: TRACKING_ERROR.LOCATION_SAMPLE_STALE,
      rejection: TRACKING_LOCATION_REJECTION.OUT_OF_ORDER,
    };
  }

  if (validateJump && previousCoordinate?.timestamp) {
    const elapsedSeconds = (coordinate.timestamp - previousCoordinate.timestamp) / 1000;
    const distanceMeters = getDistanceBetweenCoordinates(previousCoordinate, coordinate);
    const impliedSpeed = elapsedSeconds > 0 ? distanceMeters / elapsedSeconds : 0;

    if (impliedSpeed > TRACKING_LOCATION_FILTER.MAX_PLAUSIBLE_SPEED_MPS) {
      return {
        coordinate: null,
        error: TRACKING_ERROR.LOCATION_JUMP_REJECTED,
        rejection: TRACKING_LOCATION_REJECTION.IMPOSSIBLE_JUMP,
      };
    }
  }

  return {
    coordinate,
    error: null,
    rejection: TRACKING_LOCATION_REJECTION.NONE,
  };
};
