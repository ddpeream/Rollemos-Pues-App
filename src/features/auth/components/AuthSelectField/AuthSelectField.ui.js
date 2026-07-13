import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AuthSelectFieldUI({
  label,
  onPress,
  selectedLabel,
  styles,
  theme,
}) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.selectButton} onPress={onPress}>
        <Text style={styles.selectButtonText}>{selectedLabel}</Text>
        <Ionicons name="chevron-down" size={20} color={theme.colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

