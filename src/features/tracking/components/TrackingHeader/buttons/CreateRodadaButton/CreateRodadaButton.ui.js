import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { sizes } from '../../../../../../theme';
import { styles } from './createRodadaButton.style';

export default function CreateRodadaButtonView({
  config,
  primaryColor,
  onPrimaryColor,
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
      style={[styles.button, { backgroundColor: primaryColor }]}
    >
      <Ionicons
        name={config.primaryIcon}
        size={sizes.icon.lg}
        color={onPrimaryColor}
      />
      <MaterialCommunityIcons
        name={config.secondaryIcon}
        size={sizes.icon.sm}
        color={onPrimaryColor}
        style={styles.secondaryIcon}
      />
    </TouchableOpacity>
  );
}
