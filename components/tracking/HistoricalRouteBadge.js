import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../screens/tracking/tracking.style';

export default function HistoricalRouteBadge({ historicalRoute, isDark, onClose }) {
  if (!historicalRoute) return null;

  return (
    <View
      style={[
        styles.historicalBadge,
        {
          backgroundColor: isDark
            ? 'rgba(136, 136, 136, 0.95)'
            : 'rgba(100, 100, 100, 0.95)',
        },
      ]}
    >
      <View style={styles.historicalBadgeContent}>
        <Ionicons name="time-outline" size={18} color="#FFFFFF" />
        <View style={styles.historicalBadgeText}>
          <Text style={styles.historicalBadgeTitle} numberOfLines={1}>
            {historicalRoute.name || 'Ruta guardada'}
          </Text>
          <Text style={styles.historicalBadgeStats}>
            {(historicalRoute.distance / 1000).toFixed(1)} km •{' '}
            {Math.floor(historicalRoute.duration / 60)} min
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.historicalBadgeClose}>
        <Ionicons name="close" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}
