import {
  TRACKING_STORAGE_META,
  TRACKING_STORAGE_ROUTE_STATUS,
} from '../constants/trackingStorage.constants';
import { getRoutePointCount } from '../store/trackingRoute.logic';
import { getTrackingDatabase } from './trackingDatabase.service';
import {
  clearLegacyTrackingStorage,
  loadLegacyTrackingStorage,
} from './trackingLegacyStorage.service';
import { createTrackingRouteId } from './trackingStorage.logic';
import { writeTrackingRouteSnapshot } from './trackingRouteWriter.service';

let storageReadyPromise = null;

const createCompletedRouteSnapshot = (route) => ({
  currentLocation: route.endCoordinate,
  metrics: {
    avgSpeed: route.avgSpeed,
    calories: route.calories,
    distance: route.distance,
    duration: route.duration,
    maxSpeed: route.maxSpeed,
    speed: 0,
  },
  pausedAt: null,
  routeSegments: route.routeSegments,
  startFlag: route.startCoordinate,
  startedAt: route.startedAt,
  status: TRACKING_STORAGE_ROUTE_STATUS.COMPLETED,
  totalPausedMs: 0,
  updatedAt: route.endedAt,
});

const verifyMigratedRoute = async (transaction, {
  id,
  pointsCount,
  segmentsCount,
  status,
}) => {
  const route = await transaction.getFirstAsync(
    `SELECT
       status,
       points_count,
       (SELECT COUNT(*) FROM tracking_route_points WHERE route_id = ?) AS stored_points,
       (SELECT COUNT(*) FROM tracking_route_segments WHERE route_id = ?) AS stored_segments
     FROM tracking_routes
     WHERE id = ?
     LIMIT 1`,
    id,
    id,
    id,
  );

  if (
    !route
    || route.status !== status
    || Number(route.points_count) !== pointsCount
    || Number(route.stored_points) !== pointsCount
    || Number(route.stored_segments) !== segmentsCount
  ) {
    throw new Error('tracking_legacy_migration_verification_failed');
  }
};

const migrateLegacyStorage = async (database) => {
  const migrationMarker = await database.getFirstAsync(
    'SELECT value FROM tracking_storage_meta WHERE key = ? LIMIT 1',
    TRACKING_STORAGE_META.LEGACY_MIGRATION_KEY,
  );
  if (migrationMarker?.value === TRACKING_STORAGE_META.LEGACY_MIGRATION_VALUE) return;

  const legacyStorage = await loadLegacyTrackingStorage();
  const activeRouteId = legacyStorage.activeSession
    ? createTrackingRouteId(legacyStorage.activeSession.startedAt)
    : null;

  if (activeRouteId && legacyStorage.routes.some((route) => route.id === activeRouteId)) {
    throw new Error('tracking_legacy_route_id_collision');
  }

  await database.withExclusiveTransactionAsync(async (transaction) => {
    for (const route of legacyStorage.routes) {
      await writeTrackingRouteSnapshot(transaction, {
        id: route.id,
        isActive: false,
        snapshot: createCompletedRouteSnapshot(route),
        status: TRACKING_STORAGE_ROUTE_STATUS.COMPLETED,
        summary: route,
      });
      await verifyMigratedRoute(transaction, {
        id: route.id,
        pointsCount: route.pointsCount,
        segmentsCount: route.routeSegments.length,
        status: TRACKING_STORAGE_ROUTE_STATUS.COMPLETED,
      });
    }

    if (legacyStorage.activeSession) {
      const session = legacyStorage.activeSession;

      await writeTrackingRouteSnapshot(transaction, {
        id: activeRouteId,
        isActive: true,
        snapshot: session,
        status: session.status,
        summary: null,
      });
      await verifyMigratedRoute(transaction, {
        id: activeRouteId,
        pointsCount: getRoutePointCount(session.routeSegments),
        segmentsCount: session.routeSegments.length,
        status: session.status,
      });
    }

    await transaction.runAsync(
      `INSERT INTO tracking_storage_meta (key, value)
       VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      TRACKING_STORAGE_META.LEGACY_MIGRATION_KEY,
      TRACKING_STORAGE_META.LEGACY_MIGRATION_VALUE,
    );
  });

  try {
    await clearLegacyTrackingStorage(legacyStorage);
  } catch {
    // The committed marker prevents duplicate imports if legacy cleanup is interrupted.
  }
};

const initializeTrackingStorage = async () => {
  const database = await getTrackingDatabase();
  await migrateLegacyStorage(database);
  return database;
};

export const prepareTrackingStorage = () => {
  if (!storageReadyPromise) {
    storageReadyPromise = initializeTrackingStorage().catch((error) => {
      storageReadyPromise = null;
      throw error;
    });
  }

  return storageReadyPromise;
};
