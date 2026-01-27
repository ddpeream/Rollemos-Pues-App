/**
 * ⏳ LoadingSpinner Component
 *
 * Componente de loading reutilizable.
 */

import React, { useMemo } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../store/useAppStore';
import { spacing, typography } from '../../theme';

const LoadingSpinner = ({
  message,
  size = 'large',
  fullScreen = false,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const resolvedMessage = message === undefined ? t('common.loading') : message;

  const styles = useMemo(() => StyleSheet.create({
    container: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
      ...(fullScreen && {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
      }),
    },
    text: {
      marginTop: spacing.md,
      fontSize: typography.fontSize.md,
      color: theme.colors.text.secondary,
    },
  }), [theme, fullScreen]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={theme.colors.primary} />
      {resolvedMessage && <Text style={styles.text}>{resolvedMessage}</Text>}
    </View>
  );
};

export default LoadingSpinner;
