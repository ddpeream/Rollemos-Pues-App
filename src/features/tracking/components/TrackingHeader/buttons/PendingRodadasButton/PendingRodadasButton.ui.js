import React from 'react';
import { TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { sizes } from '../../../../../../theme';
import { styles } from './pendingRodadasButton.style';

export default function PendingRodadasButtonView({
  config,
  primaryColor,
  mutedButtonStyle,
  onPress,
  disabled,
}) {
  return (
    <TouchableOpacity
      accessibilityHint={config.description}
      accessibilityLabel={config.label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, mutedButtonStyle]}
    >
      <MaterialCommunityIcons
        name={config.icon}
        size={sizes.icon.xl}
        color={primaryColor}
      />
    </TouchableOpacity>
  );
}
