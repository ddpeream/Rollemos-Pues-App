import { useEffect, useMemo } from 'react';

import { useAuthStore } from '../../auth';
import {
  TRACKING_LIVE,
  TRACKING_LIVE_ERROR,
  TRACKING_LIVE_SUBSCRIPTION_STATUS,
} from '../constants/trackingLive.constants';
import {
  fetchTrackingLive,
  subscribeTrackingLive,
  unsubscribeTrackingLive,
} from '../services/trackingLive.service';
import {
  getCachedTrackingLiveProfile,
  primeTrackingLiveProfiles,
  resolveTrackingLiveProfile,
} from '../services/trackingLiveProfile.service';
import { useTrackingStore } from '../store/trackingStore';

export function useTrackingLiveSkaters() {
  const myUserId = useAuthStore((state) => state.authUser?.id || null);
  const livePaths = useTrackingStore((state) => state.livePaths);
  const liveSkaters = useTrackingStore((state) => state.liveSkaters);
  const applyLiveTrackingChange = useTrackingStore(
    (state) => state.applyLiveTrackingChange,
  );
  const attachLiveTrackingProfile = useTrackingStore(
    (state) => state.attachLiveTrackingProfile,
  );
  const initializeLiveTrackingState = useTrackingStore(
    (state) => state.initializeLiveTracking,
  );
  const pruneLiveTracking = useTrackingStore((state) => state.pruneLiveTracking);
  const resetLiveTracking = useTrackingStore((state) => state.resetLiveTracking);
  const setLiveError = useTrackingStore((state) => state.setLiveError);

  useEffect(() => {
    let isMounted = true;
    let isInitialized = false;
    let channel = null;
    const pendingChanges = [];

    const applyChange = (change) => {
      const currentSkater = useTrackingStore.getState().liveSkaters
        .find((skater) => skater.userId === change.userId);
      const profile = (
        change.skater?.user
        || currentSkater?.user
        || getCachedTrackingLiveProfile(change.userId)
      );
      const hydratedChange = change.skater
        ? { ...change, skater: { ...change.skater, user: profile } }
        : change;

      applyLiveTrackingChange(hydratedChange, myUserId);

      if (change.skater && !profile) {
        resolveTrackingLiveProfile(change.userId).then((result) => {
          if (!isMounted) return;

          if (!result.ok) {
            setLiveError(result.error || TRACKING_LIVE_ERROR.PROFILE_FETCH_FAILED);
            return;
          }

          if (result.profile) {
            attachLiveTrackingProfile(change.userId, result.profile);
          }
        }).catch((error) => {
          if (isMounted) {
            setLiveError(error?.message || TRACKING_LIVE_ERROR.PROFILE_FETCH_FAILED);
          }
        });
      }
    };

    const handleChange = (change) => {
      if (!isInitialized) {
        pendingChanges.push(change);
        return;
      }

      applyChange(change);
    };

    const initializeLiveSubscription = async () => {
      if (!myUserId) {
        resetLiveTracking();
        return;
      }

      channel = subscribeTrackingLive({
        channelKey: myUserId,
        onChange: handleChange,
        onStatus: ({ error, status }) => {
          if (
            status === TRACKING_LIVE_SUBSCRIPTION_STATUS.ERROR
            || status === TRACKING_LIVE_SUBSCRIPTION_STATUS.TIMED_OUT
          ) {
            setLiveError(error?.message || TRACKING_LIVE_ERROR.SUBSCRIPTION_FAILED);
          }
        },
      });

      const initialLive = await fetchTrackingLive({ excludeUserId: myUserId });
      if (!isMounted) return;

      if (!initialLive.ok) {
        setLiveError(initialLive.error || TRACKING_LIVE_ERROR.FETCH_FAILED);
      }

      primeTrackingLiveProfiles(initialLive.data);
      initializeLiveTrackingState(initialLive.data, myUserId);
      isInitialized = true;
      pendingChanges.splice(0).forEach(applyChange);
    };

    initializeLiveSubscription().catch((error) => {
      if (!isMounted) return;

      setLiveError(error?.message || TRACKING_LIVE_ERROR.FETCH_FAILED);
      initializeLiveTrackingState([], myUserId);
      isInitialized = true;
      pendingChanges.splice(0).forEach(applyChange);
    });

    return () => {
      isMounted = false;
      unsubscribeTrackingLive(channel);
      resetLiveTracking();
    };
  }, [
    applyLiveTrackingChange,
    attachLiveTrackingProfile,
    initializeLiveTrackingState,
    myUserId,
    resetLiveTracking,
    setLiveError,
  ]);

  useEffect(() => {
    const interval = setInterval(
      () => pruneLiveTracking(),
      TRACKING_LIVE.PRUNE_INTERVAL_MS,
    );
    return () => clearInterval(interval);
  }, [pruneLiveTracking]);

  return useMemo(() => ({
    livePaths,
    liveSkaters,
    myUserId,
  }), [livePaths, liveSkaters, myUserId]);
}

export default useTrackingLiveSkaters;
