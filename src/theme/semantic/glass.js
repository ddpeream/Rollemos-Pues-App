import { alpha } from '../primitives/palette';

export const createGlassColors = (isDark = true) => ({
  background: isDark ? alpha.white06 : alpha.black03,
  border: isDark ? alpha.white08 : alpha.black05,
  backdrop: isDark ? alpha.white10 : alpha.black08,
});
