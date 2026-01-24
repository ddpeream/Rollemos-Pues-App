import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../screens/tracking/tracking.style';

export default function TrackingErrorBanner({ error, isDark, theme, onRetry }) {
  if (!error) return null;

  return (
    <View
      style={[
        styles.errorContainer,
        {
          backgroundColor: isDark
            ? 'rgba(11, 15, 20, 0.9)'
            : 'rgba(255, 255, 255, 0.95)',
        },
      ]}
    >
      <Ionicons name="alert-circle" size={20} color="#FF3B30" />
      <Text style={[styles.errorText, { color: theme.colors.text.primary }]}>
        {error}
      </Text>
      <TouchableOpacity onPress={onRetry} style={{ paddingLeft: 12 }}>
        <Ionicons name="refresh" size={18} color={theme.colors.primary} />
      </TouchableOpacity>
    </View>
  );
}
