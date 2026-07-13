import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SignupAvatarFieldUI({ label, styles, theme }) {
  return (
    <View style={styles.avatarSection}>
      <View style={styles.avatarContainer}>
        <Ionicons name="camera" size={38} color={theme.colors.primary} />
        <Text style={styles.avatarPlaceholderText}>{label}</Text>
      </View>
    </View>
  );
}
