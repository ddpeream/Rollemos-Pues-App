import { create } from 'zustand';

import {
  TRACKING_LOADING_STATE,
  TRACKING_LOCATION_STATUS,
  TRACKING_METRICS,
  TRACKING_STATUS,
} from '../constants/tracking.constants';
import { shouldAppendRouteCoordinate } from '../utils/route.utils';

export const useTrackingStore = create((set) => ({
  autoStopEvent: null,
  canAskLocationPermissionAgain: true,
  currentLocation: null,
  error: null,
  loadingStates: TRACKING_LOADING_STATE,
  locationServicesEnabled: null,
  locationStatus: TRACKING_LOCATION_STATUS.IDLE,
  liveError: null,
  isLivePrivate: false,
  livePaths: {},
  liveSkaters: [],
  privacyError: null,
  isPrivacyReady: false,
  metrics: TRACKING_METRICS,
  pausedAt: null,
  permissionStatus: 'undetermined',
  routeCoordinates: [],
  startFlag: null,
  startedAt: null,
  status: TRACKING_STATUS.IDLE,
  totalPausedMs: 0,

  clearAutoStopEvent: () => set({ autoStopEvent: null }),
  setAutoStopEvent: (autoStopEvent) => set({ autoStopEvent }),
  setCurrentLocation: (currentLocation) => set({ currentLocation }),
  setError: (error) => set({ error }),
  setMetrics: (metrics) => set((state) => ({
    metrics: {
      ...state.metrics,
      ...metrics,
    },
  })),
  setLiveError: (liveError) => set({ liveError }),
  setLocationPermissionDetails: ({ canAskAgain, status }) => set({
    canAskLocationPermissionAgain: canAskAgain,
    permissionStatus: status,
  }),
  setLocationServicesEnabled: (locationServicesEnabled) => set({ locationServicesEnabled }),
  setLocationStatus: (locationStatus) => set({ locationStatus }),
  setLivePrivacy: (isLivePrivate) => set({
    isLivePrivate,
    isPrivacyReady: true,
    privacyError: null,
  }),
  setPrivacyError: (privacyError) => set({ isPrivacyReady: true, privacyError }),
  setLiveSkaters: (liveSkaters) => set({ liveSkaters }),
  setLivePaths: (livePaths) => set({ livePaths }),
  setStatus: (status) => set({ status }),

  setLoadingState: (key, value) => set((state) => ({
    loadingStates: {
      ...state.loadingStates,
      [key]: value,
    },
  })),

  resetLoadingStates: () => set({ loadingStates: TRACKING_LOADING_STATE }),

  hydrateRouteSession: ({
    currentLocation,
    metrics,
    pausedAt,
    routeCoordinates,
    startFlag,
    startedAt,
    status,
    totalPausedMs,
  }) => set({
    currentLocation,
    metrics: {
      ...TRACKING_METRICS,
      ...metrics,
    },
    pausedAt,
    routeCoordinates: Array.isArray(routeCoordinates) ? routeCoordinates : [],
    startFlag,
    startedAt,
    status,
    totalPausedMs: totalPausedMs || 0,
  }),

  startRouteSession: (initialLocation) => set(() => {
    const startedAt = Date.now();
    const safeInitialLocation = initialLocation
      ? { ...initialLocation, timestamp: initialLocation.timestamp || startedAt }
      : null;

    return {
      autoStopEvent: null,
      metrics: TRACKING_METRICS,
      pausedAt: null,
      routeCoordinates: safeInitialLocation ? [safeInitialLocation] : [],
      startFlag: safeInitialLocation,
      startedAt,
      totalPausedMs: 0,
    };
  }),

  appendRoutePoint: (coordinate) => set((state) => {
    if (!shouldAppendRouteCoordinate(state.routeCoordinates, coordinate)) {
      return {};
    }

    return {
      routeCoordinates: [
        ...state.routeCoordinates,
        {
          ...coordinate,
          timestamp: coordinate.timestamp || Date.now(),
        },
      ],
      startFlag: state.startFlag || coordinate,
    };
  }),

  pauseRouteSession: () => set((state) => ({
    pausedAt: state.pausedAt || Date.now(),
  })),

  resumeRouteSession: () => set((state) => {
    if (!state.pausedAt) return {};

    return {
      pausedAt: null,
      totalPausedMs: state.totalPausedMs + (Date.now() - state.pausedAt),
    };
  }),

  resetRouteSession: () => set({
    autoStopEvent: null,
    metrics: TRACKING_METRICS,
    pausedAt: null,
    routeCoordinates: [],
    startFlag: null,
    startedAt: null,
    totalPausedMs: 0,
  }),

  resetLiveTracking: () => set({
    liveError: null,
    livePaths: {},
    liveSkaters: [],
  }),
}));

export default useTrackingStore;
