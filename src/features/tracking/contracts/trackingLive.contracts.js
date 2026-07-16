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
 * @typedef {Object} TrackingLiveState
 * @property {Record<string, import('./tracking.contracts').TrackingCoordinate[]>} livePaths
 * @property {import('./tracking.contracts').TrackingLiveSkater[]} liveSkaters
 */

export {};
