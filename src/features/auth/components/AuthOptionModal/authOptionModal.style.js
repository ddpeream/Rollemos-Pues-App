import { StyleSheet } from 'react-native';

import { borderRadius, spacing, typography } from '../../../../theme';

export const createStyles = (theme) =>
  StyleSheet.create({
    modalContent: {
      backgroundColor: theme.colors.background.primary,
      borderTopLeftRadius: borderRadius.lg,
      borderTopRightRadius: borderRadius.lg,
      maxHeight: '60%',
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.base,
      paddingTop: spacing.base,
    },
    modalHeader: {
      color: theme.colors.text.primary,
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.bold,
      marginBottom: spacing.base,
      textAlign: 'center',
    },
    modalOverlay: {
      backgroundColor: theme.colors.alpha.black50,
      flex: 1,
      justifyContent: 'flex-end',
    },
    optionItem: {
      backgroundColor: theme.colors.background.surface,
      borderColor: theme.colors.glass.border,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm,
    },
    optionItemSelected: {
      backgroundColor: theme.colors.alpha.primary15,
      borderColor: theme.colors.primary,
    },
    optionText: {
      color: theme.colors.text.primary,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
    },
    optionTextSelected: {
      color: theme.colors.primary,
      fontWeight: typography.fontWeight.semibold,
    },
  });

