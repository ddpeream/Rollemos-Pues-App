// @ts-check

/** @typedef {import('./tracking.contracts').TrackingCoordinate} TrackingCoordinate */
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
 * @property {(coordinates: TrackingCoordinate[], options?: TrackingMapFitOptions) => boolean} fitToCoordinates
 */

/**
 * @typedef {Object} TrackingMapEdgePadding
 * @property {number} bottom
 * @property {number} left
 * @property {number} right
 * @property {number} top
 */

/**
 * @typedef {Object} TrackingMapFitOptions
 * @property {boolean} [animated]
 * @property {TrackingMapEdgePadding} [edgePadding]
 */

/**
 * @typedef {Object} TrackingMarkerController
 * @property {(coordinate: TrackingCoordinate, durationMs?: number) => boolean} animateToCoordinate
 * @property {(coordinate: TrackingCoordinate) => boolean} setCoordinate
 */

/**
 * @typedef {Object} TrackingBackgroundOptions
 * @property {TrackingLocationAccuracy} accuracy
 * @property {number} deferredUpdatesDistance
 * @property {number} deferredUpdatesInterval
 * @property {number} distanceInterval
 * @property {string} notificationBody
 * @property {string} notificationTitle
 * @property {number} timeInterval
 */

/**
 * @typedef {Object} TrackingBackgroundProvider
 * @property {() => Promise<TrackingLocationPermission>} getPermission
 * @property {() => Promise<boolean>} isAvailable
 * @property {() => Promise<boolean>} isStarted
 * @property {() => Promise<TrackingLocationPermission>} requestPermission
 * @property {(options: TrackingBackgroundOptions) => Promise<void>} start
 * @property {() => Promise<void>} stop
 */

export {};