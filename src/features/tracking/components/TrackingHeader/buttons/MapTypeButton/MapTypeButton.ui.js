import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { sizes } from '../../../../../../theme';
import { styles } from './mapTypeButton.style';

export default function MapTypeButtonView({
  config,
  primaryColor,
  mutedButtonStyle,
  mapType,
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
      <Ionicons
        name={mapType === 'hybrid' ? config.alternateIcon : config.icon}
        size={sizes.icon.xl}
        color={primaryColor}
      />
    </TouchableOpacity>
  );
}
