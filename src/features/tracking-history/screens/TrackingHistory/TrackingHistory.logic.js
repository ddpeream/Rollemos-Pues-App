import React, { useMemo } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

import { APP_ROUTES } from '../../../../navigation/navigation.constants';
import { useTheme } from '../../../../hooks/useTheme';
import HistoricalRouteCard from '../../components/HistoricalRouteCard/HistoricalRouteCard';
import { useTrackingHistory } from '../../hooks/useTrackingHistory';
import { createStyles } from './trackingHistory.style';
import TrackingHistoryView from './TrackingHistory.ui';

export default function TrackingHistory({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {
    deleteRoute,
    error,
    isDeleting,
    isLoading,
    isRefreshing,
    refreshRoutes,
    routes,
  } = useTrackingHistory();

  const copy = useMemo(() => ({
    card: {
      calories: t('trackingHistory.card.calories'),
      delete: t('trackingHistory.card.delete'),
      maxSpeed: t('trackingHistory.card.maxSpeed'),
      points: t('trackingHistory.card.points'),
      unknownDate: t('trackingHistory.card.unknownDate'),
      view: t('trackingHistory.card.view'),
    },
    deleteCancel: t('trackingHistory.delete.cancel'),
    deleteConfirm: t('trackingHistory.delete.confirm'),
    deleteMessage: t('trackingHistory.delete.message'),
    deleteTitle: t('trackingHistory.delete.title'),
    emptyHint: t('trackingHistory.empty.hint'),
    emptyTitle: t('trackingHistory.empty.title'),
    error: t('trackingHistory.error'),
    loading: t('trackingHistory.loading'),
    subtitle: t('trackingHistory.subtitle', { count: routes.length }),
    title: t('trackingHistory.title'),
  }), [routes.length, t]);

  const openRoute = (route) => {
    navigation.navigate(APP_ROUTES.TRACKING_HISTORY_DETAIL, { routeId: route.id });
  };

  const goBack = () => {
    navigation.goBack();
  };

  const confirmDeleteRoute = (route) => {
    Alert.alert(
      copy.deleteTitle,
      copy.deleteMessage,
      [
        { style: 'cancel', text: copy.deleteCancel },
        {
          onPress: () => deleteRoute(route.id),
          style: 'destructive',
          text: copy.deleteConfirm,
        },
      ]
    );
  };

  const renderRoute = ({ item }) => (
    <HistoricalRouteCard
      copy={copy.card}
      onDelete={confirmDeleteRoute}
      onOpen={openRoute}
      route={item}
    />
  );

  return (
    <TrackingHistoryView
      copy={copy}
      error={error}
      isDeleting={isDeleting}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      onBackPress={goBack}
      onRefresh={refreshRoutes}
      renderRoute={renderRoute}
      routes={routes}
      styles={styles}
      theme={theme}
    />
  );
}
