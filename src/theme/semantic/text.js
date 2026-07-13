import { palette } from '../primitives/palette';

export const createTextColors = (isDark = true) => ({
  primary: isDark ? palette.neutral.gray100 : palette.neutral.slate900,
  secondary: isDark ? palette.neutral.gray300 : palette.neutral.gray700,
  tertiary: isDark ? palette.neutral.gray600 : palette.neutral.gray400,
  muted: isDark ? palette.neutral.gray300 : palette.neutral.gray700,
  inverse: isDark ? palette.neutral.slate900 : palette.neutral.gray100,
  dark: palette.neutral.slate900,
  mutedDark: palette.neutral.gray700,
});
