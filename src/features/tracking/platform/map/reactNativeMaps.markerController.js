// @ts-check

import { Platform } from 'react-native';

/** @typedef {import('../../contracts/tracking.contracts').TrackingCoordinate} TrackingCoordinate */
/** @typedef {Pick<TrackingCoordinate, 'latitude'|'longitude'>} TrackingMapCoordinate */
/** @typedef {import('../../contracts/trackingPlatform.contracts').TrackingMarkerController} TrackingMarkerController */

/** @param {TrackingCoordinate} coordinate */
const toMapCoordinate = (coordinate) => ({
  latitude: coordinate.latitude,
  longitude: coordinate.longitude,
});

/**
 * Adapter for the imperative marker APIs exposed by react-native-maps.
 * @param {{ current?: { animateMarkerToCoordinate?: (coordinate: TrackingMapCoordinate, durationMs?: number) => void }|null }} markerRef
 * @param {{ current?: {
 *   setValue?: (coordinate: TrackingMapCoordinate) => void,
 *   timing?: (config: TrackingMapCoordinate & { duration: number, useNativeDriver: boolean }) => { start?: () => void }
 * }|null }} animatedCoordinateRef
 * @param {string} [platform]
 * @returns {TrackingMarkerController}
 */
export const createReactNativeMapsMarkerController = (
  markerRef,
  animatedCoordinateRef,
  platform = Platform.OS,
) => Object.freeze({
  animateToCoordinate(coordinate, durationMs = 400) {
    const mapCoordinate = toMapCoordinate(coordinate);
    const marker = markerRef?.current;

    if (platform === 'android' && typeof marker?.animateMarkerToCoordinate === 'function') {
      marker.animateMarkerToCoordinate(mapCoordinate, durationMs);
      return true;
    }

    const animation = animatedCoordinateRef?.current?.timing?.({
      ...mapCoordinate,
      duration: durationMs,
      useNativeDriver: true,
    });
    if (typeof animation?.start !== 'function') return false;

    animation.start();
    return true;
  },

  setCoordinate(coordinate) {
    const setValue = animatedCoordinateRef?.current?.setValue;
    if (typeof setValue !== 'function') return false;

    setValue.call(animatedCoordinateRef.current, toMapCoordinate(coordinate));
    return true;
  },
});

export default createReactNativeMapsMarkerController;
