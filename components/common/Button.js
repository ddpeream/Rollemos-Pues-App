/**
 * 🔘 Button Component
 *
 * Componente de botón reutilizable con diferentes variantes.
 */

import React, { useMemo } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/useAppStore';
import { spacing, typography, borderRadius } from '../../theme';

const Button = ({
  children,
  onPress,
  variant = 'primary', // 'primary', 'secondary', 'ghost', 'danger'
  size = 'medium', // 'small', 'medium', 'large'
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  style = {},
  textStyle = {},
  fullWidth = false,
}) => {
  const { theme } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.md,
      paddingVertical: size === 'small' ? spacing.xs : size === 'large' ? spacing.md : spacing.sm,
      paddingHorizontal: size === 'small' ? spacing.sm : size === 'large' ? spacing.xl : spacing.base,
      gap: spacing.sm,
      width: fullWidth ? '100%' : 'auto',
      ...(variant === 'primary' && {
        backgroundColor: theme.colors.primary,
      }),
      ...(variant === 'secondary' && {
        backgroundColor: theme.colors.background.surface,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
      }),
      ...(variant === 'ghost' && {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.alpha.primary15,
      }),
      ...(variant === 'danger' && {
        backgroundColor: '#EF4444',
      }),
      ...(disabled && {
        opacity: 0.5,
      }),
    },
    text: {
      fontSize: size === 'small' ? typography.fontSize.sm : size === 'large' ? typography.fontSize.md : typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
      ...(variant === 'primary' && {
        color: '#000',
      }),
      ...(variant === 'secondary' && {
        color: theme.colors.text.primary,
      }),
      ...(variant === 'ghost' && {
        color: theme.colors.primary,
      }),
      ...(variant === 'danger' && {
        color: '#fff',
      }),
    },
  }), [theme, variant, size, disabled, fullWidth]);

  const iconColor = variant === 'primary' || variant === 'danger' ? '#fff' : theme.colors.primary;
  const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#fff' : theme.colors.primary}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={iconSize} color={iconColor} />
          )}
          <Text style={[styles.text, textStyle]}>{children}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={iconSize} color={iconColor} />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;
