/**
 * 🗂️ Card Component
 *
 * Componente de tarjeta reutilizable con efecto glass.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../store/useAppStore';
import { spacing, borderRadius } from '../../theme';

const Card = ({
  children,
  style = {},
  glass = false,
  padding = 'medium',
}) => {
  const { theme } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: glass ? theme.colors.glass.background : theme.colors.background.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.glass.border,
      padding: padding === 'small' ? spacing.sm : padding === 'large' ? spacing.lg : spacing.base,
      ...theme.shadows.card,
    },
  }), [theme, glass, padding]);

  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};

export default Card;
