/**
 * 📷 useGaleria Hook
 *
 * Hook personalizado para manejar toda la lógica de la galería de fotos.
 *
 * Características:
 * - CRUD de posts
 * - Sistema de likes
 * - Sistema de comentarios
 * - Upload de imágenes
 * - Manejo de estados de carga y errores
 */

import { useState, useCallback } from 'react';
import {
  getGaleria,
  getPostById,
  getMisPosts,
  createPost,
  deletePost,
  toggleLike,
  isLikedByUser,
  getLikesDePost,
  addComentario,
  getComentarios,
  deleteComentario,
} from '../services/galeria';
import { useAppStore } from '../store/useAppStore';

export const useGaleria = () => {
  const user = useAppStore((state) => state.user);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * 📋 Cargar posts
   */
  const loadPosts = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      console.log('📋 Cargando posts desde Supabase...');
      
      // Cargar posts desde Supabase
      const data = await getGaleria(filters);
      
      // Para cada post, verificar si el usuario actual dio like y cargar likes/comentarios count
      if (user?.id && data.length > 0) {
        const postsWithLikeStatus = await Promise.all(
          data.map(async (post) => {
            const liked = await isLikedByUser(post.id, user.id);
            return {
              ...post,
              userLiked: liked,
            };
          })
        );
        setPosts(postsWithLikeStatus);
        console.log(`✅ ${postsWithLikeStatus.length} posts cargados con estado de like`);
        return { success: true, data: postsWithLikeStatus };
      }
      
      setPosts(data || []);
      console.log(`✅ ${data?.length || 0} posts cargados`);

      return { success: true, data };
    } catch (err) {
      console.error('❌ Error cargando posts:', err);
      setError(err.message || 'Error al cargar posts');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * 🔄 Refrescar posts (pull-to-refresh)
   */
  const refreshPosts = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadPosts();
    } finally {
      setRefreshing(false);
    }
  }, [loadPosts]);

  /**
   * 🔍 Obtener un post específico por ID
   */
  const loadPost = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Cargando post:', id);
      const data = await getPostById(id);

      if (!data) {
        setError('Post no encontrado');
        return { success: false, error: 'Post no encontrado' };
      }

      console.log('✅ Post cargado');
      return { success: true, data };
    } catch (err) {
      console.error('❌ Error cargando post:', err);
      setError(err.message || 'Error al cargar post');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 📋 Cargar posts del usuario actual
   */
  const loadMyPosts = useCallback(async () => {
    if (!user?.id) {
      setError('Debes iniciar sesión');
      return { success: false, error: 'Debes iniciar sesión' };
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📋 Cargando mis posts...');
      const data = await getMisPosts(user.id);

      console.log(`✅ ${data?.length || 0} posts cargados`);
      return { success: true, data };
    } catch (err) {
      console.error('❌ Error cargando mis posts:', err);
      setError(err.message || 'Error al cargar posts');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * ✏️ Crear nuevo post
   */
  const createNewPost = useCallback(async (imageUri, descripcion, ubicacion) => {
    if (!user?.id) {
      setError('Debes iniciar sesión');
      return { success: false, error: 'Debes iniciar sesión' };
    }

    if (!imageUri) {
      setError('Debes seleccionar una imagen');
      return { success: false, error: 'Debes seleccionar una imagen' };
    }

    if (!descripcion || !descripcion.trim()) {
      setError('Debes agregar una descripción');
      return { success: false, error: 'Debes agregar una descripción' };
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📸 Creando post...');
      console.log('📸 URI:', imageUri);
      console.log('📸 Usuario ID:', user.id);

      const postData = {
        usuario_id: user.id,
        imagen: imageUri,
        descripcion: descripcion.trim(),
        ubicacion: ubicacion?.trim() || null,
        aspect_ratio: 1,
      };

      console.log('📸 Llamando a createPost con datos:', {
        usuario_id: postData.usuario_id,
        imagen: imageUri.substring(0, 50) + '...',
        descripcion: postData.descripcion.substring(0, 30) + '...',
      });

      const result = await createPost(postData);

      if (!result.success) {
        console.error('❌ createPost retornó error:', result.error);
        setError(result.error || 'Error al crear post');
        return { success: false, error: result.error };
      }

      console.log('✅ Post creado exitosamente');
      await loadPosts();

      return { success: true, data: result.data };
    } catch (err) {
      console.error('❌ Error creando post:', err);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error stack:', err.stack);
      setError(err.message || 'Error al crear post');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user, loadPosts]);

  /**
   * 🗑️ Eliminar post
   */
  const deleteExistingPost = useCallback(async (id) => {
    if (!user?.id) {
      setError('Debes iniciar sesión');
      return { success: false, error: 'Debes iniciar sesión' };
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🗑️ Eliminando post:', id);
      const result = await deletePost(id);

      if (!result) {
        setError('Error al eliminar post');
        return { success: false, error: 'Error al eliminar post' };
      }

      console.log('✅ Post eliminado exitosamente');

      // Recargar posts
      await loadPosts();

      return { success: true };
    } catch (err) {
      console.error('❌ Error eliminando post:', err);
      setError(err.message || 'Error al eliminar post');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user, loadPosts]);

  /**
   * ❤️ Toggle like en un post
   */
  const handleToggleLike = useCallback(async (postId) => {
    if (!user?.id) {
      setError('Debes iniciar sesión');
      return { success: false, error: 'Debes iniciar sesión' };
    }

    try {
      console.log('❤️ Toggling like en post:', postId);
      
      // Llamar al servicio de Supabase
      const result = await toggleLike(postId, user.id);
      
      if (result.success) {
        // Actualizar el estado local
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === postId) {
              const currentLikes = post.likes_count || 0;
              return {
                ...post,
                likes_count: result.liked ? currentLikes + 1 : currentLikes - 1,
                userLiked: result.liked
              };
            }
            return post;
          })
        );
        console.log('✅ Like actualizado:', result.liked ? 'dado' : 'quitado');
      }
      
      return result;
    } catch (err) {
      console.error('❌ Error toggling like:', err);
      setError(err.message || 'Error al dar like');
      return { success: false, error: err.message };
    }
  }, [user]);

  /**
   * 💬 Agregar comentario
   */
  const addComment = useCallback(async (postId, texto) => {
    if (!user?.id) {
      setError('Debes iniciar sesión');
      return { success: false, error: 'Debes iniciar sesión' };
    }

    setLoading(true);
    setError(null);

    try {
      console.log('💬 Agregando comentario...');
      const data = await addComentario(postId, user.id, texto);

      if (!data) {
        setError('Error al agregar comentario');
        return { success: false, error: 'Error al agregar comentario' };
      }

      console.log('✅ Comentario agregado');
      return { success: true, data };
    } catch (err) {
      console.error('❌ Error agregando comentario:', err);
      setError(err.message || 'Error al agregar comentario');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * 🔍 Obtener comentarios de un post
   */
  const loadComments = useCallback(async (postId) => {
    try {
      console.log('🔍 Cargando comentarios del post:', postId);
      const data = await getComentarios(postId);

      console.log(`✅ ${data?.length || 0} comentarios cargados`);
      return { success: true, data };
    } catch (err) {
      console.error('❌ Error cargando comentarios:', err);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * 🗑️ Eliminar comentario
   */
  const deleteComment = useCallback(async (comentarioId) => {
    if (!user?.id) {
      setError('Debes iniciar sesión');
      return { success: false, error: 'Debes iniciar sesión' };
    }

    try {
      console.log('🗑️ Eliminando comentario:', comentarioId);
      const result = await deleteComentario(comentarioId, user.id);

      if (!result) {
        setError('Error al eliminar comentario');
        return { success: false, error: 'Error al eliminar comentario' };
      }

      console.log('✅ Comentario eliminado');
      return { success: true };
    } catch (err) {
      console.error('❌ Error eliminando comentario:', err);
      setError(err.message || 'Error al eliminar comentario');
      return { success: false, error: err.message };
    }
  }, [user]);

  /**
   * ✅ Verificar si el usuario dio like a un post
   */
  const checkIfLiked = useCallback(async (postId) => {
    if (!user?.id) return false;

    try {
      return await isLikedByUser(postId, user.id);
    } catch (err) {
      console.error('❌ Error verificando like:', err);
      return false;
    }
  }, [user]);

  /**
   * 📊 Obtener número de likes de un post
   */
  const getLikesCount = useCallback(async (postId) => {
    try {
      const likes = await getLikesDePost(postId);
      return likes?.length || 0;
    } catch (err) {
      console.error('❌ Error obteniendo likes:', err);
      return 0;
    }
  }, []);

  return {
    // Estado
    posts,
    loading,
    refreshing,
    error,

    // Métodos CRUD
    loadPosts,
    loadPost,
    loadMyPosts,
    createNewPost,
    deletePost: deleteExistingPost,

    // Métodos de likes
    handleToggleLike,
    checkIfLiked,
    getLikesCount,

    // Métodos de comentarios
    addComment,
    loadComments,
    deleteComment,

    // Métodos auxiliares
    refreshPosts,
    clearError: () => setError(null),
  };
};

export default useGaleria;
