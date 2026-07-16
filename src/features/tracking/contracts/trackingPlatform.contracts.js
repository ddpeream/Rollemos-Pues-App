/**
 * @typedef {Object} TrackingLocationProvider
 * @property {() => Promise<string>} requestForegroundPermission
 * @property {(options: object) => Promise<object|null>} getLastKnownPosition
 * @property {(options: object) => Promise<object>} getCurrentPosition
 * @property {(options: object, onPosition: Function, onError: Function) => Promise<{remove: Function}>} watchPosition
 */

/**
 * @typedef {Object} TrackingMapController
 * @property {(region: object, durationMs?: number) => void} animateToRegion
 */

/**
 * @typedef {Object} TrackingBackgroundProvider
 * @property {() => Promise<boolean>} isAvailable
 * @property {(options: object) => Promise<void>} start
 * @property {() => Promise<void>} stop
 */

export {};
