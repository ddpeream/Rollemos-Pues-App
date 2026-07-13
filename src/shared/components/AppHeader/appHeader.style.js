import { StyleSheet } from 'react-native';

export const createStyles = (theme, { transparent = false } = {}) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      alignSelf: 'center',
      minHeight: 56,
      justifyContent: 'center',
      width: '90%',
    },
    safeArea: {
      backgroundColor: transparent
        ? 'transparent'
        : theme.colors.header.background,
      width: '100%',
    },
  });
