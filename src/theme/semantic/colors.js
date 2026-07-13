import { alpha, palette } from '../primitives/palette';
import { actionColors } from './actions';
import { createGlassColors } from './glass';
import { createSurfaces } from './surfaces';
import { createTextColors } from './text';
import { createTrackingColors } from './tracking';
import { stateColors } from './states';

export const colors = {
  primary: palette.brand.primary,
  secondary: palette.brand.secondary,
  onPrimary: actionColors.onPrimary,
  onSecondary: actionColors.onSecondary,
  background: {
    dark: palette.neutral.slate950,
    light: palette.neutral.slate100,
    surface: alpha.white06,
    surface2: alpha.white10,
    primary: palette.neutral.slate950,
  },
  text: {
    primary: palette.neutral.gray100,
    secondary: palette.neutral.gray300,
    muted: palette.neutral.gray300,
    dark: palette.neutral.slate900,
    mutedDark: palette.neutral.gray700,
  },
  glass: {
    background: alpha.white06,
    border: alpha.white08,
    backdrop: alpha.white10,
  },
  header: {
    toggleOffBackground: palette.neutral.gray300,
    toggleSunIcon: stateColors.warning,
    toggleThumbBackground: palette.neutral.white,
  },
  gradients: {
    primary: [palette.brand.primary, palette.brand.secondary],
    primaryAngle: 135,
    accent: ['rgba(77, 215, 208, 0.25)', 'transparent'],
    accentSecondary: ['rgba(210, 107, 255, 0.2)', 'transparent'],
  },
  success: stateColors.success,
  error: stateColors.error,
  warning: stateColors.warning,
  info: stateColors.info,
  tabs: {
    active: palette.brand.pink,
    inactive: palette.neutral.gray500,
  },
  alpha,
  card: alpha.white06,
  border: alpha.white08,
  primaryLight: alpha.primary15,
  textSecondary: palette.neutral.gray300,
};

export const getDynamicColors = (isDark = true) => ({
  ...colors,
  onPrimary: actionColors.onPrimary,
  onSecondary: actionColors.onSecondary,
  onError: actionColors.onError,
  onSuccess: actionColors.onSuccess,
  background: {
    ...colors.background,
    ...createSurfaces(isDark),
  },
  text: createTextColors(isDark),
  glass: createGlassColors(isDark),
  header: {
    ...colors.header,
    background: isDark ? colors.background.primary : palette.neutral.slate100,
    toggleOffBackground: isDark ? alpha.white18 : palette.neutral.gray300,
    toggleThumbBackground: isDark ? palette.neutral.white : palette.neutral.white,
  },
  card: isDark ? alpha.white06 : alpha.black03,
  border: isDark ? alpha.white08 : alpha.black10,
  tracking: createTrackingColors(isDark),
});
