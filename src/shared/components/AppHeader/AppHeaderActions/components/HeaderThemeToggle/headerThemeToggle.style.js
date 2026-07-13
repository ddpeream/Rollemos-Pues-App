import { StyleSheet } from 'react-native';

export const createStyles = (theme) =>
  StyleSheet.create({
    toggleCircle: {
      alignItems: 'center',
      backgroundColor: theme.colors.header.toggleThumbBackground,
      borderRadius: 12,
      height: 24,
      justifyContent: 'center',
      ...theme.shadows.small,
      width: 24,
    },
    toggleContainer: {
      borderRadius: 14,
      height: 28,
      justifyContent: 'center',
      padding: 2,
      width: 52,
    },
  });
