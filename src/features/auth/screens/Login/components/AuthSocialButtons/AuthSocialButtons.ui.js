import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AuthSocialButtonsUI({ styles, theme }) {
  return (
    <View style={styles.socialButtonsContainer}>
      <TouchableOpacity style={styles.socialButton} disabled>
        <Ionicons name="logo-google" size={16} color="#DB4437" />
        <Text style={styles.socialButtonText}>Google</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.socialButton} disabled>
        <Ionicons name="logo-apple" size={16} color={theme.colors.text.primary} />
        <Text style={styles.socialButtonText}>Apple</Text>
      </TouchableOpacity>
    </View>
  );
}

