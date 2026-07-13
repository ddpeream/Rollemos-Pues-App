import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

export default function AuthPrimaryButtonUI({
  disabled,
  isLoading,
  onPress,
  styles,
  theme,
  title,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled || isLoading}
      onPress={onPress}
      style={[styles.primaryButton, (disabled || isLoading) && styles.disabledButton]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={theme.colors.onPrimary} />
      ) : (
        <Text style={styles.primaryButtonText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

