import { alpha, palette } from '../primitives/palette';

export const createTrackingColors = (isDark = true) => ({
  panelBackground: isDark ? alpha.trackingPanelDark : alpha.white75,
  panelBorder: isDark ? alpha.white08 : alpha.black08,
  headerBackground: isDark ? alpha.appHeaderDark : alpha.white90,
  controlBackground: isDark ? alpha.trackingControlsDark : alpha.white90,
  mutedControlBackground: isDark ? alpha.white10 : alpha.black08,
  auxiliaryControlBackground: isDark ? alpha.white08 : alpha.white80,
  controlBorder: isDark ? alpha.white12 : alpha.slate12,
  primaryControlBorder: isDark ? alpha.white18 : alpha.slate12,
  auxiliaryControlBorder: isDark ? alpha.white20 : alpha.slate12,
  statsTextPrimary: isDark ? palette.tracking.statsPrimaryDark : palette.tracking.statsPrimaryLight,
  statsTextSecondary: isDark ? palette.tracking.statsSecondaryDark : palette.tracking.statsSecondaryLight,
});
