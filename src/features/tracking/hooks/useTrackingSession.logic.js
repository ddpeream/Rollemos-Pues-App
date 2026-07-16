import { useCallback, useEffect, useMemo, useRef } from 'react';

import {
  TRACKING_AUTO_STOP,
  TRACKING_AUTO_STOP_ACTION,
  TRACKING_ERROR,
  TRACKING_FOCUS_DELTA,
  TRACKING_LOCATION_FILTER,
  TRACKING_LOCATION_STATUS,
  TRACKING_STATUS,
} from '../constants/tracking.constants';
import { processTrackingLocationPosition } from '../normalizers/location.normalizer';
import {
  getCurrentTrackingPosition,
  getLastKnownTrackingPosition,
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
  const hasTriedRestoreRef = useRef(false);
  const hasTriedVisibleLocationRef = useRef(false);

  const autoStopEvent = useTrackingStore((state) => state.autoStopEvent);
  const currentLocation = useTrackingStore((state) => state.currentLocation);
  const error = useTrackingStore((state) => state.error);
  const loadingStates = useTrackingStore((state) => state.loadingStates);
  const locationStatus = useTrackingStore((state) => state.locationStatus);
  const permissionStatus = useTrackingStore((state) => state.permissionStatus);
  const routeCoordinatesCount = useTrackingStore((state) => state.routeCoordinates.length);
  const status = useTrackingStore((state) => state.status);
  const setCurrentLocation = useTrackingStore((state) => state.setCurrentLocation);
  const setError = useTrackingStore((state) => state.setError);
  const setLoadingState = useTrackingStore((state) => state.setLoadingState);
  const setLocationStatus = useTrackingStore((state) => state.setLocationStatus);
  const setPermissionStatus = useTrackingStore((state) => state.setPermissionStatus);
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
  }, []);

  const setPosition = useCallback((position, options = {}) => {
    const { coordinate, error: locationError } = processTrackingLocationPosition({
      ...options,
      position,
      previousCoordinate: useTrackingStore.getState().currentLocation,
    });

    if (!coordinate) {
      if (!useTrackingStore.getState().currentLocation) {
        setLocationStatus(TRACKING_LOCATION_STATUS.ERROR);
        setError(locationError);
      }
      return null;
    }

    setCurrentLocation(coordinate);
    setLocationStatus(TRACKING_LOCATION_STATUS.READY);
    setError(null);
    return coordinate;
  }, [setCurrentLocation, setError, setLocationStatus]);

  const ensurePermission = useCallback(async () => {
    setLocationStatus(TRACKING_LOCATION_STATUS.REQUESTING_PERMISSION);

    try {
      const nextPermissionStatus = await requestTrackingLocationPermission();
      setPermissionStatus(nextPermissionStatus);

      if (nextPermissionStatus !== 'granted') {
        setLocationStatus(TRACKING_LOCATION_STATUS.UNAVAILABLE);
        setError(TRACKING_ERROR.LOCATION_PERMISSION_DENIED);
        return false;
      }

      setError(null);
      return true;
    } catch {
      setLocationStatus(TRACKING_LOCATION_STATUS.ERROR);
      setError(TRACKING_ERROR.LOCATION_PERMISSION_FAILED);
      return false;
    }
  }, [setError, setLocationStatus, setPermissionStatus]);

  const hydrateInitialLocation = useCallback(async () => {
    let hydratedLocation = null;

    try {
      const lastKnownPosition = await getLastKnownTrackingPosition();
      hydratedLocation = setPosition(lastKnownPosition, {
        allowStale: true,
        maxAccuracyMeters: TRACKING_LOCATION_FILTER.MAX_INITIAL_ACCURACY_METERS,
      }) || hydratedLocation;
    } catch {
      // A fresh GPS position is still attempted below.
    }

    try {
      const currentPosition = await getCurrentTrackingPosition();
      hydratedLocation = setPosition(currentPosition, { validateJump: false }) || hydratedLocation;
    } catch (locationError) {
      if (!hydratedLocation) throw locationError;
    }

    return hydratedLocation;
  }, [setPosition]);

  const startWatcher = useCallback(async () => {
    stopWatcher();
    const watcherGeneration = watcherGenerationRef.current;
    const subscription = await watchTrackingPosition(
      (position) => {
        if (watcherGeneration === watcherGenerationRef.current) {
          setPosition(position);
        }
      },
      () => {
        if (watcherGeneration !== watcherGenerationRef.current) return;
        setLocationStatus(TRACKING_LOCATION_STATUS.ERROR);
        setError(TRACKING_ERROR.LOCATION_WATCH_FAILED);
      },
    );

    if (watcherGeneration !== watcherGenerationRef.current) {
      subscription.remove();
      return false;
    }

    subscriptionRef.current = subscription;
    return true;
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

    if (status !== TRACKING_STATUS.IDLE) return false;

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

      if (session.status === TRACKING_STATUS.TRACKING) {
        const hasPermission = await ensurePermission();

        if (!hasPermission) {
          hydrateRouteSession({
            ...session,
            pausedAt: Date.now(),
            status: TRACKING_STATUS.PAUSED,
          });
          return true;
        }

        await startWatcher();
      }

      return true;
    } catch (trackingError) {
      setError(trackingError?.message || TRACKING_ERROR.RESTORE_FAILED);
      return false;
    }
  }, [ensurePermission, hydrateRouteSession, setAutoStopEvent, setError, startWatcher, status]);

  const applyAutoStopDecision = useCallback(async (autoStopDecision) => {
    if (autoStopDecision.action === TRACKING_AUTO_STOP_ACTION.NONE) return false;

    if (autoStopDecision.action === TRACKING_AUTO_STOP_ACTION.CLEAN_SESSION) {
      stopWatcher();
      await clearActiveTrackingSession();
      resetRouteSession();
      setStatus(TRACKING_STATUS.IDLE);
      setAutoStopEvent(createAutoStopEvent(autoStopDecision));
      return true;
    }

    if (autoStopDecision.action === TRACKING_AUTO_STOP_ACTION.AUTO_PAUSE) {
      stopWatcher();
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
    stopWatcher,
  ]);

  const hydrateVisibleLocation = useCallback(async () => {
    if (hasTriedVisibleLocationRef.current) return false;
    if (status !== TRACKING_STATUS.IDLE) return false;

    hasTriedVisibleLocationRef.current = true;

    try {
      const hasPermission = await ensurePermission();
      if (!hasPermission) return false;

      await hydrateInitialLocation();
      return true;
    } catch (trackingError) {
      setLocationStatus(TRACKING_LOCATION_STATUS.ERROR);
      setError(trackingError?.message || TRACKING_ERROR.LOCATION_HYDRATE_FAILED);
      return false;
    }
  }, [ensurePermission, hydrateInitialLocation, setError, status]);

  const initializeTrackingView = useCallback(async () => {
    const restoredSession = await restoreActiveSession();
    if (restoredSession) return;

    await hydrateVisibleLocation();
  }, [hydrateVisibleLocation, restoreActiveSession]);

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
    if (status !== TRACKING_STATUS.IDLE) return false;

    setLoadingState('isStarting', true);

    try {
      const hasPermission = await ensurePermission();
      if (!hasPermission) return false;

      clearAutoStopEvent();
      const initialLocation = await hydrateInitialLocation();
      startRouteSession(initialLocation);
      await startWatcher();
      setStatus(TRACKING_STATUS.TRACKING);
      await persistActiveSession();
      return true;
    } catch (trackingError) {
      setError(trackingError?.message || TRACKING_ERROR.START_FAILED);
      stopWatcher();
      setStatus(TRACKING_STATUS.IDLE);
      return false;
    } finally {
      setLoadingState('isStarting', false);
    }
  }, [
    clearAutoStopEvent,
    ensurePermission,
    hydrateInitialLocation,
    persistActiveSession,
    setError,
    setLoadingState,
    setStatus,
    startWatcher,
    startRouteSession,
    status,
    stopWatcher,
  ]);

  const pauseTracking = useCallback(async () => {
    if (status !== TRACKING_STATUS.TRACKING) return false;

    setLoadingState('isPausing', true);

    try {
      stopWatcher();
      pauseRouteSession();
      setStatus(TRACKING_STATUS.PAUSED);
      await persistActiveSession();
      return true;
    } finally {
      setLoadingState('isPausing', false);
    }
  }, [pauseRouteSession, persistActiveSession, setLoadingState, setStatus, status, stopWatcher]);

  const resumeTracking = useCallback(async () => {
    if (status !== TRACKING_STATUS.PAUSED) return false;

    setLoadingState('isResuming', true);

    try {
      const hasPermission = await ensurePermission();
      if (!hasPermission) return false;

      clearAutoStopEvent();
      resumeRouteSession();
      await hydrateInitialLocation();
      await startWatcher();
      setStatus(TRACKING_STATUS.TRACKING);
      await persistActiveSession();
      return true;
    } catch (trackingError) {
      setError(trackingError?.message || TRACKING_ERROR.RESUME_FAILED);
      return false;
    } finally {
      setLoadingState('isResuming', false);
    }
  }, [
    ensurePermission,
    clearAutoStopEvent,
    hydrateInitialLocation,
    setError,
    setLoadingState,
    setStatus,
    startWatcher,
    persistActiveSession,
    resumeRouteSession,
    status,
  ]);

  const stopTracking = useCallback(async () => {
    if (status === TRACKING_STATUS.IDLE) return false;

    setLoadingState('isStopping', true);

    try {
      stopWatcher();
      await saveCurrentRoute();
      await clearActiveTrackingSession();
      resetRouteSession();
      setStatus(TRACKING_STATUS.IDLE);
      return true;
    } finally {
      setLoadingState('isStopping', false);
    }
  }, [resetRouteSession, saveCurrentRoute, setLoadingState, setStatus, status, stopWatcher]);

  useEffect(() => {
    initializeTrackingView();
  }, [initializeTrackingView]);

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

  const focusRegion = useMemo(() => {
    if (!currentLocation) return null;

    return {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      ...TRACKING_FOCUS_DELTA,
    };
  }, [currentLocation]);

  const centerMapOnUser = useCallback((mapRef) => {
    if (!focusRegion) return false;
    mapRef.current?.animateToRegion(focusRegion, 500);
    return true;
  }, [focusRegion]);

  useEffect(() => stopWatcher, [stopWatcher]);

  return {
    ...loadingStates,
    autoStopEvent,
    centerMapOnUser,
    currentLocation,
    error,
    focusRegion,
    hasPermission: permissionStatus === 'granted',
    isIdle: status === TRACKING_STATUS.IDLE,
    isPaused: status === TRACKING_STATUS.PAUSED,
    isTracking: status === TRACKING_STATUS.TRACKING,
    locationStatus,
    pauseTracking,
    permissionStatus,
    resumeTracking,
    startTracking,
    status,
    stopTracking,
  };
}

export default useTrackingSession;
