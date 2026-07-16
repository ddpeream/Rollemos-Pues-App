// @ts-check

import { TRACKING_LIVE_PUBLISH_REASON } from '../constants/trackingLive.constants';
import {
  clearTrackingLiveCheckpoint,
  loadTrackingLiveCheckpoint,
  saveTrackingLiveCheckpoint,
} from './trackingLiveCheckpoint.service';
import {
  setTrackingLiveActive,
  upsertTrackingLive,
} from './trackingLive.service';
import {
  getTrackingLivePublishDecision,
  processTrackingLivePublishCoordinate,
} from './trackingLivePublisher.logic';

let livePublishQueue = Promise.resolve();

const publishTrackingLiveOperation = async ({
  coordinate,
  force,
  routeId = null,
  userId,
}) => {
  if (!userId) {
    return {
      error: null,
      ok: true,
      published: false,
      reason: TRACKING_LIVE_PUBLISH_REASON.MISSING_USER,
    };
  }

  const checkpoint = await loadTrackingLiveCheckpoint(userId);
  const now = Date.now();
  const normalizedCoordinate = processTrackingLivePublishCoordinate({
    checkpoint,
    coordinate,
    now,
    routeId,
  });
  if (!normalizedCoordinate) {
    return {
      error: null,
      ok: true,
      published: false,
      reason: TRACKING_LIVE_PUBLISH_REASON.INVALID_COORDINATE,
    };
  }

  const decision = getTrackingLivePublishDecision({
    checkpoint,
    coordinate: normalizedCoordinate,
    force,
    now,
    routeId,
    userId,
  });

  if (!decision.shouldPublish) {
    return { error: null, ok: true, published: false, reason: decision.reason };
  }

  const result = await upsertTrackingLive({
    coordinate: normalizedCoordinate,
    isActive: true,
    userId,
  });
  if (!result.ok) {
    return { ...result, published: false, reason: decision.reason };
  }

  await saveTrackingLiveCheckpoint({
    coordinate: normalizedCoordinate,
    publishedAt: now,
    routeId,
    userId,
  });

  return {
    data: result.data,
    error: null,
    ok: true,
    published: true,
    reason: TRACKING_LIVE_PUBLISH_REASON.PUBLISHED,
  };
};

export const publishTrackingLiveLocation = (options) => {
  const operation = livePublishQueue.then(
    () => publishTrackingLiveOperation(options),
    () => publishTrackingLiveOperation(options),
  );
  livePublishQueue = operation.catch(() => undefined);
  return operation;
};

const deactivateTrackingLiveOperation = async (userId) => {
  if (!userId) return { error: null, ok: true };

  const result = await setTrackingLiveActive({ isActive: false, userId });
  if (result.ok) {
    await clearTrackingLiveCheckpoint(userId);
  }

  return result;
};

export const deactivateTrackingLivePresence = (userId) => {
  const operation = livePublishQueue.then(
    () => deactivateTrackingLiveOperation(userId),
    () => deactivateTrackingLiveOperation(userId),
  );
  livePublishQueue = operation.catch(() => undefined);
  return operation;
};
