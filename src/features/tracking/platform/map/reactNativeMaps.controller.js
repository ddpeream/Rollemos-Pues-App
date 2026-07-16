// @ts-check

/** @typedef {import('../../contracts/trackingPlatform.contracts').TrackingMapController} TrackingMapController */
/** @typedef {import('../../contracts/trackingPlatform.contracts').TrackingMapFitOptions} TrackingMapFitOptions */
/** @typedef {import('../../contracts/trackingPlatform.contracts').TrackingMapRegion} TrackingMapRegion */
/** @typedef {import('../../contracts/tracking.contracts').TrackingCoordinate} TrackingCoordinate */

/**
 * Adapter for the imperative controller exposed by react-native-maps.
 * @param {{ current?: {
 *   animateToRegion?: (region: TrackingMapRegion, durationMs?: number) => void,
 *   fitToCoordinates?: (coordinates: TrackingCoordinate[], options?: TrackingMapFitOptions) => void
 * }|null }|null} mapRef
 * @returns {TrackingMapController}
 */
export const createReactNativeMapsController = (mapRef) => Object.freeze({
  animateToRegion(region, durationMs = 500) {
    const animateToRegion = mapRef?.current?.animateToRegion;
    if (typeof animateToRegion !== 'function') return false;

    animateToRegion.call(mapRef.current, region, durationMs);
    return true;
  },

  fitToCoordinates(coordinates, options) {
    const fitToCoordinates = mapRef?.current?.fitToCoordinates;
    if (typeof fitToCoordinates !== 'function' || !Array.isArray(coordinates)) return false;
    if (coordinates.length < 2) return false;

    fitToCoordinates.call(mapRef.current, coordinates, options);
    return true;
  },
});

export default createReactNativeMapsController;
