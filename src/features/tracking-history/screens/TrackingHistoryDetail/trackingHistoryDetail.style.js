import { StyleSheet } from 'react-native';

import { borderRadius, spacing, typography } from '../../../../theme';

export const createStyles = (theme) => StyleSheet.create({
  backButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.background.surface,
    borderRadius: borderRadius.round,
    height: 42,
    justifyContent: 'center',
    marginTop: spacing.md,
    width: 42,
  },
  container: {
    backgroundColor: theme.colors.background.primary,
    flex: 1,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  floatingBackButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.tracking.panelBackground,
    borderColor: theme.colors.tracking.panelBorder,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    left: spacing.md,
    minHeight: 42,
    paddingHorizontal: spacing.md,
    position: 'absolute',
    top: 76,
  },
  floatingBackText: {
    color: theme.colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  stateOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  stateText: {
    color: theme.colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
