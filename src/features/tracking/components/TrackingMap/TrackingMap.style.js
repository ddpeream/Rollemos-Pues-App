import { StyleSheet } from 'react-native';

import { borderRadius, mapStyles, shadows, sizes } from '../../../../theme';

export const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  startFlagMarker: {
    width: sizes.tracking.headerButton,
    height: sizes.tracking.headerButton,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: sizes.borderWidth.thin,
    ...shadows.marker,
  },
  liveSkaterMarker: {
    width: sizes.tracking.headerButton - 6,
    height: sizes.tracking.headerButton - 6,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: sizes.borderWidth.thin,
    ...shadows.marker,
  },
});

export const darkMapStyle = mapStyles.dark;
