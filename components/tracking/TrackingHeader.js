import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from '../../screens/tracking/tracking.style';

export default function TrackingHeader({
  isDark,
  theme,
  showRodadasList,
  showRodadasOnMap,
  mapType,
  onNavigateRoutesHistory,
  onToggleRodadasList,
  onOpenCreateRodada,
  onToggleMapType,
  onToggleRodadasVisibility,
}) {
  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: isDark
            ? 'rgba(11, 15, 20, 0.85)'
            : 'rgba(255, 255, 255, 0.9)',
        },
      ]}
    >
      <TouchableOpacity
        onPress={onNavigateRoutesHistory}
        style={[
          styles.headerButton,
          {
            backgroundColor: isDark
              ? 'rgba(255,255,255,0.1)'
              : 'rgba(0,0,0,0.08)',
          },
        ]}
      >
        <Ionicons name="list-outline" size={24} color={theme.colors.primary} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onToggleRodadasList}
        style={[
          styles.headerButton,
          {
            backgroundColor: showRodadasList
              ? theme.colors.primary
              : isDark
              ? 'rgba(255,255,255,0.1)'
              : 'rgba(0,0,0,0.08)',
          },
        ]}
      >
        <MaterialCommunityIcons
          name="calendar-clock"
          size={24}
          color={showRodadasList ? '#FFFFFF' : theme.colors.primary}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onOpenCreateRodada}
        style={[
          styles.headerButton,
          styles.createRodadaButton,
          { backgroundColor: theme.colors.primary },
        ]}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <MaterialCommunityIcons
          name="account-group"
          size={16}
          color="#FFFFFF"
          style={{ marginLeft: 2 }}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onToggleMapType}
        style={[
          styles.headerButton,
          {
            backgroundColor: isDark
              ? 'rgba(255,255,255,0.1)'
              : 'rgba(0,0,0,0.08)',
          },
        ]}
      >
        <Ionicons
          name={mapType === 'hybrid' ? 'map-outline' : 'earth-outline'}
          size={24}
          color={theme.colors.primary}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onToggleRodadasVisibility}
        style={[
          styles.headerButton,
          {
            backgroundColor: showRodadasOnMap
              ? theme.colors.primary
              : isDark
              ? 'rgba(255,255,255,0.1)'
              : 'rgba(0,0,0,0.08)',
          },
        ]}
      >
        <Ionicons
          name={showRodadasOnMap ? 'eye' : 'eye-off'}
          size={24}
          color={showRodadasOnMap ? '#FFFFFF' : theme.colors.primary}
        />
      </TouchableOpacity>

    </View>
  );
}
