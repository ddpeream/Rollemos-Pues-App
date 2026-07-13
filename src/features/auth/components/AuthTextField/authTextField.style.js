import { StyleSheet } from 'react-native';

import { borderRadius, spacing, typography } from '../../../../theme';

export const createStyles = (theme) =>
  StyleSheet.create({
    input: {
      backgroundColor: theme.colors.background.surface,
      borderColor: theme.colors.glass.border,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      color: theme.colors.text.primary,
      fontSize: typography.fontSize.sm,
      minHeight: 44,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.xs,
    },
    inputContainer: {
      position: 'relative',
    },
    label: {
      color: theme.colors.text.primary,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
      marginBottom: spacing.xs,
    },
    multilineInput: {
      minHeight: 74,
      textAlignVertical: 'top',
    },
  });

