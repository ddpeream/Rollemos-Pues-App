import { useCallback, useEffect, useMemo, useRef } from 'react';

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
import { useTrackingAppState } from './useTrackingAppState.logic';

export function useTrackingLiveSkaters() {
  const refreshLiveRef = useRef(null);
  const myUserId = useAuthStore((state) => state.authUser?.id || null);
  const liveConnection = useTrackingStore((state) => state.liveConnection);
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
  const setLiveConnection = useTrackingStore((state) => state.setLiveConnection);
  const setLiveError = useTrackingStore((state) => state.setLiveError);
  const synchronizeLiveTracking = useTrackingStore(
    (state) => state.synchronizeLiveTracking,
  );

  const handleForeground = useCallback(() => {
    refreshLiveRef.current?.();
  }, []);
  const handleBackground = useCallback(() => undefined, []);

  useTrackingAppState({
    onBackground: handleBackground,
    onForeground: handleForeground,
  });

  useEffect(() => {
    if (!myUserId) {
      refreshLiveRef.current = null;
      resetLiveTracking();
      return undefined;
    }

    let channel = null;
    let hasSubscribed = false;
    let isInitialized = false;
    let isMounted = true;
    let isSynchronizing = false;
    let synchronizePromise = null;
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

    const flushPendingChanges = () => {
      pendingChanges.splice(0).forEach(applyChange);
    };

    const completeInitialSynchronization = (skaters) => {
      initializeLiveTrackingState(skaters, myUserId);
      isInitialized = true;
    };

    const synchronize = () => {
      if (synchronizePromise) return synchronizePromise;

      isSynchronizing = true;
      synchronizePromise = (async () => {
        try {
          const result = await fetchTrackingLive({ excludeUserId: myUserId });
          if (!isMounted) return;

          if (!result.ok) {
            setLiveError(result.error || TRACKING_LIVE_ERROR.FETCH_FAILED);
            if (!isInitialized) completeInitialSynchronization([]);
            return;
          }

          primeTrackingLiveProfiles(result.data);
          if (isInitialized) {
            synchronizeLiveTracking(result.data, myUserId);
          } else {
            completeInitialSynchronization(result.data);
          }

          setLiveError(null);
          setLiveConnection({
            initialFetchCount: result.data.length,
            lastSynchronizedAt: Date.now(),
          });
        } catch (error) {
          if (!isMounted) return;

          setLiveError(error?.message || TRACKING_LIVE_ERROR.FETCH_FAILED);
          if (!isInitialized) completeInitialSynchronization([]);
        }
      })().finally(() => {
        isSynchronizing = false;
        if (isMounted && isInitialized) flushPendingChanges();
        synchronizePromise = null;
      });

      return synchronizePromise;
    };

    const handleChange = (change) => {
      if (!isMounted) return;

      setLiveConnection({ lastEventAt: Date.now() });
      if (!isInitialized || isSynchronizing) {
        pendingChanges.push(change);
        return;
      }

      applyChange(change);
    };

    const handleStatus = ({ error, status }) => {
      if (!isMounted) return;

      setLiveConnection({ status });
      if (status === TRACKING_LIVE_SUBSCRIPTION_STATUS.SUBSCRIBED) {
        setLiveError(null);
        if (hasSubscribed) synchronize();
        hasSubscribed = true;
        return;
      }

      if (
        status === TRACKING_LIVE_SUBSCRIPTION_STATUS.ERROR
        || status === TRACKING_LIVE_SUBSCRIPTION_STATUS.TIMED_OUT
        || status === TRACKING_LIVE_SUBSCRIPTION_STATUS.CLOSED
      ) {
        setLiveError(error?.message || TRACKING_LIVE_ERROR.SUBSCRIPTION_FAILED);
      }
    };

    setLiveConnection({
      initialFetchCount: 0,
      lastEventAt: null,
      lastSynchronizedAt: null,
      status: TRACKING_LIVE_SUBSCRIPTION_STATUS.CONNECTING,
    });
    channel = subscribeTrackingLive({
      channelKey: myUserId,
      onChange: handleChange,
      onStatus: handleStatus,
    });

    refreshLiveRef.current = synchronize;
    synchronize();

    return () => {
      isMounted = false;
      refreshLiveRef.current = null;
      unsubscribeTrackingLive(channel);
      resetLiveTracking();
    };
  }, [
    applyLiveTrackingChange,
    attachLiveTrackingProfile,
    initializeLiveTrackingState,
    myUserId,
    resetLiveTracking,
    setLiveConnection,
    setLiveError,
    synchronizeLiveTracking,
  ]);

  useEffect(() => {
    const interval = setInterval(
      () => pruneLiveTracking(),
      TRACKING_LIVE.PRUNE_INTERVAL_MS,
    );
    return () => clearInterval(interval);
  }, [pruneLiveTracking]);

  return useMemo(() => ({
    liveConnection,
    livePaths,
    liveSkaters,
    myUserId,
  }), [liveConnection, livePaths, liveSkaters, myUserId]);
}

export default useTrackingLiveSkaters;
