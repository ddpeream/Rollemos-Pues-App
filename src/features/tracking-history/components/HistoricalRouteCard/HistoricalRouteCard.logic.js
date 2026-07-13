import React, { useMemo } from 'react';

import { useTheme } from '../../../../hooks/useTheme';
import {
  formatCalories,
  formatDistance,
  formatDuration,
  formatSpeed,
} from '../../../tracking/utils/format.utils';
import {
  createRoutePreviewSegments,
  getRoutePreviewCoordinates,
  normalizeRoutePreviewPoints,
} from '../../utils/routePreview.utils';
import { createStyles } from './historicalRouteCard.style';
import HistoricalRouteCardView from './HistoricalRouteCard.ui';

export default function HistoricalRouteCard({
  copy,
  onDelete,
  onOpen,
  route,
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const dateLabel = useMemo(() => {
    const dateValue = route?.endedAt || route?.createdAt;
    if (!dateValue) return copy.unknownDate;

    return new Date(dateValue).toLocaleDateString(undefined, {
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
    });
  }, [copy.unknownDate, route?.createdAt, route?.endedAt]);

  const previewPoints = useMemo(() => (
    normalizeRoutePreviewPoints(getRoutePreviewCoordinates(route))
  ), [route]);

  const previewSegments = useMemo(() => (
    createRoutePreviewSegments(previewPoints)
  ), [previewPoints]);

  return (
    <HistoricalRouteCardView
      copy={copy}
      dateLabel={dateLabel}
      formattedRoute={{
        avgSpeed: `${formatSpeed(route.avgSpeed)} km/h`,
        calories: `${formatCalories(route.calories)} kcal`,
        distance: formatDistance(route.distance),
        duration: formatDuration(route.duration),
        maxSpeed: `${formatSpeed(route.maxSpeed)} km/h`,
        pointsCount: route.pointsCount || 0,
      }}
      onDelete={() => onDelete(route)}
      onOpen={() => onOpen(route)}
      previewPoints={previewPoints}
      previewSegments={previewSegments}
      route={route}
      styles={styles}
      theme={theme}
    />
  );
}
