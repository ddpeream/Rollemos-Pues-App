import { StyleSheet } from 'react-native';

export const createStyles = (theme) =>
  StyleSheet.create({
    activeLabel: {
      fontWeight: '700',
    },
    flag: {
      fontSize: theme.typography.fontSize.lg,
      width: 28,
    },
    item: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
      minWidth: 148,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    label: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.fontSize.md,
    },
    menu: {
      backgroundColor: theme.colors.background.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      elevation: theme.shadows.floating.elevation,
      paddingVertical: theme.spacing.xs,
      position: 'absolute',
      right: theme.spacing.xl,
      shadowColor: theme.shadows.floating.shadowColor,
      shadowOffset: theme.shadows.floating.shadowOffset,
      shadowOpacity: theme.shadows.floating.shadowOpacity,
      shadowRadius: theme.shadows.floating.shadowRadius,
      top: 112,
    },
    overlay: {
      backgroundColor: 'transparent',
      flex: 1,
    },
  });
