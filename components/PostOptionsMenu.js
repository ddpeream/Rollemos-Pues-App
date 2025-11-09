/**
 * MENÚ CONTEXTUAL DE OPCIONES
 * Componente para editar/eliminar posts (solo posts propios)
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../store/useAppStore';
import { spacing, borderRadius } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PostOptionsMenu = ({ 
  visible, 
  onClose, 
  onEdit, 
  onDelete,
  buttonPosition,
  isOwnPost = false 
}) => {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const menuOptions = [
    {
      id: 'edit',
      title: 'Editar post',
      icon: 'create-outline',
      action: onEdit,
      show: isOwnPost,
      color: theme.colors.text.primary,
    },
    {
      id: 'delete',
      title: 'Eliminar post',
      icon: 'trash-outline',
      action: onDelete,
      show: isOwnPost,
      color: '#FF4444',
    },
    {
      id: 'report',
      title: 'Reportar',
      icon: 'flag-outline',
      action: () => {
        onClose();
        // TODO: Implementar reporte
      },
      show: !isOwnPost,
      color: '#FF4444',
    },
    {
      id: 'share',
      title: 'Compartir',
      icon: 'share-outline',
      action: () => {
        onClose();
        // TODO: Implementar compartir
      },
      show: true,
      color: theme.colors.text.primary,
    },
  ];

  const visibleOptions = menuOptions.filter(option => option.show);

  // Calcular posición del menú
  const menuStyle = {
    position: 'absolute',
    top: (buttonPosition?.y || 0) + 40,
    right: SCREEN_WIDTH - (buttonPosition?.x || SCREEN_WIDTH - 20),
    minWidth: 160,
    maxWidth: 200,
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <Animated.View
            style={[
              styles.menuContainer,
              {
                backgroundColor: theme.colors.background.surface,
                borderColor: theme.colors.glass.border,
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
              menuStyle,
            ]}
          >
            {visibleOptions.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.menuItem,
                  { borderBottomColor: theme.colors.glass.border },
                  index === visibleOptions.length - 1 && styles.lastMenuItem,
                ]}
                onPress={option.action}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={option.icon} 
                  size={20} 
                  color={option.color}
                />
                <Text style={[styles.menuText, { color: option.color }]}>
                  {option.title}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

/**
 * BOTÓN DE OPCIONES (3 PUNTOS)
 * Se integra en el header de cada post
 */
export const OptionsButton = ({ onPress, style, color }) => {
  return (
    <TouchableOpacity
      style={[styles.optionsButton, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons 
        name="ellipsis-vertical" 
        size={20} 
        color={color || '#fff'} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuContainer: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    gap: 12,
    minHeight: 44,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  optionsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
  },
});

export default PostOptionsMenu;