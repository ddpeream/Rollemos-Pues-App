import { StyleSheet } from 'react-native';

import { borderRadius, spacing, typography } from '../../../../theme';

export const createStyles = (theme) =>
  StyleSheet.create({
    headerSection: {
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    logoContainer: {
      alignItems: 'center',
      backgroundColor: theme.colors.alpha.primary15,
      borderRadius: borderRadius.round,
      height: 48,
      justifyContent: 'center',
      marginBottom: spacing.sm,
      width: 48,
    },
    subtitle: {
      color: theme.colors.text.secondary,
      fontSize: typography.fontSize.sm,
      lineHeight: 20,
      textAlign: 'center',
    },
    title: {
      color: theme.colors.text.primary,
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
  });
