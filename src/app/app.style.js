import { StyleSheet } from 'react-native';

export const createStyles = (theme) =>
  StyleSheet.create({
    app: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    content: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
  });
