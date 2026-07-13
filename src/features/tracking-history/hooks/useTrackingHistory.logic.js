import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useTrackingHistoryStore } from '../store/trackingHistoryStore';

export const useTrackingHistory = () => {
  const deleteRoute = useTrackingHistoryStore((state) => state.deleteRoute);
  const error = useTrackingHistoryStore((state) => state.error);
  const loadRoutes = useTrackingHistoryStore((state) => state.loadRoutes);
  const loadingStates = useTrackingHistoryStore((state) => state.loadingStates);
  const routes = useTrackingHistoryStore((state) => state.routes);

  useFocusEffect(
    useCallback(() => {
      loadRoutes();
    }, [loadRoutes])
  );

  const refreshRoutes = useCallback(() => (
    loadRoutes({ refreshing: true })
  ), [loadRoutes]);

  return {
    deleteRoute,
    error,
    isDeleting: loadingStates.isDeleting,
    isLoading: loadingStates.isLoading,
    isRefreshing: loadingStates.isRefreshing,
    refreshRoutes,
    routes,
  };
};
