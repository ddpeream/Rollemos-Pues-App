import { create } from 'zustand';

import {
  TRACKING_LOADING_STATE,
  TRACKING_LOCATION_STATUS,
  TRACKING_METRICS,
  TRACKING_STATUS,
} from '../constants/tracking.constants';
import { createTimedMetrics } from './trackingMetrics.logic';
import {
  createAcceptedLocationPatch,
  createPausedSessionPatch,
  createRejectedLocationPatch,
  createRestoredSessionPatch,
  createResumedSessionPatch,
  createStartedSessionPatch,
  createStoppedSessionPatch,
} from './trackingSession.logic';

export const useTrackingStore = create((set, get) => ({
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
  routeSegments: [],
  startFlag: null,
  startedAt: null,
  status: TRACKING_STATUS.IDLE,
  totalPausedMs: 0,

  acceptTrackingLocation: (coordinate) => {
    const patch = createAcceptedLocationPatch(get(), coordinate);
    if (!patch) return false;

    set(patch);
    return true;
  },

  rejectTrackingLocation: (error) => {
    set(createRejectedLocationPatch(get(), error));
  },

  restoreTrackingSession: (session) => {
    if (get().status !== TRACKING_STATUS.IDLE) return false;

    const patch = createRestoredSessionPatch(session);
    if (!patch) return false;

    set(patch);
    return true;
  },

  startTrackingSession: (initialLocation) => {
    const patch = createStartedSessionPatch(get(), initialLocation);
    if (!patch) return false;

    set(patch);
    return true;
  },

  pauseTrackingSession: () => {
    const patch = createPausedSessionPatch(get());
    if (!patch) return false;

    set(patch);
    return true;
  },

  resumeTrackingSession: () => {
    const patch = createResumedSessionPatch(get());
    if (!patch) return false;

    set(patch);
    return true;
  },

  stopTrackingSession: () => {
    const patch = createStoppedSessionPatch(get());
    if (!patch) return false;

    set(patch);
    return true;
  },

  tickTrackingMetrics: (now = Date.now()) => {
    const state = get();
    if (state.status === TRACKING_STATUS.IDLE) return false;

    set({ metrics: createTimedMetrics(state, now) });
    return true;
  },

  setAutoStopEvent: (autoStopEvent) => set({ autoStopEvent }),
  setError: (error) => set({ error }),
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

  setLoadingState: (key, value) => set((state) => ({
    loadingStates: {
      ...state.loadingStates,
      [key]: value,
    },
  })),

  resetLoadingStates: () => set({ loadingStates: TRACKING_LOADING_STATE }),

  resetLiveTracking: () => set({
    liveError: null,
    livePaths: {},
    liveSkaters: [],
  }),
}));

export default useTrackingStore;
