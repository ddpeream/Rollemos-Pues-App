import { StyleSheet } from 'react-native';

export const createStyles = (theme) =>
  StyleSheet.create({
    button: {
      alignItems: 'center',
      backgroundColor: theme.colors.glass.background,
      borderRadius: 20,
      justifyContent: 'center',
      minWidth: 40,
      padding: 8,
    },
    flagText: {
      fontSize: 24,
    },
  });
