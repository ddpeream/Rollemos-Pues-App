import { StyleSheet } from 'react-native';

import { spacing, typography } from '../../../../theme';

export const createStyles = (theme) =>
  StyleSheet.create({
    divider: {
      backgroundColor: theme.colors.glass.border,
      flex: 1,
      height: 1,
    },
    dividerContainer: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.xs,
      marginVertical: spacing.base,
    },
    dividerText: {
      color: theme.colors.text.secondary,
      fontSize: typography.fontSize.xs,
    },
    footerLink: {
      color: theme.colors.primary,
      fontWeight: typography.fontWeight.semibold,
    },
    footerText: {
      color: theme.colors.text.secondary,
      fontSize: typography.fontSize.xs,
      marginTop: spacing.sm,
      textAlign: 'center',
    },
    headerSection: {
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    safeArea: {
      backgroundColor: theme.colors.background.primary,
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.lg,
    },
  });
