// @ts-check

/**
 * @typedef {Object} TrackingLiveProfile
 * @property {string} id
 * @property {string|null} avatar_url
 * @property {string|null} ciudad
 * @property {string|null} disciplina
 * @property {string|null} nivel
 * @property {string|null} nombre
 */

/**
 * @typedef {Object} TrackingLiveCheckpoint
 * @property {import('./tracking.contracts').TrackingCoordinate} coordinate
 * @property {number} publishedAt
 * @property {string|null} routeId
 * @property {string} userId
 */

/**
 * @typedef {Object} TrackingLiveDiagnostic
 * @property {number} attemptedAt
 * @property {string|null} error
 * @property {boolean} ok
 * @property {boolean} published
 * @property {string} reason
 * @property {string|null} routeId
 * @property {string|null} userId
 */

/**
 * @typedef {Object} TrackingLiveConnectionState
 * @property {number} initialFetchCount
 * @property {number|null} lastEventAt
 * @property {number|null} lastSynchronizedAt
 * @property {'IDLE'|'CONNECTING'|'SUBSCRIBED'|'TIMED_OUT'|'CLOSED'|'CHANNEL_ERROR'} status
 */

/**
 * @typedef {Object} TrackingLiveState
 * @property {Record<string, import('./tracking.contracts').TrackingCoordinate[]>} livePaths
 * @property {import('./tracking.contracts').TrackingLiveSkater[]} liveSkaters
 */

export {};
