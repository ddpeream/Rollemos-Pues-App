import { StyleSheet } from 'react-native';

import { borderRadius, shadows, sizes, spacing, trackingTokens, typography } from '../../../../theme';

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: trackingTokens.statsSide.top,
    right: spacing.base,
    minWidth: sizes.tracking.statsSideMinWidth,
    borderRadius: borderRadius.lg - 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderWidth: sizes.borderWidth.thin,
    ...shadows.floating,
  },
  column: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.sm + spacing.xs / 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  value: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
});
