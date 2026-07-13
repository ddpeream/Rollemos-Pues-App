import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HeaderUserMenuButtonUI({ onPress, styles, theme }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.button}>
      <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.text.primary} />
    </TouchableOpacity>
  );
}
