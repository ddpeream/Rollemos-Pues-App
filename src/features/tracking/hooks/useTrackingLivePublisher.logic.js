import { useCallback, useEffect, useMemo, useRef } from 'react';
import { AppState } from 'react-native';

import { useAuthStore } from '../../auth';
import {
  TRACKING_LIVE,
  TRACKING_LIVE_ERROR,
} from '../constants/trackingLive.constants';
import { TRACKING_STATUS } from '../constants/tracking.constants';
import {
  deactivateTrackingLivePresence,
  publishTrackingLiveLocation,
} from '../services/trackingLivePublisher.service';
import { loadTrackingPrivacy } from '../services/trackingPrivacy.service';
import { createTrackingRouteId } from '../services/trackingStorage.logic';
import { useTrackingStore } from '../store/trackingStore';
import { useTrackingAppState } from './useTrackingAppState.logic';

export function useTrackingLivePublisher() {
  const initializedPresenceRef = useRef(false);
  const previousPresenceRef = useRef({ eligible: false, userId: null });

  const userId = useAuthStore((state) => state.authUser?.id || null);
  const currentLocationTimestamp = useTrackingStore(
    (state) => state.currentLocation?.timestamp || null,
  );
  const isLivePrivate = useTrackingStore((state) => state.isLivePrivate);
  const isPrivacyReady = useTrackingStore((state) => state.isPrivacyReady);
  const startedAt = useTrackingStore((state) => state.startedAt);
  const status = useTrackingStore((state) => state.status);
  const setLiveError = useTrackingStore((state) => state.setLiveError);
  const setLivePrivacy = useTrackingStore((state) => state.setLivePrivacy);
  const setPrivacyError = useTrackingStore((state) => state.setPrivacyError);

  const isEligible = Boolean(
    userId
    && isPrivacyReady
    && !isLivePrivate
    && status === TRACKING_STATUS.TRACKING,
  );

  const publishCurrentLocation = useCallback(async ({ force = false } = {}) => {
    if (AppState.currentState !== 'active') return null;

    const state = useTrackingStore.getState();
    if (
      !userId
      || !state.isPrivacyReady
      || state.isLivePrivate
      || state.status !== TRACKING_STATUS.TRACKING
      || !state.currentLocation
    ) {
      return null;
    }

    try {
      const result = await publishTrackingLiveLocation({
        coordinate: state.currentLocation,
        force,
        routeId: Number.isFinite(state.startedAt)
          ? createTrackingRouteId(state.startedAt)
          : null,
        userId,
      });

      if (!result.ok) {
        setLiveError(result.error || TRACKING_LIVE_ERROR.PUBLISH_FAILED);
      }

      return result;
    } catch (error) {
      setLiveError(error?.message || TRACKING_LIVE_ERROR.PUBLISH_FAILED);
      return null;
    }
  }, [setLiveError, userId]);

  useEffect(() => {
    if (isPrivacyReady) return;

    loadTrackingPrivacy()
      .then(setLivePrivacy)
      .catch((error) => {
        setPrivacyError(error?.message || 'tracking_privacy_load_failed');
      });
  }, [isPrivacyReady, setLivePrivacy, setPrivacyError]);

  useEffect(() => {
    if (!isPrivacyReady || !userId) return;

    const previous = previousPresenceRef.current;
    if (
      (previous.eligible && (!isEligible || previous.userId !== userId))
      || (!initializedPresenceRef.current && !isEligible)
    ) {
      deactivateTrackingLivePresence(previous.userId || userId)
        .then((result) => {
          if (!result.ok) {
            setLiveError(result.error || TRACKING_LIVE_ERROR.INACTIVE_FAILED);
          }
        })
        .catch((error) => {
          setLiveError(error?.message || TRACKING_LIVE_ERROR.INACTIVE_FAILED);
        });
    }

    if (isEligible && (!previous.eligible || previous.userId !== userId)) {
      publishCurrentLocation({ force: true });
    }

    initializedPresenceRef.current = true;
    previousPresenceRef.current = { eligible: isEligible, userId };
  }, [
    isEligible,
    isPrivacyReady,
    publishCurrentLocation,
    setLiveError,
    userId,
  ]);

  useEffect(() => {
    if (!isEligible || !currentLocationTimestamp) return;
    publishCurrentLocation();
  }, [currentLocationTimestamp, isEligible, publishCurrentLocation]);

  useEffect(() => {
    if (!isEligible) return undefined;

    const interval = setInterval(
      () => publishCurrentLocation(),
      TRACKING_LIVE.HEARTBEAT_INTERVAL_MS,
    );
    return () => clearInterval(interval);
  }, [isEligible, publishCurrentLocation]);

  const handleForeground = useCallback(() => {
    if (previousPresenceRef.current.eligible) {
      publishCurrentLocation({ force: true });
    }
  }, [publishCurrentLocation]);
  const handleBackground = useCallback(() => undefined, []);

  useTrackingAppState({
    onBackground: handleBackground,
    onForeground: handleForeground,
  });

  return useMemo(() => ({ isLivePublishing: isEligible }), [isEligible]);
}

export default useTrackingLivePublisher;
