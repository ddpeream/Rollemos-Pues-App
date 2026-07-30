// @ts-check

import {
  TRACKING_LIVE_DIAGNOSTIC_REASON,
  TRACKING_LIVE_PUBLISH_REASON,
} from '../constants/trackingLive.constants';
import { getTrackingDatabase } from './trackingDatabase.service';
import { enqueueTrackingStorageWrite } from './trackingStorageQueue.service';

const ANONYMOUS_USER_KEY = 'anonymous';
const NETWORK_ERROR_PATTERN = /failed to fetch|network request failed|networkerror|timed? ?out/i;

const resolveDiagnosticReason = ({ error, ok, published, reason }) => {
  if (published) return TRACKING_LIVE_PUBLISH_REASON.PUBLISHED;
  if (ok && reason) return reason;

  if (reason === TRACKING_LIVE_PUBLISH_REASON.MISSING_USER) {
    return error
      ? TRACKING_LIVE_DIAGNOSTIC_REASON.AUTH_FAILED
      : TRACKING_LIVE_PUBLISH_REASON.MISSING_USER;
  }

  if (NETWORK_ERROR_PATTERN.test(error || '')) {
    return TRACKING_LIVE_DIAGNOSTIC_REASON.NETWORK_FAILED;
  }

  if (!ok && reason === TRACKING_LIVE_PUBLISH_REASON.PUBLISHED) {
    return TRACKING_LIVE_DIAGNOSTIC_REASON.SUPABASE_FAILED;
  }

  return TRACKING_LIVE_DIAGNOSTIC_REASON.UNKNOWN_FAILED;
};

const mapDiagnosticRow = (row) => {
  if (!row) return null;

  return {
    attemptedAt: Number(row.attempted_at),
    error: row.error || null,
    ok: row.ok === 1,
    published: row.published === 1,
    reason: row.reason,
    routeId: row.route_id || null,
    userId: row.user_id || null,
  };
};

export const saveTrackingLiveBackgroundDiagnostic = async ({
  attemptedAt = Date.now(),
  result,
  routeId,
}) => {
  const userId = result?.userId || null;
  const record = {
    attemptedAt,
    error: result?.error || null,
    ok: result?.ok === true,
    published: result?.published === true,
    reason: resolveDiagnosticReason(result || {}),
    routeId: routeId || null,
    userId,
  };
  const database = await getTrackingDatabase();

  await enqueueTrackingStorageWrite(() => database.runAsync(
    `INSERT INTO tracking_live_diagnostics (
       user_key, user_id, route_id, attempted_at, ok, published, reason, error
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_key) DO UPDATE SET
       user_id = excluded.user_id,
       route_id = excluded.route_id,
       attempted_at = excluded.attempted_at,
       ok = excluded.ok,
       published = excluded.published,
       reason = excluded.reason,
       error = excluded.error`,
    userId || ANONYMOUS_USER_KEY,
    userId,
    record.routeId,
    record.attemptedAt,
    record.ok ? 1 : 0,
    record.published ? 1 : 0,
    record.reason,
    record.error,
  ));

  return record;
};

export const loadLatestTrackingLiveBackgroundDiagnostic = async (userId = null) => {
  const database = await getTrackingDatabase();
  const row = userId
    ? await database.getFirstAsync(
      'SELECT * FROM tracking_live_diagnostics WHERE user_key = ? LIMIT 1',
      userId,
    )
    : await database.getFirstAsync(
      `SELECT * FROM tracking_live_diagnostics
       ORDER BY attempted_at DESC
       LIMIT 1`,
    );

  return mapDiagnosticRow(row);
};
