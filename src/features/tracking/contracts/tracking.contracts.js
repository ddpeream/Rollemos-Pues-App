// @ts-check

/**
 * @typedef {'idle'|'tracking'|'paused'} TrackingSessionStatus
 */

/**
 * @typedef {'granted'|'denied'|'undetermined'} TrackingPermissionStatus
 */
/**
 * @typedef {'idle'|'checking_availability'|'requesting_permission'|'ready'|'unavailable'|'error'} TrackingLocationStatus
 */


/**
 * Provider-neutral foreground location permission.
 * @typedef {Object} TrackingLocationPermission
 * @property {TrackingPermissionStatus} status
 * @property {boolean} granted
 * @property {boolean} canAskAgain
 */

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
 * Provider-neutral GPS coordinates received at the location boundary.
 * @typedef {Object} TrackingLocationSampleCoordinates
 * @property {number} latitude
 * @property {number} longitude
 * @property {number|null|undefined} [accuracy]
 * @property {number|null|undefined} [altitude]
 * @property {number|null|undefined} [altitudeAccuracy]
 * @property {number|null|undefined} [heading]
 * @property {number|null|undefined} [speed]
 */

/**
 * Provider-neutral GPS sample. Platform adapters must return this shape.
 * @typedef {Object} TrackingLocationSample
 * @property {TrackingLocationSampleCoordinates} coords
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
 * @typedef {Object} TrackingRoute
 * @property {string|null} id
 * @property {TrackingRouteSegment[]} routeSegments
 * @property {TrackingMetrics} metrics
 * @property {TrackingCoordinate|null} startCoordinate
 * @property {TrackingCoordinate|null} endCoordinate
 * @property {number} startedAt
 * @property {number|null} endedAt
 */

/**
 * @typedef {Object} TrackingSessionSnapshot
 * @property {TrackingCoordinate|null} currentLocation
 * @property {TrackingMetrics} metrics
 * @property {number|null} pausedAt
 * @property {TrackingRouteSegment[]} routeSegments
 * @property {TrackingCoordinate|null} startFlag
 * @property {number|null} startedAt
 * @property {TrackingSessionStatus} status
 * @property {number} totalPausedMs
 */

/**
 * @typedef {TrackingSessionSnapshot & {
 *   storageVersion: number,
 *   updatedAt: number
 * }} StoredTrackingSession
 */

/**
 * @typedef {Object} StoredTrackingRouteSummary
 * @property {string} id
 * @property {number} avgSpeed
 * @property {number} calories
 * @property {number} chunksCount
 * @property {number} createdAt
 * @property {number} distance
 * @property {number} duration
 * @property {TrackingCoordinate|null} endCoordinate
 * @property {number} endedAt
 * @property {number} maxSpeed
 * @property {number} pointsCount
 * @property {TrackingCoordinate[][]} previewSegments
 * @property {number[]} segmentPointCounts
 * @property {TrackingCoordinate|null} startCoordinate
 * @property {number} startedAt
 * @property {number} storageVersion
 */

/**
 * @typedef {Object} TrackingLiveSkater
 * @property {TrackingCoordinate} coordinate
 * @property {number} heading
 * @property {boolean} isActive
 * @property {number} receivedAt
 * @property {number|null} speed
 * @property {string} updatedAt
 * @property {import('./trackingLive.contracts').TrackingLiveProfile|null} user
 * @property {string} userId
 */

/**
 * @typedef {'location_permission_denied'|'location_permission_failed'|'location_services_disabled'|'tracking_watch_failed'|'tracking_location_hydrate_failed'|'tracking_location_sample_invalid'|'tracking_location_sample_stale'|'tracking_location_accuracy_low'|'tracking_location_speed_invalid'|'tracking_location_jump_rejected'|'tracking_session_save_failed'|'tracking_restore_failed'|'tracking_start_failed'|'tracking_resume_failed'|'route_save_failed'} TrackingErrorCode
 */

/**
 * @typedef {null|'invalid_coordinate'|'future_timestamp'|'stale_timestamp'|'out_of_order'|'low_accuracy'|'implausible_speed'|'impossible_jump'} TrackingLocationRejectionCode
 */

export {};