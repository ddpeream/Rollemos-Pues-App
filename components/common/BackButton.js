/**
 * COMPONENTE BACK BUTTON
 * Botón de navegación para volver atrás con diseño consistente
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/useAppStore';
import { spacing, typography, borderRadius } from '../../theme';

const BackButton = ({ 
  title = null,
  onPress = null,
  showTitle = true,
  style = {},
}) => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Calcular padding top seguro para iOS y Android
  const safeTop = Platform.select({
    ios: insets.top > 0 ? insets.top : 44,
    android: StatusBar.currentHeight || 24,
  });

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: safeTop + spacing.sm }, style]}>
      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.button,
          { backgroundColor: theme.colors.glass.background }
        ]}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons 
          name="arrow-back" 
          size={22} 
          color={theme.colors.text.primary} 
        />
        {showTitle && title && (
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {title}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});

export default BackButton;
