import { Platform } from 'react-native';

export const typography = {
  fontFamily: {
    body: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
    heading: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    md: 18,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 40,
    display: 48,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  lineHeight: {
    tight: 1.1,
    normal: 1.2,
    relaxed: 1.5,
    loose: 1.8,
  },
  letterSpacing: {
    none: 0,
  },
};
