import { StyleSheet } from 'react-native';

import { borderRadius, shadows, spacing, typography } from '../../../../theme';

export const createStyles = (theme) => StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: theme.colors.tracking.panelBackground,
    borderColor: theme.colors.tracking.panelBorder,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    left: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    ...shadows.floating,
  },
  closeButton: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  subtitle: {
    color: theme.colors.tracking.statsTextSecondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  textGroup: {
    flex: 1,
  },
  title: {
    color: theme.colors.tracking.statsTextPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
});
