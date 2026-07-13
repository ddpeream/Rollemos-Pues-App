import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../../../hooks/useTheme';
import HistoricalRouteMap from '../../components/HistoricalRouteMap/HistoricalRouteMap';
import { useTrackingHistoryStore } from '../../store/trackingHistoryStore';
import { createStyles } from './trackingHistoryDetail.style';
import TrackingHistoryDetailView from './TrackingHistoryDetail.ui';

export default function TrackingHistoryDetail({ navigation, route }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const routeId = route?.params?.routeId;

  const clearSelectedRoute = useTrackingHistoryStore((state) => state.clearSelectedRoute);
  const error = useTrackingHistoryStore((state) => state.error);
  const hydrateRoute = useTrackingHistoryStore((state) => state.hydrateRoute);
  const isHydrating = useTrackingHistoryStore((state) => state.loadingStates.isHydrating);
  const selectedRoute = useTrackingHistoryStore((state) => state.selectedRoute);

  const copy = useMemo(() => ({
    badge: {
      title: t('trackingHistory.detail.badgeTitle'),
    },
    back: t('trackingHistory.detail.back'),
    error: t('trackingHistory.detail.error'),
    loading: t('trackingHistory.detail.loading'),
  }), [t]);

  useEffect(() => {
    if (routeId) {
      hydrateRoute(routeId);
    }

    return () => {
      clearSelectedRoute();
    };
  }, [clearSelectedRoute, hydrateRoute, routeId]);

  const goBack = () => {
    navigation.goBack();
  };

  return (
    <TrackingHistoryDetailView
      copy={copy}
      error={error}
      isLoading={isHydrating}
      map={selectedRoute ? (
        <HistoricalRouteMap
          badgeCopy={copy.badge}
          onClose={goBack}
          route={selectedRoute}
        />
      ) : null}
      onBackPress={goBack}
      styles={styles}
      theme={theme}
    />
  );
}
