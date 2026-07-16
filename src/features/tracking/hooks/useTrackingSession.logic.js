import { useCallback, useEffect, useRef } from 'react';

import {
  TRACKING_AUTO_STOP,
  TRACKING_AUTO_STOP_ACTION,
  TRACKING_ERROR,
  TRACKING_LOCATION_FILTER,
  TRACKING_LOCATION_STATUS,
  TRACKING_STATUS,
} from '../constants/tracking.constants';
import { useTrackingAppState } from './useTrackingAppState.logic';
import { useTrackingBackgroundSession } from './useTrackingBackgroundSession.logic';
import {
  getCurrentTrackingPosition,
  getLastKnownTrackingPosition,
  getTrackingForegroundPermission,
  hasTrackingLocationServicesEnabled,
  requestTrackingLocationPermission,
  watchTrackingPosition,
} from '../services/location.service';
import { saveCompletedRoute } from '../services/routeStorage.service';
import { ingestTrackingLocationPosition } from '../services/trackingLocationIngestion.logic';
import {
  createAutoStopEvent,
  getTrackingAutoStopDecision,
} from '../services/trackingAutoStop.service';
import {
  clearActiveTrackingSession,
  loadActiveTrackingSession,
  saveActiveTrackingSession,
} from '../services/trackingSessionStorage.service';
import { getRoutePointCount } from '../store/trackingRoute.logic';
import { useTrackingStore } from '../store/trackingStore';

