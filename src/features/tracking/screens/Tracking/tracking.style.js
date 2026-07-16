import { StyleSheet } from 'react-native';

import { borderRadius, spacing, typography } from '../../../../theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userLabel: {
    position: 'absolute',
    left: spacing.base,
    bottom: 110,
    zIndex: 100,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    overflow: 'hidden',
  },
});
