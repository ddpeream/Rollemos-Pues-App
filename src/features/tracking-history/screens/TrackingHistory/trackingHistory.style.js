import { StyleSheet } from 'react-native';

import { borderRadius, spacing, typography } from '../../../../theme';

export const createStyles = (theme) => StyleSheet.create({
  backButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.background.surface,
    borderRadius: borderRadius.round,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  blockingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: theme.colors.glass.backdrop,
    justifyContent: 'center',
  },
  container: {
    backgroundColor: theme.colors.background.primary,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyHint: {
    color: theme.colors.text.secondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyTitle: {
    color: theme.colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  error: {
    color: theme.colors.error,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  listContent: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
  },
  loadingText: {
    color: theme.colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
});
