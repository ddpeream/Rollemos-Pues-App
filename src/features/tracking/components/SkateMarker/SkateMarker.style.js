import { StyleSheet } from 'react-native';

import { borderRadius, colors, shadows, sizes } from '../../../../theme';

export const styles = StyleSheet.create({
  marker: {
    width: sizes.tracking.marker,
    height: sizes.tracking.marker,
    borderRadius: borderRadius.xl - 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: sizes.borderWidth.marker,
    borderColor: colors.onSecondary,
    ...shadows.marker,
  },
});
