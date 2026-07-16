// @ts-check

/**
 * @typedef {Object} TrackingStoredRouteRow
 * @property {string} id
 * @property {string} status
 * @property {number} is_active
 * @property {number} storage_version
 * @property {number} created_at
 * @property {number} updated_at
 * @property {number} started_at
 * @property {number|null} ended_at
 * @property {number|null} paused_at
 * @property {number} total_paused_ms
 * @property {number} distance
 * @property {number} duration
 * @property {number} speed
 * @property {number} avg_speed
 * @property {number} max_speed
 * @property {number} calories
 * @property {number} points_count
 * @property {string|null} current_coordinate
 * @property {string|null} start_coordinate
 * @property {string|null} end_coordinate
 * @property {string} preview_segments
 */

/**
 * @typedef {Object} TrackingStoredSegmentRow
 * @property {string} route_id
 * @property {number} segment_index
 * @property {number} started_at
 * @property {number|null} ended_at
 * @property {number} points_count
 */

/**
 * @typedef {Object} TrackingStoredPointRow
 * @property {string} route_id
 * @property {number} segment_index
 * @property {number} point_index
 * @property {number} latitude
 * @property {number} longitude
 * @property {number|null} accuracy
 * @property {number|null} altitude
 * @property {number|null} altitude_accuracy
 * @property {number} heading
 * @property {number|null} speed
 * @property {number} timestamp
 */

/**
 * @typedef {Object} TrackingStoredBackgroundPointRow
 * @property {number} id
 * @property {string} route_id
 * @property {number} latitude
 * @property {number} longitude
 * @property {number|null} accuracy
 * @property {number|null} altitude
 * @property {number|null} altitude_accuracy
 * @property {number} heading
 * @property {number|null} speed
 * @property {number} timestamp
 * @property {number} created_at
 */

/**
 * @typedef {Object} TrackingStoredLiveCheckpointRow
 * @property {string} user_id
 * @property {string|null} route_id
 * @property {number} latitude
 * @property {number} longitude
 * @property {number} heading
 * @property {number|null} speed
 * @property {number} coordinate_timestamp
 * @property {number} published_at
 */

export {};
