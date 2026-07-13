import React, { useMemo } from 'react';

import { useTheme } from '../../../../hooks/useTheme';
import {
  formatDistance,
  formatDuration,
} from '../../../tracking/utils/format.utils';
import { createStyles } from './historicalRouteBadge.style';
import HistoricalRouteBadgeView from './HistoricalRouteBadge.ui';

export default function HistoricalRouteBadge({ copy, onClose, route }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!route) return null;

  return (
    <HistoricalRouteBadgeView
      copy={copy}
      distance={formatDistance(route.distance)}
      duration={formatDuration(route.duration)}
      onClose={onClose}
      styles={styles}
      theme={theme}
    />
  );
}
