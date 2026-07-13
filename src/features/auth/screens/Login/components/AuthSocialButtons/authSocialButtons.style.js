import { StyleSheet } from 'react-native';

import { borderRadius, spacing, typography } from '../../../../../../theme';

export const createStyles = (theme) =>
  StyleSheet.create({
    socialButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.background.surface,
      borderColor: theme.colors.glass.border,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      flexDirection: 'row',
      gap: spacing.xs,
      height: 42,
      justifyContent: 'center',
      opacity: 0.55,
    },
    socialButtonsContainer: {
      gap: spacing.xs,
    },
    socialButtonText: {
      color: theme.colors.text.primary,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
    },
  });

