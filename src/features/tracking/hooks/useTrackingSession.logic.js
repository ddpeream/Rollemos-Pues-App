import { useCallback, useEffect, useRef } from 'react';

import {
  TRACKING_AUTO_STOP,
  TRACKING_AUTO_STOP_ACTION,
  TRACKING_ERROR,
  TRACKING_LOCATION_FILTER,
  TRACKING_LOCATION_STATUS,
  TRACKING_STATUS,
} from '../constants/tracking.constants';
import { processTrackingLocationPosition } from '../normalizers/location.normalizer';
import {
  getCurrentTrackingPosition,
  getLastKnownTrackingPosition,
  getTrackingForegroundPermission,
  hasTrackingLocationServicesEnabled,
  requestTrackingLocationPermission,
  watchTrackingPosition,
} from '../services/location.service';
import { saveCompletedRoute } from '../services/routeStorage.service';
import {
  createAutoPausedSession,
  createAutoStopEvent,
  getTrackingAutoStopDecision,
} from '../services/trackingAutoStop.service';
import {
  clearActiveTrackingSession,
  loadActiveTrackingSession,
  saveActiveTrackingSession,
} from '../services/trackingSessionStorage.service';
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
  const routeCoordinatesCount = useTrackingStore((state) => state.routeCoordinates.length);
  const status = useTrackingStore((state) => state.status);
  const setCurrentLocation = useTrackingStore((state) => state.setCurrentLocation);
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
  const setStatus = useTrackingStore((state) => state.setStatus);
  const pauseRouteSession = useTrackingStore((state) => state.pauseRouteSession);
  const resetRouteSession = useTrackingStore((state) => state.resetRouteSession);
  const resumeRouteSession = useTrackingStore((state) => state.resumeRouteSession);
  const startRouteSession = useTrackingStore((state) => state.startRouteSession);
  const hydrateRouteSession = useTrackingStore((state) => state.hydrateRouteSession);
  const setAutoStopEvent = useTrackingStore((state) => state.setAutoStopEvent);
  const clearAutoStopEvent = useTrackingStore((state) => state.clearAutoStopEvent);

  const stopWatcher = useCallback(() => {
    watcherGenerationRef.current += 1;
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    watcherStartPromiseRef.current = null;
  }, []);

  const setPosition = useCallback((position, options = {}) => {
    if (!isMountedRef.current) return null;

    const { coordinate, error: locationError } = processTrackingLocationPosition({
      ...options,
      position,
      previousCoordinate: useTrackingStore.getState().currentLocation,
    });

    if (!coordinate) {
      setError(locationError);

      if (!useTrackingStore.getState().currentLocation) {
        setLocationStatus(TRACKING_LOCATION_STATUS.ERROR);
      }

      return null;
    }

    setCurrentLocation(coordinate);
    setLocationStatus(TRACKING_LOCATION_STATUS.READY);
    setError(null);
    return coordinate;
  }, [setCurrentLocation, setError, setLocationStatus]);

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

      hydratedLocation = setPosition(lastKnownPosition, {
        allowStale: true,
        maxAccuracyMeters: TRACKING_LOCATION_FILTER.MAX_INITIAL_ACCURACY_METERS,
      }) || hydratedLocation;
    } catch {
      // A fresh GPS position is still attempted below.
    }

    try {
      const currentPosition = await getCurrentTrackingPosition();
      if (!isMountedRef.current) return null;

      hydratedLocation = setPosition(currentPosition, { validateJump: false }) || hydratedLocation;
    } catch (locationError) {
      if (!hydratedLocation) throw locationError;
    }

    return hydratedLocation;
  }, [setPosition]);

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
              setPosition(position);
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
  }, [setError, setLocationStatus, setPosition, stopWatcher]);
  const persistActiveSession = useCallback(async () => {
    const {
      currentLocation: snapshotCurrentLocation,
      metrics,
      pausedAt,
      routeCoordinates,
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
        routeCoordinates,
        startFlag,
        startedAt,
        status: snapshotStatus,
        totalPausedMs,
      });
    } catch (sessionStorageError) {
      setError(sessionStorageError?.message || TRACKING_ERROR.SESSION_SAVE_FAILED);
    }
  }, [setError]);

  const getSessionSnapshot = useCallback(() => {
    const {
      currentLocation: snapshotCurrentLocation,
      metrics,
      pausedAt,
      routeCoordinates,
      startFlag,
      startedAt,
      status: snapshotStatus,
      totalPausedMs,
    } = useTrackingStore.getState();

    return {
      currentLocation: snapshotCurrentLocation,
      metrics,
      pausedAt,
      routeCoordinates,
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

      const autoStopDecision = getTrackingAutoStopDecision({ session });

      if (autoStopDecision.action === TRACKING_AUTO_STOP_ACTION.CLEAN_SESSION) {
        await clearActiveTrackingSession();
        setAutoStopEvent(createAutoStopEvent(autoStopDecision));
        return false;
      }

      if (autoStopDecision.action === TRACKING_AUTO_STOP_ACTION.AUTO_PAUSE) {
        const autoPausedSession = createAutoPausedSession(session);

        hydrateRouteSession(autoPausedSession);
        setAutoStopEvent(createAutoStopEvent(autoStopDecision));
        await saveActiveTrackingSession(autoPausedSession);
        return true;
      }

      hydrateRouteSession(session);


      return true;
    } catch (trackingError) {
      setError(trackingError?.message || TRACKING_ERROR.RESTORE_FAILED);
      return false;
    }
  }, [hydrateRouteSession, setAutoStopEvent, setError]);

  const applyAutoStopDecision = useCallback(async (autoStopDecision) => {
    if (autoStopDecision.action === TRACKING_AUTO_STOP_ACTION.NONE) return false;

    if (autoStopDecision.action === TRACKING_AUTO_STOP_ACTION.CLEAN_SESSION) {
      await clearActiveTrackingSession();
      resetRouteSession();
      setStatus(TRACKING_STATUS.IDLE);
      setAutoStopEvent(createAutoStopEvent(autoStopDecision));
      return true;
    }

    if (autoStopDecision.action === TRACKING_AUTO_STOP_ACTION.AUTO_PAUSE) {
      pauseRouteSession();
      setStatus(TRACKING_STATUS.PAUSED);
      setAutoStopEvent(createAutoStopEvent(autoStopDecision));
      await persistActiveSession();
      return true;
    }

    return false;
  }, [
    pauseRouteSession,
    persistActiveSession,
    resetRouteSession,
    setAutoStopEvent,
    setStatus,
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
    const restoredSession = await restoreActiveSession();
    if (!isMountedRef.current) return;

    const isLocationActive = await hydrateVisibleLocation();
    if (
      isLocationActive
      || !restoredSession
      || !isMountedRef.current
      || useTrackingStore.getState().status !== TRACKING_STATUS.TRACKING
    ) {
      return;
    }

    pauseRouteSession();
    setStatus(TRACKING_STATUS.PAUSED);
    await persistActiveSession();
  }, [
    hydrateVisibleLocation,
    pauseRouteSession,
    persistActiveSession,
    restoreActiveSession,
    setStatus,
  ]);
  const saveCurrentRoute = useCallback(async () => {
    const {
      metrics,
      pausedAt,
      routeCoordinates,
      startedAt,
      totalPausedMs,
    } = useTrackingStore.getState();

    try {
      await saveCompletedRoute({
        endedAt: Date.now(),
        metrics,
        pausedAt,
        routeCoordinates,
        startedAt,
        totalPausedMs,
      });
    } catch (routeStorageError) {
      setError(routeStorageError?.message || TRACKING_ERROR.ROUTE_SAVE_FAILED);
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

      clearAutoStopEvent();
      startRouteSession(initialLocation);
      setStatus(TRACKING_STATUS.TRACKING);
      await persistActiveSession();
      return true;
    } catch (trackingError) {
      if (isMountedRef.current) {
        setError(trackingError?.message || TRACKING_ERROR.START_FAILED);
        setStatus(TRACKING_STATUS.IDLE);
      }

      return false;
    } finally {
      if (isMountedRef.current) {
        setLoadingState('isStarting', false);
      }
    }
  }, [
    clearAutoStopEvent,
    ensurePermission,
    hydrateInitialLocation,
    persistActiveSession,
    setError,
    setLoadingState,
    setStatus,
    startRouteSession,
    startWatcher,
    status,
  ]);
  const pauseTracking = useCallback(async () => {
    if (status !== TRACKING_STATUS.TRACKING) return false;

    setLoadingState('isPausing', true);

    try {
      pauseRouteSession();
      setStatus(TRACKING_STATUS.PAUSED);
      await persistActiveSession();
      return true;
    } finally {
      if (isMountedRef.current) {
        setLoadingState('isPausing', false);
      }
    }
  }, [pauseRouteSession, persistActiveSession, setLoadingState, setStatus, status]);
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

      clearAutoStopEvent();
      resumeRouteSession();
      setStatus(TRACKING_STATUS.TRACKING);
      await persistActiveSession();
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
    clearAutoStopEvent,
    ensurePermission,
    hydrateInitialLocation,
    persistActiveSession,
    resumeRouteSession,
    setError,
    setLoadingState,
    setStatus,
    startWatcher,
    status,
  ]);
  const stopTracking = useCallback(async () => {
    if (status === TRACKING_STATUS.IDLE) return false;

    setLoadingState('isStopping', true);

    try {
      await saveCurrentRoute();
      await clearActiveTrackingSession();
      resetRouteSession();
      setStatus(TRACKING_STATUS.IDLE);
      return true;
    } finally {
      if (isMountedRef.current) {
        setLoadingState('isStopping', false);
      }
    }
  }, [resetRouteSession, saveCurrentRoute, setLoadingState, setStatus, status]);
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
  }, [currentLocation?.timestamp, persistActiveSession, routeCoordinatesCount, status]);

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
