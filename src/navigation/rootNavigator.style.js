import { StyleSheet } from 'react-native';

export const createRootNavigatorStyles = (theme) =>
  StyleSheet.create({
    loading: {
      alignItems: 'center',
      backgroundColor: theme.colors.background.primary,
      flex: 1,
      justifyContent: 'center',
    },
  });

