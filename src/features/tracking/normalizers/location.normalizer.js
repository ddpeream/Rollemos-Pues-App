// @ts-check

import {
  TRACKING_ERROR,
  TRACKING_LOCATION_FILTER,
  TRACKING_LOCATION_REJECTION,
} from '../constants/tracking.constants';
import { getDistanceBetweenCoordinates } from '../utils/distance.utils';

/** @typedef {import('../contracts/tracking.contracts').TrackingCoordinate} TrackingCoordinate */
/** @typedef {import('../contracts/tracking.contracts').TrackingLocationSample} TrackingLocationSample */

/** @param {unknown} value */
const isFiniteNumber = (value) => Number.isFinite(value);

/** @param {Partial<TrackingCoordinate>|null|undefined} coordinate */
export const hasValidTrackingCoordinates = (coordinate) => (
  isFiniteNumber(coordinate?.latitude)
  && isFiniteNumber(coordinate?.longitude)
  && coordinate.latitude >= -90
  && coordinate.latitude <= 90
  && coordinate.longitude >= -180
  && coordinate.longitude <= 180
);

/**
 * Canonical coordinate normalizer shared by every tracking boundary.
 * @param {Partial<TrackingCoordinate>|null|undefined} value
 * @param {{ fallbackTimestamp?: number|null }} [options]
 * @returns {TrackingCoordinate|null}
 */
export const normalizeTrackingCoordinate = (
  value,
  { fallbackTimestamp = Date.now() } = {},
) => {
  if (!hasValidTrackingCoordinates(value)) return null;

  const timestamp = isFiniteNumber(value?.timestamp)
    ? Number(value.timestamp)
    : fallbackTimestamp;

  if (!isFiniteNumber(timestamp)) return null;

  return {
    accuracy: isFiniteNumber(value?.accuracy) ? Number(value.accuracy) : null,
    altitude: isFiniteNumber(value?.altitude) ? Number(value.altitude) : null,
    altitudeAccuracy: isFiniteNumber(value?.altitudeAccuracy)
      ? Number(value.altitudeAccuracy)
      : null,
    heading: isFiniteNumber(value?.heading) && Number(value.heading) >= 0
      ? Number(value.heading) % 360
      : 0,
    latitude: Number(value?.latitude),
    longitude: Number(value?.longitude),
    speed: isFiniteNumber(value?.speed) && Number(value.speed) >= 0
      ? Number(value.speed)
      : null,
    timestamp: Number(timestamp),
  };
};

/**
 * Converts a provider-neutral GPS sample into the canonical domain coordinate.
 * @param {TrackingLocationSample|null|undefined} position
 * @param {number} [now]
 * @returns {TrackingCoordinate|null}
 */
export const normalizeTrackingLocationPosition = (position, now = Date.now()) => {
  if (!position?.coords) return null;

  return normalizeTrackingCoordinate({
    ...position.coords,
    timestamp: position.timestamp,
  }, { fallbackTimestamp: now });
};

/**
 * @param {{
 *   allowStale?: boolean,
 *   maxAccuracyMeters?: number,
 *   now?: number,
 *   position: TrackingLocationSample|null|undefined,
 *   previousCoordinate?: TrackingCoordinate|null,
 *   validateJump?: boolean
 * }} input
 */
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

  if (
    coordinate.speed !== null
    && coordinate.speed > TRACKING_LOCATION_FILTER.MAX_REPORTED_SPEED_MPS
  ) {
    return {
      coordinate: null,
      error: TRACKING_ERROR.LOCATION_SPEED_INVALID,
      rejection: TRACKING_LOCATION_REJECTION.IMPLAUSIBLE_SPEED,
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