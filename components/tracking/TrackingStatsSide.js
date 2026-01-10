import React from 'react';
import { View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../screens/tracking/tracking.style';

export default function TrackingStatsSide({
  visible,
  statsOpacity,
  showStats,
  statsContainerStyle,
  statsTextSecondary,
  theme,
  avgSpeed,
  maxSpeed,
  calories,
}) {
  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.statsSideContainer,
        statsContainerStyle,
        { opacity: statsOpacity },
      ]}
      pointerEvents={showStats ? 'auto' : 'none'}
    >
      <View style={styles.secondaryStatsColumn}>
        <View style={styles.miniStatItem}>
          <Ionicons name="trending-up" size={12} color={theme.colors.primary} />
          <Text style={[styles.miniStatValue, { color: statsTextSecondary }]}>
            {avgSpeed.toFixed(1)}
          </Text>
        </View>
        <View style={styles.miniStatItem}>
          <Ionicons name="flash" size={12} color={theme.colors.warning} />
          <Text style={[styles.miniStatValue, { color: statsTextSecondary }]}>
            {maxSpeed.toFixed(1)}
          </Text>
        </View>
        <View style={styles.miniStatItem}>
          <Ionicons name="flame" size={12} color={theme.colors.error} />
          <Text style={[styles.miniStatValue, { color: statsTextSecondary }]}>
            {calories}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
