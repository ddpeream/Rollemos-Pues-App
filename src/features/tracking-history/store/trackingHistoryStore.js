import { create } from 'zustand';

import {
  deleteSavedRoute,
  hydrateSavedRoute,
  loadSavedRoutes,
} from '../../tracking/services/routeStorage.service';
import { TRACKING_HISTORY_LOADING_STATE } from '../constants/trackingHistory.constants';

export const useTrackingHistoryStore = create((set, get) => ({
  error: null,
  loadingStates: TRACKING_HISTORY_LOADING_STATE,
  routes: [],
  selectedRoute: null,

  clearSelectedRoute: () => set({ selectedRoute: null }),
  setError: (error) => set({ error }),

  setLoadingState: (key, value) => set((state) => ({
    loadingStates: {
      ...state.loadingStates,
      [key]: value,
    },
  })),

  loadRoutes: async ({ refreshing = false } = {}) => {
    const loadingKey = refreshing ? 'isRefreshing' : 'isLoading';
    get().setLoadingState(loadingKey, true);
    set({ error: null });

    try {
      const routes = await loadSavedRoutes();
      set({ routes });
      return { ok: true, routes };
    } catch (error) {
      const message = error?.message || 'tracking_history_load_failed';
      set({ error: message });
      return { error: message, ok: false };
    } finally {
      get().setLoadingState(loadingKey, false);
    }
  },

  hydrateRoute: async (routeId) => {
    get().setLoadingState('isHydrating', true);
    set({ error: null, selectedRoute: null });

    try {
      const route = await hydrateSavedRoute(routeId);
      if (!route) {
        const message = 'tracking_history_route_not_found';
        set({ error: message, selectedRoute: null });
        return { error: message, ok: false };
      }

      set({ selectedRoute: route });
      return { ok: true, route };
    } catch (error) {
      const message = error?.message || 'tracking_history_hydrate_failed';
      set({ error: message, selectedRoute: null });
      return { error: message, ok: false };
    } finally {
      get().setLoadingState('isHydrating', false);
    }
  },

  deleteRoute: async (routeId) => {
    get().setLoadingState('isDeleting', true);
    set({ error: null });

    try {
      const routes = await deleteSavedRoute(routeId);
      set((state) => ({
        routes,
        selectedRoute: state.selectedRoute?.id === routeId ? null : state.selectedRoute,
      }));
      return { ok: true, routes };
    } catch (error) {
      const message = error?.message || 'tracking_history_delete_failed';
      set({ error: message });
      return { error: message, ok: false };
    } finally {
      get().setLoadingState('isDeleting', false);
    }
  },
}));

export default useTrackingHistoryStore;
