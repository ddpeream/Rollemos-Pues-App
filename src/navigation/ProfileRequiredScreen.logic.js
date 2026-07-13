import React, { useMemo } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { useAuthStore } from '../features/auth';
import { useTheme } from '../hooks/useTheme';
import { createProfileRequiredStyles } from './profileRequiredScreen.style';

export default function ProfileRequiredScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createProfileRequiredStyles(theme), [theme]);
  const isAuthLoading = useAuthStore((state) => state.isAuthLoading);
  const logout = useAuthStore((state) => state.logout);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil no disponible</Text>
      <Text style={styles.description}>
        Tu sesion esta activa, pero no encontramos tu perfil de usuario.
      </Text>
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={isAuthLoading}
        onPress={logout}
        style={[styles.button, isAuthLoading && styles.buttonDisabled]}
      >
        {isAuthLoading ? (
          <ActivityIndicator color={theme.colors.onPrimary} />
        ) : (
          <Text style={styles.buttonText}>Volver al login</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

