/**
 * @typedef {Object} TrackingCoordinate
 * @property {number} latitude
 * @property {number} longitude
 * @property {number|null} accuracy
 * @property {number|null} altitude
 * @property {number|null} altitudeAccuracy
 * @property {number} heading
 * @property {number|null} speed
 * @property {number} timestamp
 */

/**
 * @typedef {Object} TrackingMetrics
 * @property {number} avgSpeed
 * @property {number} calories
 * @property {number} distance
 * @property {number} duration
 * @property {number} maxSpeed
 * @property {number} speed
 */

/**
 * @typedef {Object} TrackingRouteSegment
 * @property {TrackingCoordinate[]} coordinates
 * @property {number} startedAt
 * @property {number|null} endedAt
 */

/**
 * @typedef {Object} TrackingSessionSnapshot
 * @property {TrackingCoordinate|null} currentLocation
 * @property {TrackingMetrics} metrics
 * @property {number|null} pausedAt
 * @property {TrackingCoordinate[]} routeCoordinates
 * @property {TrackingCoordinate|null} startFlag
 * @property {number|null} startedAt
 * @property {'idle'|'tracking'|'paused'} status
 * @property {number} totalPausedMs
 */

export {};
