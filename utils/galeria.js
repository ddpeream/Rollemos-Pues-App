/**
 * CRUD de Galeria
 * Todas las operaciones relacionadas con posts de galería
 */

import { supabase } from "../config/supabase";

// =============================================
// 🔍 FUNCIONES DE LECTURA
// =============================================

/**
 * Obtener todos los posts de galería con info del usuario
 */
export const getGaleria = async (filters = {}) => {
  try {
    let query = supabase
      .from('galeria')
      .select(`
        *,
        usuario:usuarios!galeria_usuario_id_fkey (
          id,
          nombre,
          avatar_url,
          ciudad
        )
      `)
      .order('created_at', { ascending: false });

    // Aplicar filtros opcionales
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    if (filters.usuario_id) {
      query = query.eq('usuario_id', filters.usuario_id);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error obteniendo galería:', error.message);
      return [];
    }
    
    console.log('✅ Posts obtenidos:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ Error en getGaleria:', error);
    return [];
  }
};

/**
 * Obtener un post específico por ID
 */
export const getPostById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('galeria')
      .select(`
        *,
        usuario:usuarios!galeria_usuario_id_fkey (
          id,
          nombre,
          avatar_url,
          ciudad
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('❌ Error obteniendo post:', error.message);
      return null;
    }
    
    console.log('✅ Post obtenido:', data);
    return data;
  } catch (error) {
    console.error('❌ Error en getPostById:', error);
    return null;
  }
};

/**
 * Obtener posts de un usuario específico
 */
export const getMisPosts = async (usuarioId) => {
  try {
    const { data, error } = await supabase
      .from('galeria')
      .select(`
        *,
        usuario:usuarios!galeria_usuario_id_fkey (
          id,
          nombre,
          avatar_url,
          ciudad
        )
      `)
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error obteniendo mis posts:', error.message);
      return [];
    }
    
    console.log('✅ Mis posts obtenidos:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ Error en getMisPosts:', error);
    return [];
  }
};

// =============================================
// ✏️ FUNCIONES DE ESCRITURA
// =============================================

/**
 * 📸 UPLOAD - Subir imagen del post a Storage
 */
export const uploadPostImage = async (imageUri, userId) => {
  try {
    if (!imageUri) {
      throw new Error('No image URI provided');
    }

    // Crear nombre único para la imagen
    const timestamp = new Date().getTime();
    const randomId = Math.random().toString(36).substring(7);
    const fileName = `post_${userId}_${timestamp}_${randomId}.jpg`;

    // Leer el archivo
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Subir a Storage
    const { data, error } = await supabase.storage
      .from('posts')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) {
      console.error('❌ Error subiendo imagen:', error.message);
      return { success: false, error: error.message };
    }

    // Obtener URL pública
    const { data: publicData } = supabase.storage
      .from('posts')
      .getPublicUrl(fileName);

    console.log('✅ Imagen subida a Storage:', publicData.publicUrl);
    return { success: true, url: publicData.publicUrl, fileName };
  } catch (error) {
    console.error('❌ Error en uploadPostImage:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Crear un nuevo post
 */
export const createPost = async (postData) => {
  try {
    // Primero subir la imagen
    const uploadResult = await uploadPostImage(postData.imagen, postData.usuario_id);
    
    if (!uploadResult.success) {
      return { success: false, error: uploadResult.error };
    }

    // Luego crear el post con la URL de la imagen
    const { data, error } = await supabase
      .from('galeria')
      .insert([{
        usuario_id: postData.usuario_id,
        imagen: uploadResult.url, // URL pública de Storage
        descripcion: postData.descripcion || null,
        ubicacion: postData.ubicacion || null,
        aspect_ratio: postData.aspect_ratio || 0.75
      }])
      .select(`
        *,
        usuario:usuarios!galeria_usuario_id_fkey (
          id,
          nombre,
          avatar_url,
          ciudad
        )
      `)
      .single();
    
    if (error) {
      console.error('❌ Error creando post:', error.message);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Post creado:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error en createPost:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Actualizar un post existente
 */
export const updatePost = async (id, updates) => {
  try {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('galeria')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        usuario:usuarios!galeria_usuario_id_fkey (
          id,
          nombre,
          avatar_url,
          ciudad
        )
      `)
      .single();
    
    if (error) {
      console.error('❌ Error actualizando post:', error.message);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Post actualizado:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error en updatePost:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Eliminar un post
 */
export const deletePost = async (id) => {
  try {
    const { error } = await supabase
      .from('galeria')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('❌ Error eliminando post:', error.message);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Post eliminado:', id);
    return { success: true };
  } catch (error) {
    console.error('❌ Error en deletePost:', error);
    return { success: false, error: error.message };
  }
};

// =============================================
// ❤️ FUNCIONES DE LIKES
// =============================================

/**
 * Toggle like en un post (dar/quitar like)
 */
export const toggleLike = async (postId, usuarioId) => {
  try {
    // Verificar si ya tiene like
    const { data: existingLike } = await supabase
      .from('galeria_likes')
      .select('id')
      .eq('galeria_id', postId)
      .eq('usuario_id', usuarioId)
      .single();

    if (existingLike) {
      // Quitar like
      const { error } = await supabase
        .from('galeria_likes')
        .delete()
        .eq('galeria_id', postId)
        .eq('usuario_id', usuarioId);

      if (error) {
        console.error('❌ Error quitando like:', error.message);
        return { success: false, error: error.message, liked: false };
      }

      console.log('✅ Like quitado');
      return { success: true, liked: false };
    } else {
      // Dar like
      const { error } = await supabase
        .from('galeria_likes')
        .insert([{
          galeria_id: postId,
          usuario_id: usuarioId
        }]);

      if (error) {
        console.error('❌ Error dando like:', error.message);
        return { success: false, error: error.message, liked: false };
      }

      console.log('✅ Like dado');
      return { success: true, liked: true };
    }
  } catch (error) {
    console.error('❌ Error en toggleLike:', error);
    return { success: false, error: error.message, liked: false };
  }
};

/**
 * Verificar si un usuario ya dio like a un post
 */
export const isLikedByUser = async (postId, usuarioId) => {
  try {
    const { data, error } = await supabase
      .from('galeria_likes')
      .select('id')
      .eq('galeria_id', postId)
      .eq('usuario_id', usuarioId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Error verificando like:', error.message);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('❌ Error en isLikedByUser:', error);
    return false;
  }
};

/**
 * Obtener likes de un post con info de usuarios
 */
export const getLikesDePost = async (postId) => {
  try {
    const { data, error } = await supabase
      .from('galeria_likes')
      .select(`
        id,
        created_at,
        usuario:usuarios!galeria_likes_usuario_id_fkey (
          id,
          nombre,
          avatar_url
        )
      `)
      .eq('galeria_id', postId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo likes:', error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error en getLikesDePost:', error);
    return [];
  }
};

// =============================================
// 💬 FUNCIONES DE COMENTARIOS
// =============================================

/**
 * Agregar comentario a un post
 */
export const addComentario = async (postId, usuarioId, texto) => {
  try {
    const { data, error } = await supabase
      .from('galeria_comentarios')
      .insert([{
        galeria_id: postId,
        usuario_id: usuarioId,
        texto: texto.trim()
      }])
      .select(`
        *,
        usuario:usuarios!galeria_comentarios_usuario_id_fkey (
          id,
          nombre,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('❌ Error agregando comentario:', error.message);
      return { success: false, error: error.message };
    }

    console.log('✅ Comentario agregado:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error en addComentario:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener comentarios de un post
 */
export const getComentarios = async (postId) => {
  try {
    const { data, error } = await supabase
      .from('galeria_comentarios')
      .select(`
        *,
        usuario:usuarios!galeria_comentarios_usuario_id_fkey (
          id,
          nombre,
          avatar_url
        )
      `)
      .eq('galeria_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo comentarios:', error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error en getComentarios:', error);
    return [];
  }
};

/**
 * Eliminar comentario (solo el autor puede)
 */
export const deleteComentario = async (comentarioId, usuarioId) => {
  try {
    const { error } = await supabase
      .from('galeria_comentarios')
      .delete()
      .eq('id', comentarioId)
      .eq('usuario_id', usuarioId); // Solo el autor puede eliminar

    if (error) {
      console.error('❌ Error eliminando comentario:', error.message);
      return { success: false, error: error.message };
    }

    console.log('✅ Comentario eliminado:', comentarioId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error en deleteComentario:', error);
    return { success: false, error: error.message };
  }
};

// =============================================
// 📊 FUNCIONES ESTADÍSTICAS
// =============================================

/**
 * Obtener estadísticas de la galería
 */
export const getGaleriaStats = async () => {
  try {
    const { data, error } = await supabase
      .from('galeria')
      .select('id');

    if (error) {
      console.error('❌ Error obteniendo stats:', error.message);
      return { totalPosts: 0 };
    }

    return {
      totalPosts: data?.length || 0
    };
  } catch (error) {
    console.error('❌ Error en getGaleriaStats:', error);
    return { totalPosts: 0 };
  }
};
