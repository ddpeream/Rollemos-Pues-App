import { useCallback, useEffect, useMemo, useRef } from 'react';

import {
  TRACKING_AUTO_STOP,
  TRACKING_AUTO_STOP_ACTION,
  TRACKING_FOCUS_DELTA,
  TRACKING_STATUS,
} from '../constants/tracking.constants';
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

const hasValidCoordinate = (coords) => (
  Number.isFinite(coords?.latitude) && Number.isFinite(coords?.longitude)
);

const toTrackingCoordinate = (position) => ({
  latitude: position.coords.latitude,
  longitude: position.coords.longitude,
  heading: Number.isFinite(position.coords.heading) ? position.coords.heading : 0,
  speed: Number.isFinite(position.coords.speed) ? position.coords.speed : null,
  timestamp: Number.isFinite(position.timestamp) ? position.timestamp : Date.now(),
});

export function useTrackingSession() {
  // Fuente unica del watcher GPS de la sesion de tracking.
  // Otros hooks deben consumir currentLocation desde trackingStore.
  const subscriptionRef = useRef(null);
  const hasTriedRestoreRef = useRef(false);
  const hasTriedVisibleLocationRef = useRef(false);

  const autoStopEvent = useTrackingStore((state) => state.autoStopEvent);
  const currentLocation = useTrackingStore((state) => state.currentLocation);
  const error = useTrackingStore((state) => state.error);
  const loadingStates = useTrackingStore((state) => state.loadingStates);
  const permissionStatus = useTrackingStore((state) => state.permissionStatus);
  const routeCoordinatesCount = useTrackingStore((state) => state.routeCoordinates.length);
  const status = useTrackingStore((state) => state.status);
  const setCurrentLocation = useTrackingStore((state) => state.setCurrentLocation);
  const setError = useTrackingStore((state) => state.setError);
  const setLoadingState = useTrackingStore((state) => state.setLoadingState);
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
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
  }, []);

  const setPosition = useCallback((position) => {
    if (hasValidCoordinate(position?.coords)) {
      const coordinate = toTrackingCoordinate(position);
      setCurrentLocation(coordinate);
      return coordinate;
    }

    return null;
  }, [setCurrentLocation]);

  const ensurePermission = useCallback(async () => {
    const nextPermissionStatus = await requestTrackingLocationPermission();
    setPermissionStatus(nextPermissionStatus);

    if (nextPermissionStatus !== 'granted') {
      setError('location_permission_denied');
      return false;
    }

    setError(null);
    return true;
  }, [setError, setPermissionStatus]);

  const hydrateInitialLocation = useCallback(async () => {
    let hydratedLocation = null;

    const lastKnownPosition = await getLastKnownTrackingPosition();
    hydratedLocation = setPosition(lastKnownPosition) || hydratedLocation;

    const currentPosition = await getCurrentTrackingPosition();
    hydratedLocation = setPosition(currentPosition) || hydratedLocation;

    return hydratedLocation;
  }, [setPosition]);

  const startWatcher = useCallback(async () => {
    stopWatcher();
    subscriptionRef.current = await watchTrackingPosition(setPosition, (watchError) => {
      setError(watchError?.message || 'tracking_watch_failed');
    });
  }, [setError, setPosition, stopWatcher]);

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
      setError(sessionStorageError?.message || 'tracking_session_save_failed');
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
      setError(trackingError?.message || 'tracking_restore_failed');
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
    if (status !== TRACKING_STATUS.IDLE || currentLocation) return false;

    hasTriedVisibleLocationRef.current = true;

    try {
      const hasPermission = await ensurePermission();
      if (!hasPermission) return false;

      await hydrateInitialLocation();
      return true;
    } catch (trackingError) {
      setError(trackingError?.message || 'tracking_location_hydrate_failed');
      return false;
    }
  }, [currentLocation, ensurePermission, hydrateInitialLocation, setError, status]);

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
      setError(routeStorageError?.message || 'route_save_failed');
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
      setError(trackingError?.message || 'tracking_start_failed');
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
      setError(trackingError?.message || 'tracking_resume_failed');
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
    pauseTracking,
    permissionStatus,
    resumeTracking,
    startTracking,
    status,
    stopTracking,
  };
}

export default useTrackingSession;
