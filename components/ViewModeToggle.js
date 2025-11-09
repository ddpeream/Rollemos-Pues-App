import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../store/useAppStore';
import { spacing, borderRadius, typography } from '../theme';

/**
 * Componente de toggle para alternar entre vista de lista y mapa
 * Diseño inspirado en aplicaciones modernas como Airbnb
 */
export default function ViewModeToggle({ 
  mode = 'list', 
  onModeChange = null,
  style = null 
}) {
  const { theme } = useTheme();

  const handleToggle = (newMode) => {
    if (newMode !== mode) {
      onModeChange?.(newMode);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.xs,
      borderWidth: 1,
      borderColor: theme.colors.glass.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      ...style,
    },
    toggleButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      gap: spacing.xs,
    },
    activeButton: {
      backgroundColor: theme.colors.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 2,
    },
    inactiveButton: {
      backgroundColor: 'transparent',
    },
    activeText: {
      color: '#000',
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
    },
    inactiveText: {
      color: theme.colors.text.secondary,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          mode === 'list' ? styles.activeButton : styles.inactiveButton,
        ]}
        onPress={() => handleToggle('list')}
        activeOpacity={0.7}
      >
        <Ionicons
          name="list"
          size={16}
          color={mode === 'list' ? '#000' : theme.colors.text.secondary}
        />
        <Text
          style={mode === 'list' ? styles.activeText : styles.inactiveText}
        >
          Lista
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.toggleButton,
          mode === 'map' ? styles.activeButton : styles.inactiveButton,
        ]}
        onPress={() => handleToggle('map')}
        activeOpacity={0.7}
      >
        <Ionicons
          name="map"
          size={16}
          color={mode === 'map' ? '#000' : theme.colors.text.secondary}
        />
        <Text
          style={mode === 'map' ? styles.activeText : styles.inactiveText}
        >
          Mapa
        </Text>
      </TouchableOpacity>
    </View>
  );
}