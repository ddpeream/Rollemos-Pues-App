import { StyleSheet } from 'react-native';

import { spacing, typography } from '../../../../theme';

export const createStyles = (theme) =>
  StyleSheet.create({
    backButton: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.xs,
      justifyContent: 'center',
      marginTop: spacing.base,
      paddingVertical: spacing.sm,
    },
    backButtonText: {
      color: theme.colors.primary,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
    },
    keyboardView: {
      flex: 1,
    },
    safeArea: {
      backgroundColor: theme.colors.background.primary,
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.lg,
    },
  });
