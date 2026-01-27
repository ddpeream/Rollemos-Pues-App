/**
 * 🔧 PARCHE OPTIONS MENU - Menú contextual para parches
 * ====================================================
 * 
 * Menú de 3 puntos para gestionar parches individuales.
 * Diferentes opciones según si es el creador o no.
 * 
 * Features:
 * ✅ Editar/Eliminar (solo para creador)
 * ✅ Reportar/Compartir (para todos)
 * ✅ Animaciones fluidas
 * ✅ Detección de posición automática
 * ✅ Confirmaciones para acciones destructivas
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../store/useAppStore';
import { spacing, typography, borderRadius } from '../theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ParcheOptionsMenu({
  visible,
  onClose,
  parche,
  currentUser,
  onEdit,
  onDelete,
  onReport,
  onShare,
  buttonPosition = { x: 0, y: 0 }, // Posición del botón que abrió el menú
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [scaleAnim] = useState(new Animated.Value(0));
  const [opacityAnim] = useState(new Animated.Value(0));

  // Determinar si el usuario actual es el creador del parche
  const isOwner = useMemo(() => {
    return parche && currentUser && parche.created_by === currentUser.id;
  }, [parche, currentUser]);

  // Configurar opciones del menú según permisos
  const menuOptions = useMemo(() => {
    const options = [];

    if (isOwner) {
      options.push(
        {
          id: 'edit',
          icon: 'pencil',
          label: t('components.parcheOptionsMenu.edit'),
          color: theme.colors.primary,
          onPress: () => {
            onClose();
            onEdit?.(parche);
          }
        },
        {
          id: 'delete',
          icon: 'trash',
          label: t('components.parcheOptionsMenu.delete'),
          color: '#EF4444',
          onPress: () => {
            onClose();
            Alert.alert(
              t('components.parcheOptionsMenu.deleteTitle'),
              t('components.parcheOptionsMenu.deleteMessage', {
                name: parche?.nombre ?? '',
              }),
              [
                { text: t('common.cancel'), style: 'cancel' },
                { 
                  text: t('common.delete'), 
                  style: 'destructive',
                  onPress: () => onDelete?.(parche)
                }
              ]
            );
          }
        }
      );
    }

    // Opciones disponibles para todos
    options.push(
      {
        id: 'share',
        icon: 'share',
        label: t('components.parcheOptionsMenu.share'),
        color: theme.colors.text.primary,
        onPress: () => {
          onClose();
          onShare?.(parche);
        }
      }
    );

    // Solo mostrar reportar si no es el dueño
    if (!isOwner) {
      options.push({
        id: 'report',
        icon: 'flag',
        label: t('components.parcheOptionsMenu.report'),
        color: '#F59E0B',
        onPress: () => {
          onClose();
          Alert.alert(
            t('components.parcheOptionsMenu.reportTitle'),
            t('components.parcheOptionsMenu.reportPrompt'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              { 
                text: t('components.parcheOptionsMenu.reportReasonInappropriate'),
                onPress: () => onReport?.(parche, 'inappropriate')
              },
              { 
                text: t('components.parcheOptionsMenu.reportReasonFalseInfo'),
                onPress: () => onReport?.(parche, 'false_info')
              },
              { 
                text: t('components.parcheOptionsMenu.reportReasonSpam'),
                onPress: () => onReport?.(parche, 'spam')
              }
            ]
          );
        }
      });
    }

    return options;
  }, [isOwner, theme, parche, onClose, onEdit, onDelete, onShare, onReport, t]);

  // Calcular posición del menú
  const menuPosition = useMemo(() => {
    const menuWidth = 200;
    const menuHeight = menuOptions.length * 50 + 20; // Aproximado
    
    let x = buttonPosition.x - menuWidth + 30; // Offset para que se vea bien
    let y = buttonPosition.y + 30;

    // Ajustar si se sale de la pantalla
    if (x < 10) x = buttonPosition.x;
    if (x + menuWidth > screenWidth - 10) x = screenWidth - menuWidth - 10;
    if (y + menuHeight > screenHeight - 100) y = buttonPosition.y - menuHeight - 10;

    return { x, y };
  }, [buttonPosition, menuOptions.length]);

  // Animaciones
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const styles = useMemo(() => StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    menuContainer: {
      position: 'absolute',
      backgroundColor: theme.colors.background.primary,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.glass.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
      overflow: 'hidden',
      minWidth: 180,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.glass.border,
    },
    lastMenuItem: {
      borderBottomWidth: 0,
    },
    menuIcon: {
      width: 20,
      textAlign: 'center',
    },
    menuText: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.medium,
      flex: 1,
    },
    ownerBadge: {
      backgroundColor: theme.colors.alpha.primary15,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
      marginLeft: spacing.xs,
    },
    ownerBadgeText: {
      fontSize: typography.fontSize.xs,
      color: theme.colors.primary,
      fontWeight: typography.fontWeight.bold,
    },
  }), [theme]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop para cerrar */}
        <TouchableOpacity 
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        {/* Menú animado */}
        <Animated.View
          style={[
            styles.menuContainer,
            {
              left: menuPosition.x,
              top: menuPosition.y,
              transform: [
                { scale: scaleAnim },
                { translateY: scaleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 0],
                }) }
              ],
              opacity: opacityAnim,
            }
          ]}
        >
          {menuOptions.map((option, index) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.menuItem,
                index === menuOptions.length - 1 && styles.lastMenuItem
              ]}
              onPress={option.onPress}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={option.icon} 
                size={18} 
                color={option.color}
                style={styles.menuIcon}
              />
              <Text style={[styles.menuText, { color: option.color }]}>
                {option.label}
              </Text>
              
              {/* Mostrar badge si es el dueño */}
              {option.id === 'edit' && isOwner && (
                <View style={styles.ownerBadge}>
                  <Text style={styles.ownerBadgeText}>
                    {t('components.parcheOptionsMenu.ownerBadge')}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>
    </Modal>
  );
}
