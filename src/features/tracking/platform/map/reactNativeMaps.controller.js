// @ts-check

/** @typedef {import('../../contracts/trackingPlatform.contracts').TrackingMapController} TrackingMapController */
/** @typedef {import('../../contracts/trackingPlatform.contracts').TrackingMapRegion} TrackingMapRegion */

/**
 * Adapter for the imperative controller exposed by react-native-maps.
 * @param {{ current?: { animateToRegion?: (region: TrackingMapRegion, durationMs?: number) => void }|null }|null} mapRef
 * @returns {TrackingMapController}
 */
export const createReactNativeMapsController = (mapRef) => Object.freeze({
  animateToRegion(region, durationMs = 500) {
    const animateToRegion = mapRef?.current?.animateToRegion;
    if (typeof animateToRegion !== 'function') return false;

    animateToRegion.call(mapRef.current, region, durationMs);
    return true;
  },
});

export default createReactNativeMapsController;
