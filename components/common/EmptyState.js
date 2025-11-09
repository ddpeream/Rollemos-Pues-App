/**
 * 📭 EmptyState Component
 *
 * Componente para mostrar estado vacío.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/useAppStore';
import { spacing, typography } from '../../theme';
import Button from './Button';

const EmptyState = ({
  icon = 'folder-open-outline',
  title = 'No hay datos',
  message = 'No se encontraron elementos',
  actionLabel = null,
  onAction = null,
}) => {
  const { theme } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    iconContainer: {
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.text.primary,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    message: {
      fontSize: typography.fontSize.md,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
      lineHeight: 22,
    },
  }), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={64} color={theme.colors.text.secondary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <Button onPress={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </View>
  );
};

export default EmptyState;
