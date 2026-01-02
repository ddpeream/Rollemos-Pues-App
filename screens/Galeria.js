/**
 * 📷 Galería Screen - Feed estilo Instagram
 * 
 * Características:
 * - Feed vertical tipo Instagram
 * - Posts a pantalla completa
 * - Sistema de likes y comentarios
 * - Subir fotos nuevas
 * - Diseño moderno con glassmorphism
 */

import React, { useState, useRef } from 'react';
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
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useGaleria } from '../hooks/useGaleria';
import { useAppStore } from '../store/useAppStore';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { Ionicons } from '@expo/vector-icons';
import CreatePostModal from '../components/CreatePostModal';

const { width, height } = Dimensions.get('window');

export default function Galeria() {
  const { user, theme } = useAppStore();
  const { t } = useTranslation();
  const {
    posts,
    loading,
    refreshing,
    loadPosts,
    refreshPosts,
    handleToggleLike,
    createNewPost,
    addComment,
    loadComments,
  } = useGaleria();

  const [expandedComments, setExpandedComments] = useState({});
  const [loadedComments, setLoadedComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [sendingComment, setSendingComment] = useState({});

  // Cargar posts al entrar a la pantalla
  useFocusEffect(
    React.useCallback(() => {
      loadPosts();
    }, [loadPosts])
  );

  // 📡 Suscribirse a cambios en tiempo real de galería (callback estable)
  const handleGaleriaChange = React.useCallback((payload) => {
    console.log('📷 Cambio en galería:', payload.eventType);
    loadPosts(); // Recargar posts
  }, [loadPosts]);

  useRealtimeSubscription('galeria', handleGaleriaChange);

  // 📡 Suscribirse a cambios en galeria_comentarios
  const handleCommentsChange = React.useCallback((payload) => {
    console.log('💬 Nuevo comentario');
    loadPosts(); // Recargar posts para actualizar comentarios
  }, [loadPosts]);

  useRealtimeSubscription('galeria_comentarios', handleCommentsChange);

  // Toggle like
  const handleLike = async (postId) => {
    if (!user) return;
    await handleToggleLike(postId);
  };

  // Crear nuevo post
  const handleCreatePost = async (postData) => {
    // postData viene del modal con: imagen, descripcion, ubicacion, aspect_ratio
    const result = await createNewPost(postData.imagen, postData.descripcion, postData.ubicacion);
    if (result.success) {
      setShowUploadModal(false);
      loadPosts();
    }
    return result;
  };

  // Toggle mostrar comentarios y cargar desde Supabase
  const toggleComments = async (postId) => {
    const isExpanding = !expandedComments[postId];
    
    setExpandedComments(prev => ({
      ...prev,
      [postId]: isExpanding
    }));

    // Si estamos expandiendo y no tenemos comentarios cargados, cargarlos
    if (isExpanding && !loadedComments[postId]) {
      const result = await loadComments(postId);
      if (result.success) {
        setLoadedComments(prev => ({
          ...prev,
          [postId]: result.data
        }));
      }
    }
  };

  // Enviar comentario
  const handleSendComment = async (postId) => {
    const texto = commentText[postId]?.trim();
    if (!texto || !user) return;

    setSendingComment(prev => ({ ...prev, [postId]: true }));
    
    const result = await addComment(postId, texto);
    
    if (result.success) {
      // Limpiar el texto
      setCommentText(prev => ({ ...prev, [postId]: '' }));
      
      // Agregar el nuevo comentario a la lista local
      setLoadedComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), result.data]
      }));
      
      // Recargar posts para actualizar el contador
      loadPosts();
    }
    
    setSendingComment(prev => ({ ...prev, [postId]: false }));
  };

  // Formatear tiempo relativo
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return t('screens.galeria.time.now');
    if (diffInSeconds < 3600) return t('screens.galeria.time.minutes', { count: Math.floor(diffInSeconds / 60) });
    if (diffInSeconds < 86400) return t('screens.galeria.time.hours', { count: Math.floor(diffInSeconds / 3600) });
    if (diffInSeconds < 604800) return t('screens.galeria.time.days', { count: Math.floor(diffInSeconds / 86400) });
    return date.toLocaleDateString();
  };

  // Stories data (simulado)
  const stories = [
    { id: '1', nombre: t('screens.galeria.storyYour'), avatar: user?.avatar || 'https://i.pravatar.cc/150?img=1', isOwn: true },
    { id: '2', nombre: 'Carlos', avatar: 'https://i.pravatar.cc/150?img=12', hasStory: true },
    { id: '3', nombre: 'María', avatar: 'https://i.pravatar.cc/150?img=5', hasStory: true },
    { id: '4', nombre: 'Deimar', avatar: 'https://i.pravatar.cc/150?img=33', hasStory: true },
    { id: '5', nombre: 'Laura', avatar: 'https://i.pravatar.cc/150?img=9', hasStory: true },
    { id: '6', nombre: 'Andrés', avatar: 'https://i.pravatar.cc/150?img=68', hasStory: true },
  ];

  // Renderizar story
  const renderStory = ({ item }) => (
    <TouchableOpacity style={styles.storyItem}>
      <View style={[
        styles.storyAvatarContainer,
        item.hasStory && styles.storyAvatarBorder,
        { borderColor: item.hasStory ? theme.colors.primary : 'transparent' }
      ]}>
        <Image source={{ uri: item.avatar }} style={styles.storyAvatar} />
        {item.isOwn && (
          <View style={[styles.addStoryButton, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="add" size={16} color={theme.colors.onPrimary} />
          </View>
        )}
      </View>
      <Text 
        style={[styles.storyName, { color: theme.colors.text.primary }]} 
        numberOfLines={1}
      >
        {item.nombre}
      </Text>
    </TouchableOpacity>
  );

  // Renderizar post tipo Instagram
  const renderPost = ({ item }) => {
    if (!item || !item.imagen) return null;

    // Usar datos de Supabase
    const userLiked = item.userLiked || false;
    const likesCount = item.likes_count || 0;
    const commentsCount = item.comentarios_count || 0;
    const isCommentsExpanded = expandedComments[item.id];
    const postComments = loadedComments[item.id] || [];

    return (
      <View style={[styles.postContainer, { backgroundColor: theme.colors.background.primary }]}>
        {/* Header del Post */}
        <View style={styles.postHeader}>
          <View style={styles.userInfoContainer}>
            <Image
              source={{ uri: item.usuario?.avatar_url || 'https://i.pravatar.cc/150' }}
              style={styles.userAvatar}
            />
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: theme.colors.text.primary }]}>
                {item.usuario?.nombre || t('screens.galeria.user')}
              </Text>
              {item.ubicacion && (
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={12} color={theme.colors.primary} />
                  <Text style={[styles.locationText, { color: theme.colors.text.tertiary }]}>
                    {item.ubicacion}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Imagen del Post */}
        <Image
          source={{ uri: item.imagen }}
          style={[styles.postImage, { aspectRatio: item.aspect_ratio || 1 }]}
          resizeMode="cover"
        />

        {/* Acciones */}
        <View style={styles.actionsContainer}>
          <View style={styles.leftActions}>
            <TouchableOpacity
              onPress={() => handleLike(item.id)}
              style={styles.actionButton}
            >
              <Ionicons
                name={userLiked ? 'heart' : 'heart-outline'}
                size={28}
                color={userLiked ? '#FF3B30' : theme.colors.text.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => toggleComments(item.id)}
              style={styles.actionButton}
            >
              <Ionicons
                name="chatbubble-outline"
                size={26}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="paper-plane-outline" size={26} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity>
            <Ionicons name="bookmark-outline" size={26} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Likes */}
        {likesCount > 0 && (
            <Text style={[styles.likesText, { color: theme.colors.text.primary }]}>
              <Text style={styles.boldText}>{likesCount.toLocaleString()}</Text> {t('screens.galeria.likes')}
            </Text>
        )}

        {/* Descripción */}
        {item.descripcion && (
          <View style={styles.captionContainer}>
            <Text style={[styles.captionText, { color: theme.colors.text.primary }]}>
              <Text style={styles.boldText}>{item.usuario?.username || item.usuario?.nombre} </Text>
              {item.descripcion}
            </Text>
          </View>
        )}

        {/* Ver comentarios */}
        {commentsCount > 0 && !isCommentsExpanded && (
          <TouchableOpacity onPress={() => toggleComments(item.id)}>
              <Text style={[styles.viewCommentsText, { color: theme.colors.text.tertiary }]}>
                {t('screens.galeria.viewComments', { count: commentsCount })}
              </Text>
          </TouchableOpacity>
        )}

        {/* Comentarios expandidos */}
        {isCommentsExpanded && (
          <View style={styles.commentsSection}>
            {postComments.length > 0 ? (
              postComments.map((comment, index) => (
                <View key={comment.id || `comment-${index}`} style={styles.commentItem}>
                  <Text style={[styles.commentText, { color: theme.colors.text.primary }]}>
                    <Text style={styles.boldText}>{comment.usuario?.nombre || 'Usuario'} </Text>
                    {comment.texto}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={[styles.noCommentsText, { color: theme.colors.text.tertiary }]}>
                No hay comentarios aún
              </Text>
            )}
            
            {/* Input para nuevo comentario */}
            {user && (
              <View style={[styles.commentInputContainer, { borderTopColor: theme.colors.border }]}>
                <TextInput
                  style={[styles.commentInput, { color: theme.colors.text.primary }]}
                  placeholder="Escribe un comentario..."
                  placeholderTextColor={theme.colors.text.tertiary}
                  value={commentText[item.id] || ''}
                  onChangeText={(text) => setCommentText(prev => ({ ...prev, [item.id]: text }))}
                  multiline
                />
                <TouchableOpacity 
                  onPress={() => handleSendComment(item.id)}
                  disabled={sendingComment[item.id] || !commentText[item.id]?.trim()}
                  style={styles.sendButton}
                >
                  {sendingComment[item.id] ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    <Ionicons 
                      name="send" 
                      size={20} 
                      color={commentText[item.id]?.trim() ? theme.colors.primary : theme.colors.text.tertiary} 
                    />
                  )}
                </TouchableOpacity>
              </View>
            )}
            
            <TouchableOpacity onPress={() => toggleComments(item.id)}>
              <Text style={[styles.hideCommentsText, { color: theme.colors.text.tertiary }]}>
                {t('screens.galeria.hideComments')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tiempo */}
        <Text style={[styles.timeText, { color: theme.colors.text.tertiary }]}>
          {formatTimeAgo(item.created_at || item.fecha)}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border.primary }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          Rollemos Pues
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowUploadModal(true)}
            style={styles.headerButton}
          >
            <Ionicons name="add-circle-outline" size={28} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="heart-outline" size={28} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="chatbubbles-outline" size={28} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Feed */}
      {loading && posts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text.tertiary }]}>
            {t('screens.galeria.loading')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshPosts}
              tintColor={theme.colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={[styles.storiesContainer, { borderBottomColor: theme.colors.border.primary }]}>
              <FlatList
                data={stories}
                renderItem={renderStory}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storiesList}
              />
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="images-outline" size={80} color={theme.colors.text.tertiary} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
                {t('screens.galeria.empty')}
              </Text>
              <Text style={[styles.emptyText, { color: theme.colors.text.tertiary }]}>
                {t('screens.galeria.emptyHint')}
              </Text>
              <TouchableOpacity
                onPress={() => setShowUploadModal(true)}
                style={[styles.uploadButton, { backgroundColor: theme.colors.primary }]}
              >
                <Ionicons name="add" size={24} color={theme.colors.onPrimary} />
                <Text style={[styles.uploadButtonText, { color: theme.colors.onPrimary }]}>{t('screens.galeria.upload')}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Modal para crear post */}
      <CreatePostModal
        visible={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSubmit={handleCreatePost}
        usuario={user}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },

  // Stories
  storiesContainer: {
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  storiesList: {
    paddingHorizontal: 12,
    gap: 12,
  },
  storyItem: {
    alignItems: 'center',
    width: 80,
  },
  storyAvatarContainer: {
    position: 'relative',
    padding: 3,
    borderRadius: 40,
    borderWidth: 2,
  },
  storyAvatarBorder: {
    borderWidth: 2.5,
  },
  storyAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  addStoryButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  storyName: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },

  // Post Container
  postContainer: {
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
  },

  // Post Image
  postImage: {
    width: width,
    minHeight: 300,
    maxHeight: 600,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },

  // Actions
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },

  // Likes
  likesText: {
    paddingHorizontal: 16,
    paddingTop: 8,
    fontSize: 14,
  },
  boldText: {
    fontWeight: '600',
  },

  // Caption
  captionContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  captionText: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Comments
  viewCommentsText: {
    paddingHorizontal: 16,
    paddingTop: 8,
    fontSize: 14,
  },
  commentsSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  commentItem: {
    paddingVertical: 4,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 18,
  },
  hideCommentsText: {
    fontSize: 14,
    paddingTop: 4,
  },
  noCommentsText: {
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    maxHeight: 80,
  },
  sendButton: {
    padding: 8,
  },

  // Time
  timeText: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    fontSize: 12,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
