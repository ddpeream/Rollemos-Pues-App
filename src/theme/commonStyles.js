import { StyleSheet } from 'react-native';

import { colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';
import { borderRadius } from './radius';
import { shadows } from './shadows';

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  containerLight: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.dark,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.lg,
  },
  card: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.glass.border,
    ...shadows.card,
  },
  cardGlass: {
    backgroundColor: colors.glass.background,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.glass.border,
    ...shadows.card,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.surface2,
    paddingVertical: 10,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: spacing.sm,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.alpha.white20,
    paddingVertical: 10,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
  },
  textPrimary: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    fontFamily: typography.fontFamily.body,
  },
  textSecondary: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
  },
  textMuted: {
    color: colors.text.muted,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
