import { StyleSheet } from 'react-native';

import { borderRadius, spacing, typography } from '../../../../theme';

export const createStyles = (theme) =>
  StyleSheet.create({
    inputContainer: {
      position: 'relative',
    },
    label: {
      color: theme.colors.text.primary,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
      marginBottom: spacing.xs,
    },
    selectButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.background.surface,
      borderColor: theme.colors.glass.border,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 44,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.xs,
    },
    selectButtonText: {
      color: theme.colors.text.primary,
      flex: 1,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
    },
  });

