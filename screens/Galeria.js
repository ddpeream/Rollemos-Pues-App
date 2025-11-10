/**
 * 📷 Galería Screen - Feed de fotos del club
 * 
 * Características:
 * - Feed de posts con imágenes
 * - Sistema de likes
 * - Subir fotos nuevas
 * - Eliminar/editar propios posts
 * - Grid responsivo tipo masonry
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Image,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useGaleria } from '../hooks/useGaleria';
import { useAppStore } from '../store/useAppStore';
import CreatePostModal from '../components/CreatePostModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import PostOptionsMenu from '../components/PostOptionsMenu';
import { commonStyles } from '../theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const SPACING = 8;
const IMAGE_SIZE = (width - SPACING * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

export default function Galeria() {
  const { t } = useTranslation();
  const { user } = useAppStore();
  const {
    posts,
    loading,
    refreshing,
    loadPosts,
    refreshPosts,
    handleDeletePost,
    handleToggleLike,
  } = useGaleria();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [optionsMenuVisible, setOptionsMenuVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // Cargar posts al entrar a la pantalla
  useFocusEffect(
    React.useCallback(() => {
      loadPosts();
    }, [])
  );

  // Abrir opciones de post
  const handleOpenOptions = (post) => {
    setSelectedPost(post);
    setOptionsMenuVisible(true);
  };

  // Eliminar post (abrir confirmación)
  const handleDeletePress = () => {
    setOptionsMenuVisible(false);
    setDeleteModalVisible(true);
  };

  // Confirmar eliminación
  const confirmDelete = async () => {
    if (selectedPost) {
      const result = await handleDeletePost(selectedPost.id);
      if (result.success) {
        setDeleteModalVisible(false);
        setSelectedPost(null);
        loadPosts(); // Recargar
      }
    }
  };

  // Like/Unlike
  const handleLikePress = async (postId) => {
    if (!user) return;
    await handleToggleLike(postId, user.id);
    loadPosts(); // Refrescar para mostrar cambios
  };

  // Renderizar cada post
  const renderPost = ({ item }) => {
    // Validación: Si no tiene datos mínimos, no renderizar
    if (!item || !item.imagen_url) return null;
    
    const isOwner = user && item.usuario_id === user.id;
    const userLiked = item.likes?.some(like => like.usuario_id === user?.id) || false;
    const likesCount = item.likes?.length || 0;

    return (
      <View style={styles.postCard}>
        {/* Imagen del post */}
        <Image
          source={{ uri: item.imagen_url }}
          style={styles.postImage}
          resizeMode="cover"
        />

        {/* Información del post */}
        <View style={styles.postInfo}>
          {/* Usuario */}
          <View style={styles.postHeader}>
            <Image
              source={{ uri: item.usuario?.avatar_url || 'https://via.placeholder.com/40' }}
              style={styles.userAvatar}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.usuario?.nombre || 'Usuario'}</Text>
              {item.usuario?.ciudad && (
                <Text style={styles.userLocation}>{item.usuario.ciudad}</Text>
              )}
            </View>

            {/* Opciones (solo si es el dueño) */}
            {isOwner && (
              <TouchableOpacity
                onPress={() => handleOpenOptions(item)}
                style={styles.optionsButton}
              >
              <Ionicons name="ellipsis-vertical" size={20} color="#E6EEF5" />
            </TouchableOpacity>
          )}
        </View>

        {/* Descripción */}
        {item.descripcion && (
          <Text style={styles.postDescription}>{item.descripcion}</Text>
        )}          {/* Ubicación */}
          {item.ubicacion && (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={14} color="#4DD7D0" />
              <Text style={styles.locationText}>{item.ubicacion}</Text>
            </View>
          )}

          {/* Acciones */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              onPress={() => handleLikePress(item.id)}
              style={styles.likeButton}
            >
              <Ionicons
                name={userLiked ? 'heart' : 'heart-outline'}
                size={24}
                color={userLiked ? '#FF5252' : '#E6EEF5'}
              />
              <Text style={styles.likesCount}>{likesCount}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={commonStyles.containerLight}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={commonStyles.titleLG}>{t('screens.galeria')}</Text>
        {user && (
          <TouchableOpacity
            onPress={() => setCreateModalVisible(true)}
            style={styles.addButton}
          >
            <Ionicons name="add-circle" size={32} color="#4DD7D0" />
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de posts */}
      {loading && posts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4DD7D0" />
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id.toString()}
          numColumns={COLUMN_COUNT}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshPosts}
              colors={['#4DD7D0']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="images-outline" size={64} color="#A8B3BE" />
              <Text style={styles.emptyText}>
                {t('galeria.empty') || 'No hay publicaciones aún'}
              </Text>
            </View>
          }
        />
      )}

      {/* Modal para crear post */}
      <CreatePostModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onPostCreated={() => {
          setCreateModalVisible(false);
          loadPosts();
        }}
      />

      {/* Modal de opciones */}
      {selectedPost && (
        <PostOptionsMenu
          visible={optionsMenuVisible}
          onClose={() => setOptionsMenuVisible(false)}
          post={selectedPost}
          onDelete={handleDeletePress}
          onEdit={() => {
            setOptionsMenuVisible(false);
            // Aquí podrías abrir un modal de edición
          }}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      {selectedPost && (
        <DeleteConfirmModal
          visible={deleteModalVisible}
          onClose={() => setDeleteModalVisible(false)}
          onConfirm={confirmDelete}
          itemName={selectedPost.descripcion || 'esta publicación'}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
  },
  addButton: {
    padding: 4,
  },
  listContent: {
    padding: SPACING,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: SPACING,
  },
  postCard: {
    width: IMAGE_SIZE,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  postImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  postInfo: {
    padding: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  userInfo: {
    flex: 1,
    marginLeft: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E6EEF5',
  },
  userLocation: {
    fontSize: 12,
    color: '#A8B3BE',
  },
  optionsButton: {
    padding: 4,
  },
  postDescription: {
    fontSize: 14,
    color: '#E6EEF5',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#4DD7D0',
    marginLeft: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likesCount: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#E6EEF5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#A8B3BE',
  },
});
