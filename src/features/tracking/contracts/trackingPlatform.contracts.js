// @ts-check

/** @typedef {import('./tracking.contracts').TrackingLocationPermission} TrackingLocationPermission */
/** @typedef {import('./tracking.contracts').TrackingLocationSample} TrackingLocationSample */

/**
 * @typedef {'balanced'|'high'|'highest'|'navigation'} TrackingLocationAccuracy
 */

/**
 * @typedef {Object} TrackingLocationRequestOptions
 * @property {TrackingLocationAccuracy} [accuracy]
 * @property {number} [distanceInterval]
 * @property {number} [timeInterval]
 */

/**
 * @typedef {Object} TrackingLastKnownLocationOptions
 * @property {number} [maxAge]
 * @property {number} [requiredAccuracy]
 */

/**
 * @typedef {Object} TrackingLocationSubscription
 * @property {() => void} remove
 */

/**
 * @callback TrackingLocationCallback
 * @param {TrackingLocationSample} sample
 * @returns {void}
 */

/**
 * @callback TrackingLocationErrorCallback
 * @param {string} reason
 * @returns {void}
 */

/**
 * @typedef {Object} TrackingLocationProvider
 * @property {() => Promise<TrackingLocationPermission>} getForegroundPermission
 * @property {() => Promise<boolean>} hasLocationServicesEnabled
 * @property {() => Promise<TrackingLocationPermission>} requestForegroundPermission
 * @property {(options?: TrackingLastKnownLocationOptions) => Promise<TrackingLocationSample|null>} getLastKnownPosition
 * @property {(options?: TrackingLocationRequestOptions) => Promise<TrackingLocationSample>} getCurrentPosition
 * @property {(options: TrackingLocationRequestOptions, onPosition: TrackingLocationCallback, onError?: TrackingLocationErrorCallback) => Promise<TrackingLocationSubscription>} watchPosition
 */

/**
 * @typedef {Object} TrackingMapRegion
 * @property {number} latitude
 * @property {number} longitude
 * @property {number} latitudeDelta
 * @property {number} longitudeDelta
 */

/**
 * @typedef {Object} TrackingMapController
 * @property {(region: TrackingMapRegion, durationMs?: number) => boolean} animateToRegion
 */

/**
 * @typedef {Object} TrackingBackgroundOptions
 * @property {TrackingLocationAccuracy} accuracy
 * @property {number} distanceInterval
 * @property {number} timeInterval
 */

/**
 * @typedef {Object} TrackingBackgroundProvider
 * @property {() => Promise<boolean>} isAvailable
 * @property {(options: TrackingBackgroundOptions) => Promise<void>} start
 * @property {() => Promise<void>} stop
 */

export {};