export function useTrackingSession() {
  // Fuente unica del watcher GPS de la sesion de tracking.
  // Otros hooks deben consumir currentLocation desde trackingStore.
  const subscriptionRef = useRef(null);
  const watcherGenerationRef = useRef(0);
  const watcherStartPromiseRef = useRef(null);
  const isMountedRef = useRef(true);
  const hasTriedRestoreRef = useRef(false);
  const hasTriedVisibleLocationRef = useRef(false);

  const autoStopEvent = useTrackingStore((state) => state.autoStopEvent);
  const canAskLocationPermissionAgain = useTrackingStore(
    (state) => state.canAskLocationPermissionAgain,
  );
  const currentLocation = useTrackingStore((state) => state.currentLocation);
  const error = useTrackingStore((state) => state.error);
  const loadingStates = useTrackingStore((state) => state.loadingStates);
  const locationStatus = useTrackingStore((state) => state.locationStatus);
  const permissionStatus = useTrackingStore((state) => state.permissionStatus);
  const locationServicesEnabled = useTrackingStore((state) => state.locationServicesEnabled);
  const routePointsCount = useTrackingStore((state) => getRoutePointCount(state.routeSegments));
  const status = useTrackingStore((state) => state.status);
  const pauseTrackingSession = useTrackingStore((state) => state.pauseTrackingSession);
  const restoreTrackingSession = useTrackingStore((state) => state.restoreTrackingSession);
  const resumeTrackingSession = useTrackingStore((state) => state.resumeTrackingSession);
  const startTrackingSession = useTrackingStore((state) => state.startTrackingSession);
  const stopTrackingSession = useTrackingStore((state) => state.stopTrackingSession);
  const setAutoStopEvent = useTrackingStore((state) => state.setAutoStopEvent);
  const setError = useTrackingStore((state) => state.setError);
  const setLoadingState = useTrackingStore((state) => state.setLoadingState);
  const setLocationStatus = useTrackingStore((state) => state.setLocationStatus);
  const resetLoadingStates = useTrackingStore((state) => state.resetLoadingStates);
  const setLocationPermissionDetails = useTrackingStore(
    (state) => state.setLocationPermissionDetails,
  );
  const setLocationServicesEnabled = useTrackingStore(
    (state) => state.setLocationServicesEnabled,
  );

  const stopWatcher = useCallback(() => {
    watcherGenerationRef.current += 1;
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    watcherStartPromiseRef.current = null;
  }, []);

  const ingestPosition = useCallback((position, options = {}) => {
    if (!isMountedRef.current) return null;

    return ingestTrackingLocationPosition({
      options,
      position,
    });
  }, []);

  const ensurePermission = useCallback(async () => {
    if (!isMountedRef.current) return false;

    setLocationStatus(TRACKING_LOCATION_STATUS.CHECKING_AVAILABILITY);

    try {
      const servicesEnabled = await hasTrackingLocationServicesEnabled();
      if (!isMountedRef.current) return false;

      setLocationServicesEnabled(servicesEnabled);

      if (!servicesEnabled) {
        setLocationStatus(TRACKING_LOCATION_STATUS.UNAVAILABLE);
        setError(TRACKING_ERROR.LOCATION_SERVICES_DISABLED);
        return false;
      }

      let permission = await getTrackingForegroundPermission();
      if (!isMountedRef.current) return false;

      if (!permission.granted && permission.canAskAgain) {
        setLocationStatus(TRACKING_LOCATION_STATUS.REQUESTING_PERMISSION);
        permission = await requestTrackingLocationPermission();
        if (!isMountedRef.current) return false;
      }

      setLocationPermissionDetails(permission);

      if (!permission.granted) {
        setLocationStatus(TRACKING_LOCATION_STATUS.UNAVAILABLE);
        setError(TRACKING_ERROR.LOCATION_PERMISSION_DENIED);
        return false;
      }

      setError(null);
      return true;
    } catch {
      if (!isMountedRef.current) return false;

      setLocationStatus(TRACKING_LOCATION_STATUS.ERROR);
      setError(TRACKING_ERROR.LOCATION_PERMISSION_FAILED);
      return false;
    }
  }, [
    setError,
    setLocationPermissionDetails,
    setLocationServicesEnabled,
    setLocationStatus,
  ]);

  const hydrateInitialLocation = useCallback(async () => {
    let hydratedLocation = null;

    try {
      const lastKnownPosition = await getLastKnownTrackingPosition();
      if (!isMountedRef.current) return null;

      hydratedLocation = ingestPosition(lastKnownPosition, {
        allowStale: true,
        maxAccuracyMeters: TRACKING_LOCATION_FILTER.MAX_INITIAL_ACCURACY_METERS,
      }) || hydratedLocation;
    } catch {
      // A fresh GPS position is still attempted below.
    }

    try {
      const currentPosition = await getCurrentTrackingPosition();
      if (!isMountedRef.current) return null;

      hydratedLocation = ingestPosition(currentPosition, { validateJump: false }) || hydratedLocation;
    } catch (locationError) {
      if (!hydratedLocation) throw locationError;
    }

    return hydratedLocation;
  }, [ingestPosition]);

  const startWatcher = useCallback(async () => {
    if (!isMountedRef.current) return false;
    if (subscriptionRef.current) return true;
    if (watcherStartPromiseRef.current) return watcherStartPromiseRef.current;

    watcherGenerationRef.current += 1;
    const watcherGeneration = watcherGenerationRef.current;

    const startPromise = (async () => {
      try {
        const subscription = await watchTrackingPosition(
          (position) => {
            if (
              isMountedRef.current
              && watcherGeneration === watcherGenerationRef.current
            ) {
              ingestPosition(position);
            }
          },
          () => {
            if (
              !isMountedRef.current
              || watcherGeneration !== watcherGenerationRef.current
            ) {
              return;
            }

            stopWatcher();
            setLocationStatus(TRACKING_LOCATION_STATUS.ERROR);
            setError(TRACKING_ERROR.LOCATION_WATCH_FAILED);
          },
        );

        if (
          !isMountedRef.current
          || watcherGeneration !== watcherGenerationRef.current
        ) {
          subscription.remove();
          return false;
        }

        subscriptionRef.current = subscription;
        return true;
      } catch {
        if (
          isMountedRef.current
          && watcherGeneration === watcherGenerationRef.current
        ) {
          setLocationStatus(TRACKING_LOCATION_STATUS.ERROR);
          setError(TRACKING_ERROR.LOCATION_WATCH_FAILED);
        }

        return false;
      }
    })();

    watcherStartPromiseRef.current = startPromise;
    const didStart = await startPromise;

    if (watcherStartPromiseRef.current === startPromise) {
      watcherStartPromiseRef.current = null;
    }

    return didStart;
  }, [setError, setLocationStatus, ingestPosition, stopWatcher]);
  const persistActiveSession = useCallback(async () => {
    const {
      currentLocation: snapshotCurrentLocation,
      metrics,
      pausedAt,
      routeSegments,
      startFlag,
      startedAt,
      status: snapshotStatus,
      totalPausedMs,
    } = useTrackingStore.getState();

    try {
      await saveActiveTrackingSession({
        currentLocation: snapshotCurrentLocation,
        metrics,
        pausedAt,
        routeSegments,
        startFlag,
        startedAt,
        status: snapshotStatus,
        totalPausedMs,
      });
      return true;
    } catch (sessionStorageError) {
      setError(sessionStorageError?.message || TRACKING_ERROR.SESSION_SAVE_FAILED);
      return false;
    }
  }, [setError]);
  const {
    startBackgroundSession,
    stopAndReconcileBackgroundSession,
  } = useTrackingBackgroundSession({
    persistSession: persistActiveSession,
  });

  const getSessionSnapshot = useCallback(() => {
    const {
      currentLocation: snapshotCurrentLocation,
      metrics,
      pausedAt,
      routeSegments,
      startFlag,
      startedAt,
      status: snapshotStatus,
      totalPausedMs,
    } = useTrackingStore.getState();

    return {
      currentLocation: snapshotCurrentLocation,
      metrics,
      pausedAt,
      routeSegments,
      startFlag,
      startedAt,
      status: snapshotStatus,
      totalPausedMs,
    };
  }, []);

  const restoreActiveSession = useCallback(async () => {
    if (hasTriedRestoreRef.current) return false;
    hasTriedRestoreRef.current = true;

    if (useTrackingStore.getState().status !== TRACKING_STATUS.IDLE) return false;

    try {
      const session = await loadActiveTrackingSession();
      if (!session) return false;

      const didRestore = restoreTrackingSession(session);

      if (!didRestore) {
        await clearActiveTrackingSession();
        setError(TRACKING_ERROR.RESTORE_FAILED);
        return false;
      }

      if (session.status === TRACKING_STATUS.TRACKING) {
        if (!await stopAndReconcileBackgroundSession()) return true;
      }

      const autoStopDecision = getTrackingAutoStopDecision({
        session: {
          ...getSessionSnapshot(),
          updatedAt: session.updatedAt,
        },
      });

      if (autoStopDecision.action === TRACKING_AUTO_STOP_ACTION.CLEAN_SESSION) {
        if (!await stopAndReconcileBackgroundSession()) return true;
        await clearActiveTrackingSession();
        stopTrackingSession();
        setAutoStopEvent(createAutoStopEvent(autoStopDecision));
        return false;
      }

      if (autoStopDecision.action === TRACKING_AUTO_STOP_ACTION.AUTO_PAUSE) {
        if (!await stopAndReconcileBackgroundSession()) return true;

        if (!pauseTrackingSession()) {
          setError(TRACKING_ERROR.RESTORE_FAILED);
          return false;
        }

        setAutoStopEvent(createAutoStopEvent(autoStopDecision));
        await persistActiveSession();
      }

      return true;
    } catch (trackingError) {
      setError(trackingError?.message || TRACKING_ERROR.RESTORE_FAILED);
      return false;
    }
  }, [
    getSessionSnapshot,
    pauseTrackingSession,
    persistActiveSession,
    restoreTrackingSession,
    setAutoStopEvent,
    setError,
    stopAndReconcileBackgroundSession,
    stopTrackingSession,
  ]);

  const applyAutoStopDecision = useCallback(async (autoStopDecision) => {
    if (autoStopDecision.action === TRACKING_AUTO_STOP_ACTION.NONE) return false;

    if (autoStopDecision.action === TRACKING_AUTO_STOP_ACTION.CLEAN_SESSION) {
      if (!await stopAndReconcileBackgroundSession()) return false;

      await clearActiveTrackingSession();

      if (!stopTrackingSession()) return false;

      setAutoStopEvent(createAutoStopEvent(autoStopDecision));
      return true;
    }

    if (autoStopDecision.action === TRACKING_AUTO_STOP_ACTION.AUTO_PAUSE) {
      if (!await stopAndReconcileBackgroundSession()) return false;

      if (!pauseTrackingSession()) return false;

      setAutoStopEvent(createAutoStopEvent(autoStopDecision));
      await persistActiveSession();
      return true;
    }

    return false;
  }, [
    pauseTrackingSession,
    persistActiveSession,
    setAutoStopEvent,
    stopTrackingSession,
    stopAndReconcileBackgroundSession,
  ]);

  const hydrateVisibleLocation = useCallback(async () => {
    if (hasTriedVisibleLocationRef.current) {
      return Boolean(subscriptionRef.current);
    }

    hasTriedVisibleLocationRef.current = true;

    try {
      const hasPermission = await ensurePermission();
      if (!hasPermission || !isMountedRef.current) return false;

      await hydrateInitialLocation();
      if (!isMountedRef.current) return false;

      return startWatcher();
    } catch (trackingError) {
      if (!isMountedRef.current) return false;

      setLocationStatus(TRACKING_LOCATION_STATUS.ERROR);
      setError(trackingError?.message || TRACKING_ERROR.LOCATION_HYDRATE_FAILED);
      return false;
    }
  }, [
    ensurePermission,
    hydrateInitialLocation,
    setError,
    setLocationStatus,
    startWatcher,
  ]);

  const initializeTrackingView = useCallback(async () => {
    await restoreActiveSession();
    if (!isMountedRef.current) return;

    if (useTrackingStore.getState().status === TRACKING_STATUS.TRACKING) {
      if (!await stopAndReconcileBackgroundSession()) return;
    }

    const isLocationActive = await hydrateVisibleLocation();
    if (
      !isMountedRef.current
      || useTrackingStore.getState().status !== TRACKING_STATUS.TRACKING
    ) {
      return;
    }

    if (isLocationActive) {
      await startBackgroundSession();
      return;
    }

    if (!await stopAndReconcileBackgroundSession()) return;

    if (pauseTrackingSession()) {
      await persistActiveSession();
    }
  }, [
    hydrateVisibleLocation,
    pauseTrackingSession,
    persistActiveSession,
    restoreActiveSession,
    startBackgroundSession,
    stopAndReconcileBackgroundSession,
  ]);
  const saveCurrentRoute = useCallback(async () => {
    const endedAt = Date.now();
    useTrackingStore.getState().tickTrackingMetrics(endedAt);

    const {
      metrics,
      pausedAt,
      routeSegments,
      startedAt,
      totalPausedMs,
    } = useTrackingStore.getState();

    try {
      return await saveCompletedRoute({
        endedAt,
        metrics,
        pausedAt,
        routeSegments,
        startedAt,
        totalPausedMs,
      });
    } catch (routeStorageError) {
      setError(routeStorageError?.message || TRACKING_ERROR.ROUTE_SAVE_FAILED);
      throw routeStorageError;
    }
  }, [setError]);

  const startTracking = useCallback(async () => {
    if (
      status !== TRACKING_STATUS.IDLE
      || useTrackingStore.getState().loadingStates.isStarting
    ) {
      return false;
    }

    setLoadingState('isStarting', true);

    try {
      const hasPermission = await ensurePermission();
      if (!hasPermission || !isMountedRef.current) return false;

      const initialLocation = (
        await hydrateInitialLocation()
        || useTrackingStore.getState().currentLocation
      );

      if (!initialLocation || !isMountedRef.current) {
        setError(TRACKING_ERROR.LOCATION_HYDRATE_FAILED);
        return false;
      }

      const didStartWatcher = await startWatcher();
      if (!didStartWatcher || !isMountedRef.current) return false;

      if (!startTrackingSession(initialLocation)) {
        setError(TRACKING_ERROR.START_FAILED);
        return false;
      }

      await persistActiveSession();
      await startBackgroundSession();
      return true;
    } catch (trackingError) {
      if (isMountedRef.current) {
        setError(trackingError?.message || TRACKING_ERROR.START_FAILED);
      }

      return false;
    } finally {
      if (isMountedRef.current) {
        setLoadingState('isStarting', false);
      }
    }
  }, [
    ensurePermission,
    hydrateInitialLocation,
    persistActiveSession,
    setError,
    setLoadingState,
    startTrackingSession,
    startWatcher,
    startBackgroundSession,
    status,
  ]);
  const pauseTracking = useCallback(async () => {
    if (status !== TRACKING_STATUS.TRACKING) return false;

    setLoadingState('isPausing', true);

    try {
      if (!await stopAndReconcileBackgroundSession()) return false;

      if (!pauseTrackingSession()) return false;

      await persistActiveSession();
      return true;
    } finally {
      if (isMountedRef.current) {
        setLoadingState('isPausing', false);
      }
    }
  }, [
    pauseTrackingSession,
    persistActiveSession,
    setLoadingState,
    status,
    stopAndReconcileBackgroundSession,
  ]);
  const resumeTracking = useCallback(async () => {
    if (status !== TRACKING_STATUS.PAUSED) return false;

    setLoadingState('isResuming', true);

    try {
      const hasPermission = await ensurePermission();
      if (!hasPermission || !isMountedRef.current) return false;

      const currentPosition = (
        await hydrateInitialLocation()
        || useTrackingStore.getState().currentLocation
      );

      if (!currentPosition || !isMountedRef.current) {
        setError(TRACKING_ERROR.LOCATION_HYDRATE_FAILED);
        return false;
      }

      const didStartWatcher = await startWatcher();
      if (!didStartWatcher || !isMountedRef.current) return false;

      if (!resumeTrackingSession()) {
        setError(TRACKING_ERROR.RESUME_FAILED);
        return false;
      }

      await persistActiveSession();
      await startBackgroundSession();
      return true;
    } catch (trackingError) {
      if (isMountedRef.current) {
        setError(trackingError?.message || TRACKING_ERROR.RESUME_FAILED);
      }

      return false;
    } finally {
      if (isMountedRef.current) {
        setLoadingState('isResuming', false);
      }
    }
  }, [
    ensurePermission,
    hydrateInitialLocation,
    persistActiveSession,
    resumeTrackingSession,
    setError,
    setLoadingState,
    startWatcher,
    status,
    startBackgroundSession,
  ]);
  const stopTracking = useCallback(async () => {
    if (status === TRACKING_STATUS.IDLE) return false;

    setLoadingState('isStopping', true);

    try {
      if (!await stopAndReconcileBackgroundSession()) return false;
      await saveCurrentRoute();

      return stopTrackingSession();
    } catch {
      return false;
    } finally {
      if (isMountedRef.current) {
        setLoadingState('isStopping', false);
      }
    }
  }, [
    saveCurrentRoute,
    setLoadingState,
    status,
    stopAndReconcileBackgroundSession,
    stopTrackingSession,
  ]);

  const handleTrackingBackground = useCallback(() => {
    stopWatcher();
  }, [stopWatcher]);

  const handleTrackingForeground = useCallback(async () => {
    if (!isMountedRef.current) return;

    if (useTrackingStore.getState().status === TRACKING_STATUS.TRACKING) {
      if (!await stopAndReconcileBackgroundSession()) return;
    }

    const hasPermission = await ensurePermission();
    if (!hasPermission || !isMountedRef.current) return;

    await startWatcher();

    if (useTrackingStore.getState().status === TRACKING_STATUS.TRACKING) {
      await startBackgroundSession();
    }
  }, [
    ensurePermission,
    startBackgroundSession,
    startWatcher,
    stopAndReconcileBackgroundSession,
  ]);

  useTrackingAppState({
    onBackground: handleTrackingBackground,
    onForeground: handleTrackingForeground,
  });

  useEffect(() => {
    isMountedRef.current = true;
    initializeTrackingView();

    return () => {
      isMountedRef.current = false;
      stopWatcher();
      resetLoadingStates();
    };
  }, [initializeTrackingView, resetLoadingStates, stopWatcher]);

  useEffect(() => {
    if (status === TRACKING_STATUS.IDLE) return;

    persistActiveSession();
  }, [currentLocation?.timestamp, persistActiveSession, routePointsCount, status]);

  useEffect(() => {
    if (status !== TRACKING_STATUS.TRACKING) return undefined;

    const interval = setInterval(() => {
      const autoStopDecision = getTrackingAutoStopDecision({
        session: getSessionSnapshot(),
      });

      applyAutoStopDecision(autoStopDecision);
    }, TRACKING_AUTO_STOP.CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [applyAutoStopDecision, getSessionSnapshot, status]);



  return {
    ...loadingStates,
    autoStopEvent,
    canAskLocationPermissionAgain,
    currentLocation,
    error,
    hasPermission: permissionStatus === 'granted',
    isIdle: status === TRACKING_STATUS.IDLE,
    isPaused: status === TRACKING_STATUS.PAUSED,
    isTracking: status === TRACKING_STATUS.TRACKING,
    locationStatus,
    locationServicesEnabled,
    pauseTracking,
    permissionStatus,
    resumeTracking,
    startTracking,
    status,
    stopTracking,
  };
}

export default useTrackingSession;
