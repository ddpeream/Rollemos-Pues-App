import React from 'react';
import { View, Text, Animated } from 'react-native';
import { styles } from '../../screens/tracking/tracking.style';

export default function TrackingStatsTop({
  visible,
  statsOpacity,
  showStats,
  statsContainerStyle,
  statsTextSecondary,
  statsTextPrimary,
  theme,
  t,
  formatDistance,
  formatDuration,
  distance,
  duration,
  speed,
}) {
  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.statsTopContainer,
        statsContainerStyle,
        { opacity: statsOpacity },
      ]}
      pointerEvents={showStats ? 'auto' : 'none'}
    >
      <View style={styles.mainStatsRow}>
        <View style={styles.mainStatItem}>
          <Text style={[styles.mainStatValue, { color: theme.colors.primary }]}>
            {formatDistance(distance)}
          </Text>
          <Text style={[styles.mainStatLabel, { color: statsTextSecondary }]}>
            {t ? t('screens.tracking.distance') : 'Distancia'}
          </Text>
        </View>

        <View
          style={[
            styles.statDividerVertical,
            { backgroundColor: theme.colors.border },
          ]}
        />

        <View style={styles.mainStatItem}>
          <Text style={[styles.mainStatValue, { color: statsTextPrimary }]}>
            {formatDuration(duration)}
          </Text>
          <Text style={[styles.mainStatLabel, { color: statsTextSecondary }]}>
            {t ? t('screens.tracking.time') : 'Tiempo'}
          </Text>
        </View>

        <View
          style={[
            styles.statDividerVertical,
            { backgroundColor: theme.colors.border },
          ]}
        />

        <View style={styles.mainStatItem}>
          <Text style={[styles.mainStatValue, { color: statsTextPrimary }]}>
            {speed.toFixed(1)}
          </Text>
          <Text style={[styles.mainStatLabel, { color: statsTextSecondary }]}>
            km/h
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
