// @ts-check

import { hasValidTrackingCoordinates } from '../normalizers/location.normalizer';
import { getDistanceBetweenCoordinates, getRouteDistance } from '../utils/distance.utils';
import { shouldAppendRouteCoordinate } from '../utils/route.utils';
import { getMaxSpeedKmh } from '../utils/speed.utils';

/** @typedef {import('../contracts/tracking.contracts').TrackingCoordinate} TrackingCoordinate */
/** @typedef {import('../contracts/tracking.contracts').TrackingRouteSegment} TrackingRouteSegment */

const toTimestamp = (value, fallback = Date.now()) => (
  Number.isFinite(value) ? Number(value) : fallback
);

/**
 * @param {TrackingCoordinate} coordinate
 * @param {number} [startedAt]
 * @returns {TrackingRouteSegment|null}
 */
export const createRouteSegment = (coordinate, startedAt = Date.now()) => {
  if (!hasValidTrackingCoordinates(coordinate)) return null;

  return {
    coordinates: [coordinate],
    endedAt: null,
    startedAt: toTimestamp(startedAt, coordinate.timestamp),
  };
};

/**
 * @param {TrackingRouteSegment[]} routeSegments
 * @param {TrackingCoordinate} coordinate
 */
export const appendRouteCoordinate = (routeSegments, coordinate) => {
  if (!Array.isArray(routeSegments) || routeSegments.length === 0) return null;

  const activeSegment = routeSegments[routeSegments.length - 1];
  if (activeSegment.endedAt !== null || !Array.isArray(activeSegment.coordinates)) return null;

  const previousCoordinate = activeSegment.coordinates[activeSegment.coordinates.length - 1] || null;
  if (!shouldAppendRouteCoordinate(activeSegment.coordinates, coordinate)) {
    return {
      appended: false,
      distanceDelta: 0,
      previousCoordinate,
      routeSegments,
    };
  }

  const nextSegment = {
    ...activeSegment,
    coordinates: [...activeSegment.coordinates, coordinate],
  };

  return {
    appended: true,
    distanceDelta: getDistanceBetweenCoordinates(previousCoordinate, coordinate),
    previousCoordinate,
    routeSegments: [...routeSegments.slice(0, -1), nextSegment],
  };
};

/**
 * @param {TrackingRouteSegment[]} routeSegments
 * @param {number} [endedAt]
 * @returns {TrackingRouteSegment[]}
 */
export const closeActiveRouteSegment = (routeSegments, endedAt = Date.now()) => {
  if (!Array.isArray(routeSegments) || routeSegments.length === 0) return [];

  const activeSegment = routeSegments[routeSegments.length - 1];
  if (activeSegment.endedAt !== null) return routeSegments;

  return [
    ...routeSegments.slice(0, -1),
    { ...activeSegment, endedAt: toTimestamp(endedAt) },
  ];
};

/**
 * @param {TrackingRouteSegment[]} routeSegments
 * @param {TrackingCoordinate} coordinate
 * @param {number} [startedAt]
 * @returns {TrackingRouteSegment[]|null}
 */
export const openRouteSegment = (routeSegments, coordinate, startedAt = Date.now()) => {
  const segment = createRouteSegment(coordinate, startedAt);
  if (!segment) return null;

  return [...closeActiveRouteSegment(routeSegments, startedAt), segment];
};

/** @param {TrackingRouteSegment[]} routeSegments */
export const flattenRouteSegments = (routeSegments) => (
  Array.isArray(routeSegments)
    ? routeSegments.flatMap((segment) => (
      Array.isArray(segment?.coordinates) ? segment.coordinates : []
    ))
    : []
);

/** @param {TrackingRouteSegment[]} routeSegments */
export const getRoutePointCount = (routeSegments) => (
  Array.isArray(routeSegments)
    ? routeSegments.reduce((count, segment) => count + (segment?.coordinates?.length || 0), 0)
    : 0
);

/** @param {TrackingRouteSegment[]} routeSegments */
export const getLastRouteCoordinate = (routeSegments) => {
  if (!Array.isArray(routeSegments)) return null;

  for (let index = routeSegments.length - 1; index >= 0; index -= 1) {
    const coordinates = routeSegments[index]?.coordinates;
    if (Array.isArray(coordinates) && coordinates.length > 0) {
      return coordinates[coordinates.length - 1];
    }
  }

  return null;
};

/** @param {TrackingRouteSegment[]} routeSegments */
export const getRouteDistanceFromSegments = (routeSegments) => (
  Array.isArray(routeSegments)
    ? routeSegments.reduce(
      (distance, segment) => distance + getRouteDistance(segment?.coordinates),
      0,
    )
    : 0
);

/** @param {TrackingRouteSegment[]} routeSegments */
export const getRouteMaxSpeedFromSegments = (routeSegments) => (
  Array.isArray(routeSegments)
    ? routeSegments.reduce(
      (maxSpeed, segment) => Math.max(maxSpeed, getMaxSpeedKmh(segment?.coordinates)),
      0,
    )
    : 0
);

/** @param {TrackingRouteSegment[]} routeSegments */
export const getRouteSegmentPointCounts = (routeSegments) => (
  Array.isArray(routeSegments)
    ? routeSegments.map((segment) => segment?.coordinates?.length || 0)
    : []
);
