import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AuthScreenIntroUI({
  iconName,
  styles,
  subtitle,
  theme,
  title,
}) {
  return (
    <View style={styles.headerSection}>
      <View style={styles.logoContainer}>
        <Ionicons name={iconName} size={24} color={theme.colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}
