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
  const valueTextProps = {
    adjustsFontSizeToFit: true,
    minimumFontScale: theme.tracking.statsTop.minimumFontScale,
    numberOfLines: 1,
  };

  return (
    <View style={[styles.container, statsContainerStyle]}>
      <View style={styles.row}>
        <View style={styles.item}>
          <Text
            {...valueTextProps}
            style={[styles.value, { color: theme.colors.primary }]}
          >
            {distance}
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.label, { color: statsTextSecondary }]}
          >
            Distancia
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={[styles.item, styles.durationItem]}>
          <Text
            {...valueTextProps}
            style={[styles.value, { color: statsTextPrimary }]}
          >
            {duration}
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.label, { color: statsTextSecondary }]}
          >
            Tiempo
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.item}>
          <Text
            {...valueTextProps}
            style={[styles.value, { color: statsTextPrimary }]}
          >
            {speed}
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.label, { color: statsTextSecondary }]}
          >
            km/h
          </Text>
        </View>
      </View>
    </View>
  );
}
