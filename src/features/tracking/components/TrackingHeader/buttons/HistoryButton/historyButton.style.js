import { StyleSheet } from 'react-native';

import { borderRadius, sizes } from '../../../../../../theme';

export const styles = StyleSheet.create({
  button: {
    width: sizes.tracking.headerButton,
    height: sizes.tracking.headerButton,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
