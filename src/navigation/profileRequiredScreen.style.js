import { StyleSheet } from 'react-native';

import { borderRadius, spacing, typography } from '../theme';

export const createProfileRequiredStyles = (theme) =>
  StyleSheet.create({
    button: {
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: borderRadius.md,
      height: 46,
      justifyContent: 'center',
      marginTop: spacing.lg,
      minWidth: 180,
      paddingHorizontal: spacing.lg,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      color: theme.colors.onPrimary,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
    },
    container: {
      alignItems: 'center',
      backgroundColor: theme.colors.background.primary,
      flex: 1,
      justifyContent: 'center',
      padding: spacing.lg,
    },
    description: {
      color: theme.colors.text.secondary,
      fontSize: typography.fontSize.sm,
      lineHeight: 20,
      marginTop: spacing.sm,
      textAlign: 'center',
    },
    title: {
      color: theme.colors.text.primary,
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      textAlign: 'center',
    },
  });

