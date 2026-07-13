import React from 'react';
import { Text, View } from 'react-native';

import { styles } from './TrackingStatsTop.style';

export default function TrackingStatsTopView({
  statsContainerStyle,
  statsTextSecondary,
  statsTextPrimary,
  theme,
  distance,
  duration,
  speed,
}) {
  return (
    <View style={[styles.container, statsContainerStyle]}>
      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={[styles.value, { color: theme.colors.primary }]}>{distance}</Text>
          <Text style={[styles.label, { color: statsTextSecondary }]}>Distancia</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.item}>
          <Text style={[styles.value, { color: statsTextPrimary }]}>{duration}</Text>
          <Text style={[styles.label, { color: statsTextSecondary }]}>Tiempo</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.item}>
          <Text style={[styles.value, { color: statsTextPrimary }]}>{speed}</Text>
          <Text style={[styles.label, { color: statsTextSecondary }]}>km/h</Text>
        </View>
      </View>
    </View>
  );
}
