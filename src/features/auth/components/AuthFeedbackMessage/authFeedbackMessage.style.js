import { StyleSheet } from 'react-native';

import { typography } from '../../../../theme';

export const createStyles = (theme) =>
  StyleSheet.create({
    errorText: {
      color: theme.colors.error,
      fontSize: typography.fontSize.sm,
      lineHeight: 18,
    },
    successText: {
      color: theme.colors.success,
      fontSize: typography.fontSize.sm,
      lineHeight: 18,
    },
  });

