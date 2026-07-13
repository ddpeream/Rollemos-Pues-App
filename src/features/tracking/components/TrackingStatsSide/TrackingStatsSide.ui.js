import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { sizes } from '../../../../theme';
import { styles } from './TrackingStatsSide.style';

export default function TrackingStatsSideView({
  statsContainerStyle,
  statsTextSecondary,
  theme,
  avgSpeed,
  maxSpeed,
  calories,
}) {
  return (
    <View style={[styles.container, statsContainerStyle]}>
      <View style={styles.column}>
        <View style={styles.item}>
          <Ionicons name="trending-up" size={sizes.icon.xs} color={theme.colors.primary} />
          <Text style={[styles.value, { color: statsTextSecondary }]}>{avgSpeed}</Text>
        </View>
        <View style={styles.item}>
          <Ionicons name="flash" size={sizes.icon.xs} color={theme.colors.warning} />
          <Text style={[styles.value, { color: statsTextSecondary }]}>{maxSpeed}</Text>
        </View>
        <View style={styles.item}>
          <Ionicons name="flame" size={sizes.icon.xs} color={theme.colors.error} />
          <Text style={[styles.value, { color: statsTextSecondary }]}>{calories}</Text>
        </View>
      </View>
    </View>
  );
}
