import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HeaderThemeToggleUI({ isDark, onPress, styles, theme }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={!onPress}
      onPress={onPress}
      style={[
        styles.toggleContainer,
        {
          backgroundColor: isDark
            ? theme.colors.primary
            : theme.colors.header.toggleOffBackground,
        },
      ]}
    >
      <View
        style={[
          styles.toggleCircle,
          { transform: [{ translateX: isDark ? 26 : 2 }] },
        ]}
      >
        <Ionicons
          name={isDark ? 'moon' : 'sunny'}
          size={16}
          color={isDark ? theme.colors.primary : theme.colors.header.toggleSunIcon}
        />
      </View>
    </TouchableOpacity>
  );
}
