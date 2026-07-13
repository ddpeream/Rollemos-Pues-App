import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

export default function HeaderLanguageButtonUI({ flag, onPress, styles }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.button}>
      <Text style={styles.flagText}>{flag}</Text>
    </TouchableOpacity>
  );
}
