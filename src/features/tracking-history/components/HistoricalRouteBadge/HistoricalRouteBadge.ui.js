import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HistoricalRouteBadgeView({
  copy,
  distance,
  duration,
  onClose,
  styles,
  theme,
}) {
  return (
    <View style={styles.badge}>
      <View style={styles.content}>
        <Ionicons name="time-outline" size={18} color={theme.colors.onPrimary} />
        <View style={styles.textGroup}>
          <Text numberOfLines={1} style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{distance} · {duration}</Text>
        </View>
      </View>
      <TouchableOpacity accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={20} color={theme.colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}
