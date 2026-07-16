// @ts-check

import { normalizeTrackingCoordinate } from './location.normalizer';

/** @typedef {import('../contracts/tracking.contracts').TrackingCoordinate} TrackingCoordinate */
/** @typedef {import('../contracts/tracking.contracts').TrackingLiveSkater} TrackingLiveSkater */
/** @typedef {import('../contracts/trackingLive.contracts').TrackingLiveProfile} TrackingLiveProfile */

/**
 * @param {any} value
 * @param {number} [fallbackTimestamp]
 * @returns {TrackingCoordinate|null}
 */
export const normalizeTrackingLiveCoordinate = (value, fallbackTimestamp = Date.now()) => (
  normalizeTrackingCoordinate({
    accuracy: value?.accuracy,
    altitude: value?.altitude,
    altitudeAccuracy: value?.altitudeAccuracy,
    heading: Number(value?.heading),
    latitude: Number(value?.latitude),
    longitude: Number(value?.longitude),
    speed: value?.speed == null ? null : Number(value.speed),
    timestamp: Number.isFinite(value?.timestamp) ? value.timestamp : fallbackTimestamp,
  }, { fallbackTimestamp })
);

/**
 * @param {any} record
 * @returns {TrackingLiveProfile|null}
 */
export const normalizeTrackingLiveProfile = (record) => {
  if (typeof record?.id !== 'string' || !record.id) return null;

  const optionalText = (value) => (
    typeof value === 'string' && value.trim() ? value : null
  );

  return {
    avatar_url: optionalText(record.avatar_url),
    ciudad: optionalText(record.ciudad),
    disciplina: optionalText(record.disciplina),
    id: record.id,
    nivel: optionalText(record.nivel),
    nombre: optionalText(record.nombre),
  };
};

/**
 * @param {any} record
 * @returns {TrackingLiveSkater|null}
 */
export const normalizeTrackingLiveSkater = (record) => {
  if (typeof record?.user_id !== 'string' || !record.user_id) return null;

  const updatedAtTimestamp = Date.parse(record.updated_at);
  if (!Number.isFinite(updatedAtTimestamp)) return null;

  const coordinate = normalizeTrackingLiveCoordinate({
    heading: record.heading,
    latitude: record.lat,
    longitude: record.lng,
    speed: record.speed,
    timestamp: updatedAtTimestamp,
  }, updatedAtTimestamp);

  if (!coordinate) return null;

  return {
    coordinate,
    heading: coordinate.heading,
    isActive: record.is_active === true,
    speed: coordinate.speed,
    updatedAt: new Date(updatedAtTimestamp).toISOString(),
    user: normalizeTrackingLiveProfile(record.usuarios),
    userId: record.user_id,
  };
};
