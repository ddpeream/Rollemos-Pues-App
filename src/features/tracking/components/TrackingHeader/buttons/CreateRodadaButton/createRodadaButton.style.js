import { StyleSheet } from 'react-native';

import { borderRadius, sizes, spacing } from '../../../../../../theme';

export const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    width: 'auto',
    height: sizes.tracking.headerButton,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryIcon: {
    marginLeft: spacing.xs / 2,
  },
});
