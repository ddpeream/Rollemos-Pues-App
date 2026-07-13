import { StyleSheet } from 'react-native';

import { borderRadius, shadows, sizes, spacing, trackingTokens, typography } from '../../../../theme';

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: trackingTokens.statsTop.top,
    left: spacing.base,
    right: spacing.base,
    borderRadius: borderRadius.lg,
    paddingVertical: trackingTokens.statsTop.paddingVertical,
    paddingHorizontal: trackingTokens.statsTop.paddingHorizontal,
    borderWidth: sizes.borderWidth.thin,
    ...shadows.floating,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  value: {
    fontSize: typography.fontSize.lg + 2,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.none,
  },
  label: {
    fontSize: typography.fontSize.xs - 1,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.xs / 2,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.none,
  },
  divider: {
    width: sizes.tracking.statsDividerWidth,
    height: sizes.tracking.statsDividerHeight,
    opacity: 0.3,
  },
});
