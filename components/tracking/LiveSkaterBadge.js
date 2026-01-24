import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from '../../screens/tracking/tracking.style';
import { formatDistance } from '../../utils/tracking';

export default function LiveSkaterBadge({
  visible,
  skater,
  distanceMeters,
  getSkaterColor,
  onDismiss,
}) {
  if (!visible || !skater) return null;

  const speedKmh =
    skater.speed != null ? Math.max(0, skater.speed * 3.6) : null;

  return (
    <TouchableOpacity
      style={styles.rodadaBadgeOverlay}
      onPress={onDismiss}
      activeOpacity={1}
    >
      <TouchableOpacity
        style={[
          styles.rodadaBadge,
          { backgroundColor: getSkaterColor(skater) },
        ]}
        onPress={() => {}}
        activeOpacity={1}
      >
        <View style={styles.rodadaBadgeContent}>
          <MaterialCommunityIcons name="roller-skate" size={20} color="#FFFFFF" />
          <View style={styles.rodadaBadgeText}>
            <Text style={styles.rodadaBadgeTitle} numberOfLines={1}>
              {skater.usuario?.nombre || 'Patinador'}
            </Text>
            <Text style={styles.rodadaBadgeStats}>
              Distancia: {formatDistance(distanceMeters)}
            </Text>
            <Text style={styles.rodadaBadgeStats}>
              Velocidad: {speedKmh != null ? speedKmh.toFixed(1) : '--'} km/h
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onDismiss} style={styles.rodadaBadgeClose}>
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
