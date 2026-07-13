import { StyleSheet } from 'react-native';

import { borderRadius, spacing, typography } from '../../../../theme';

export const createStyles = (theme) =>
  StyleSheet.create({
    disabledButton: {
      opacity: 0.7,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: borderRadius.md,
      height: 46,
      justifyContent: 'center',
      marginTop: spacing.sm,
    },
    primaryButtonText: {
      color: theme.colors.onPrimary,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
    },
  });

