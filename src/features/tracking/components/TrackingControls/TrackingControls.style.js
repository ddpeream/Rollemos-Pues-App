import { StyleSheet } from 'react-native';

import { borderRadius, shadows, sizes, spacing, trackingTokens } from '../../../../theme';

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: trackingTokens.controls.paddingHorizontal,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    gap: spacing.md,
    borderWidth: sizes.borderWidth.thin,
    ...shadows.floating,
  },
  mainButton: {
    width: sizes.tracking.mainButton,
    height: sizes.tracking.mainButton,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: sizes.borderWidth.thin,
    ...shadows.medium,
  },
  mainButtonLarge: {
    width: sizes.tracking.mainButtonLarge,
    height: sizes.tracking.mainButtonLarge,
    borderRadius: borderRadius.round,
  },
  auxButton: {
    width: sizes.tracking.controlsButton,
    height: sizes.tracking.controlsButton,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: sizes.borderWidth.thin,
  },
  placeholderButton: {
    width: sizes.tracking.controlsButton,
    height: sizes.tracking.controlsButton,
  },
});
