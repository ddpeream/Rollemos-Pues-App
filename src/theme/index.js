import { colors, getDynamicColors } from './colors';
import { spacing } from './spacing';
import { sizes } from './sizes';
import { typography } from './typography';
import { borderRadius } from './radius';
import { shadows } from './shadows';
import { animations } from './animations';
import { trackingTokens } from './tracking';
import { mapStyles } from './mapStyles';
import { commonStyles } from './commonStyles';
import { createTheme } from './createTheme';

export { colors } from './colors';
export { palette, alpha } from './primitives/palette';
export { actionColors } from './semantic/actions';
export { createGlassColors } from './semantic/glass';
export { stateColors } from './semantic/states';
export { createSurfaces } from './semantic/surfaces';
export { createTextColors } from './semantic/text';
export { createTrackingColors } from './semantic/tracking';
export { spacing } from './spacing';
export { sizes } from './sizes';
export { typography } from './typography';
export { borderRadius } from './radius';
export { shadows } from './shadows';
export { animations } from './animations';
export { trackingTokens } from './tracking';
export { mapStyles } from './mapStyles';
export { commonStyles } from './commonStyles';
export { createTheme } from './createTheme';

export const theme = {
  colors,
  spacing,
  sizes,
  typography,
  borderRadius,
  shadows,
  animations,
  tracking: trackingTokens,
  mapStyles,
  commonStyles,
};

export const getTheme = createTheme;

export default theme;
