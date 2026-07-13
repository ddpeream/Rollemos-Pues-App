import { alpha, palette } from '../primitives/palette';

export const createSurfaces = (isDark = true) => ({
  primary: isDark ? palette.neutral.slate950 : palette.neutral.slate100,
  secondary: isDark ? palette.neutral.blueGray900 : palette.neutral.white,
  tertiary: isDark ? palette.neutral.blueGray800 : '#F0F2F5',
  surface: isDark ? alpha.white06 : alpha.black03,
  surface2: isDark ? alpha.white10 : alpha.black05,
  overlay: isDark ? alpha.appHeaderDark : alpha.white90,
});
