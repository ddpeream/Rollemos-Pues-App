import { StyleSheet } from 'react-native';

import { borderRadius, spacing, typography } from '../../../../../../theme';

export const createStyles = (theme) =>
  StyleSheet.create({
    avatarContainer: {
      alignItems: 'center',
      backgroundColor: theme.colors.background.surface,
      borderColor: theme.colors.glass.border,
      borderRadius: borderRadius.round,
      borderWidth: 2,
      gap: spacing.xs,
      height: 116,
      justifyContent: 'center',
      width: 116,
    },
    avatarPlaceholderText: {
      color: theme.colors.primary,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
  });

