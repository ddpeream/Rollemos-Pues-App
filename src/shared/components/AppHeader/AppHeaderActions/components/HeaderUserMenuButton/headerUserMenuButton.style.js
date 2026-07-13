import { StyleSheet } from 'react-native';

import { borderRadius } from '../../../../../../theme';

export const createStyles = (theme) =>
  StyleSheet.create({
    button: {
      alignItems: 'center',
      backgroundColor: theme.colors.glass.background,
      borderColor: theme.colors.glass.border,
      borderRadius: borderRadius.round,
      borderWidth: 1,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
  });

