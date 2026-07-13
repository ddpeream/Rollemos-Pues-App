import { getDynamicColors } from './semantic/colors';
import { spacing } from './primitives/spacing';
import { sizes } from './primitives/sizes';
import { typography } from './primitives/typography';
import { borderRadius } from './primitives/radius';
import { shadows } from './primitives/shadows';
import { animations } from './animations';
import { trackingTokens } from './tracking';
import { mapStyles } from './mapStyles';
import { commonStyles } from './commonStyles';

export const createTheme = (isDark = true) => ({
  isDark,
  colors: getDynamicColors(isDark),
  spacing,
  sizes,
  typography,
  borderRadius,
  shadows,
  animations,
  tracking: trackingTokens,
  mapStyles,
  commonStyles,
});
