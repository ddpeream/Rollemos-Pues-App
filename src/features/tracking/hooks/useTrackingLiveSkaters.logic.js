import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useAuthStore } from '../../auth';
import { TRACKING_LIVE, TRACKING_STATUS } from '../constants/tracking.constants';
import {
  fetchTrackingLive,
  setTrackingLiveActive,
  subscribeTrackingLive,
  unsubscribeTrackingLive,
  upsertTrackingLive,
} from '../services/trackingLive.service';
import { useTrackingStore } from '../store/trackingStore';

const isFreshLiveSkater = (skater) => {
  if (!skater?.updatedAt) return true;

  return Date.now() - new Date(skater.updatedAt).getTime() <= TRACKING_LIVE.STALE_TIMEOUT_MS;
};

const buildLivePaths = (currentPaths, liveSkaters) => {
  const nextPaths = { ...currentPaths };

  liveSkaters.forEach((skater) => {
    const currentPath = nextPaths[skater.userId] || [];
    const lastPoint = currentPath[currentPath.length - 1];

    if (
      lastPoint?.latitude === skater.coordinate.latitude &&
      lastPoint?.longitude === skater.coordinate.longitude
    ) {
      return;
    }

    nextPaths[skater.userId] = [
      ...currentPath,
      skater.coordinate,
    ].slice(-TRACKING_LIVE.MAX_PATH_POINTS);
  });

  return nextPaths;
};

const applyLiveSkaterChange = ({ currentPaths, currentSkaters, change, myUserId }) => {
  const nextSkaters = currentSkaters.filter((skater) => skater.userId !== change.userId);

  if (!change.skater || change.skater.userId === myUserId || !change.skater.isActive) {
    const { [change.userId]: removedPath, ...nextPaths } = currentPaths;
    return { livePaths: nextPaths, liveSkaters: nextSkaters };
  }

  const liveSkaters = [...nextSkaters, change.skater].filter(isFreshLiveSkater);

  return {
    livePaths: buildLivePaths(currentPaths, [change.skater]),
    liveSkaters,
  };
};

export function useTrackingLiveSkaters() {
  const channelRef = useRef(null);

  const myUserId = useAuthStore((state) => state.authUser?.id || null);
  const currentLocation = useTrackingStore((state) => state.currentLocation);
  const isLivePrivate = useTrackingStore((state) => state.isLivePrivate);
  const isPrivacyReady = useTrackingStore((state) => state.isPrivacyReady);
  const livePaths = useTrackingStore((state) => state.livePaths);
  const liveSkaters = useTrackingStore((state) => state.liveSkaters);
  const resetLiveTracking = useTrackingStore((state) => state.resetLiveTracking);
  const setLiveError = useTrackingStore((state) => state.setLiveError);
  const setLivePaths = useTrackingStore((state) => state.setLivePaths);
  const setLiveSkaters = useTrackingStore((state) => state.setLiveSkaters);
  const status = useTrackingStore((state) => state.status);

  const publishLiveLocation = useCallback(async () => {
    if (
      !myUserId ||
      !isPrivacyReady ||
      isLivePrivate ||
      status !== TRACKING_STATUS.TRACKING ||
      !currentLocation
    ) {
      return;
    }

    const result = await upsertTrackingLive({
      coordinate: currentLocation,
      heading: currentLocation.heading,
      isActive: true,
      speed: currentLocation.speed,
      userId: myUserId,
    });

    if (!result.ok) {
      setLiveError(result.error || 'tracking_live_publish_failed');
    }
  }, [currentLocation, isLivePrivate, isPrivacyReady, myUserId, setLiveError, status]);

  const markMeInactive = useCallback(async () => {
    if (!myUserId) return;

    const result = await setTrackingLiveActive({ isActive: false, userId: myUserId });
    if (!result.ok) {
      setLiveError(result.error || 'tracking_live_inactive_failed');
    }
  }, [myUserId, setLiveError]);

  useEffect(() => {
    let isMounted = true;

    const initializeLiveTracking = async () => {
      if (!myUserId) {
        resetLiveTracking();
        return;
      }

      if (!isMounted) return;

      const initialLive = await fetchTrackingLive();
      if (!isMounted) return;

      if (!initialLive.ok) {
        setLiveError(initialLive.error || 'tracking_live_fetch_failed');
      }

      const filteredSkaters = initialLive.data
        .filter((skater) => skater.userId !== myUserId)
        .filter(isFreshLiveSkater);

      setLiveSkaters(filteredSkaters);
      setLivePaths(buildLivePaths({}, filteredSkaters));

      channelRef.current = subscribeTrackingLive((change) => {
        const {
          livePaths: currentLivePaths,
          liveSkaters: currentLiveSkaters,
        } = useTrackingStore.getState();

        const nextLiveState = applyLiveSkaterChange({
          change,
          currentPaths: currentLivePaths,
          currentSkaters: currentLiveSkaters,
          myUserId,
        });

        setLiveSkaters(nextLiveState.liveSkaters);
        setLivePaths(nextLiveState.livePaths);
      });
    };

    initializeLiveTracking();

    return () => {
      isMounted = false;
      unsubscribeTrackingLive(channelRef.current);
      markMeInactive();
      channelRef.current = null;
      resetLiveTracking();
    };
  }, [
    markMeInactive,
    myUserId,
    resetLiveTracking,
    setLiveError,
    setLivePaths,
    setLiveSkaters,
  ]);

  useEffect(() => {
    publishLiveLocation();
  }, [publishLiveLocation]);

  useEffect(() => {
    if (!isPrivacyReady) return;

    if (isLivePrivate || status === TRACKING_STATUS.IDLE || status === TRACKING_STATUS.PAUSED) {
      markMeInactive();
    }
  }, [isLivePrivate, isPrivacyReady, markMeInactive, status]);

  return useMemo(() => ({
    livePaths,
    liveSkaters,
    myUserId,
  }), [livePaths, liveSkaters, myUserId]);
}

export default useTrackingLiveSkaters;
