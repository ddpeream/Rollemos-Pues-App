/**
 * MODAL DE CONFIRMACIÓN PARA ELIMINAR
 * Componente elegante con animaciones para confirmar eliminación
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../store/useAppStore';
import { spacing, typography, borderRadius } from '../theme';

const DeleteConfirmModal = ({
  visible,
  onClose,
  onConfirm,
  loading = false,
  post = null,
}) => {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const iconScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animación de entrada
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(iconScale, {
          toValue: 1,
          tension: 150,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animaciones
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.colors.background.surface,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Icono de Advertencia */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ scale: iconScale }],
              },
            ]}
          >
            <View style={styles.iconBackground}>
              <Ionicons name="warning" size={32} color="#FF4444" />
            </View>
          </Animated.View>

          {/* Título */}
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Eliminar post
          </Text>

          {/* Descripción */}
          <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
            ¿Estás seguro que quieres eliminar este post? Esta acción no se puede deshacer.
          </Text>

          {/* Preview del Post (opcional) */}
          {post && (
            <View style={[styles.postPreview, { backgroundColor: theme.colors.background.primary }]}>
              <Image 
                source={{ uri: post.imagen }} 
                style={styles.previewImage}
              />
              <View style={styles.previewContent}>
                <Text 
                  style={[styles.previewText, { color: theme.colors.text.primary }]}
                  numberOfLines={2}
                >
                  {post.descripcion || 'Sin descripción'}
                </Text>
                <View style={styles.previewStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="heart" size={14} color={theme.colors.text.secondary} />
                    <Text style={[styles.statText, { color: theme.colors.text.secondary }]}>
                      {post.likes || 0}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="chatbubble" size={14} color={theme.colors.text.secondary} />
                    <Text style={[styles.statText, { color: theme.colors.text.secondary }]}>
                      {post.comentarios || 0}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Botones */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                { borderColor: theme.colors.glass.border }
              ]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.text.secondary }]}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.deleteButton,
                { opacity: loading ? 0.7 : 1 }
              ]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="trash" size={16} color="#fff" />
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalContainer: {
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  iconContainer: {
    marginBottom: spacing.base,
  },
  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  postPreview: {
    flexDirection: 'row',
    width: '100%',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  previewImage: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.sm,
  },
  previewContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  previewText: {
    fontSize: 13,
    lineHeight: 16,
  },
  previewStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#FF4444',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default DeleteConfirmModal;