import { StyleSheet } from 'react-native';

export const createStyles = (theme) =>
  StyleSheet.create({
    disabledItem: {
      opacity: 0.55,
    },
    disabledLabel: {
      color: theme.colors.text.secondary,
    },
    item: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
      minWidth: 176,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    label: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.fontSize.sm,
    },
    logoutLabel: {
      color: theme.colors.error,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    menu: {
      backgroundColor: theme.colors.background.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      elevation: theme.shadows.floating.elevation,
      paddingVertical: theme.spacing.xs,
      position: 'absolute',
      right: theme.spacing.md,
      shadowColor: theme.shadows.floating.shadowColor,
      shadowOffset: theme.shadows.floating.shadowOffset,
      shadowOpacity: theme.shadows.floating.shadowOpacity,
      shadowRadius: theme.shadows.floating.shadowRadius,
      top: 88,
    },
    overlay: {
      backgroundColor: 'transparent',
      flex: 1,
    },
    separator: {
      backgroundColor: theme.colors.border,
      height: 1,
      marginVertical: theme.spacing.xs,
    },
  });
