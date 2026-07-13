import { StyleSheet } from 'react-native';

import { spacing, trackingTokens } from '../../../../theme';

export const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: trackingTokens.header.paddingTop,
    paddingBottom: trackingTokens.header.paddingBottom,
  },
});
