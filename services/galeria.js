/**
 * CRUD de Galeria
 * Todas las operaciones relacionadas con posts de galería
 */

import { supabase } from "../config/supabase";
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer'; // ✅ Usar decode de base64-arraybuffer (recomendado por Supabase)

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

    if (!userId) {
      throw new Error('No user ID provided');
    }

    console.log(`📤 Iniciando subida para usuario: ${userId}`);

    // Crear nombre único para la imagen
    const timestamp = new Date().getTime();
    const randomId = Math.random().toString(36).substring(7);
    const fileName = `${userId}/post_${timestamp}_${randomId}.jpg`;

    console.log(`📤 Nombre de archivo: ${fileName}`);

    // Leer el archivo como base64
    let base64;
    try {
      base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });
      console.log(`📦 Base64 creado: ${base64.length} caracteres`);
    } catch (readError) {
      console.error('❌ Error leyendo archivo:', readError);
      throw new Error(`No se pudo leer la imagen: ${readError.message}`);
    }

    if (!base64 || base64.length === 0) {
      throw new Error('El archivo de imagen está vacío');
    }

    // Validar tamaño (base64 es ~33% más grande)
    const MAX_SIZE = 10 * 1024 * 1024;
    const estimatedBytes = (base64.length * 3) / 4;
    if (estimatedBytes > MAX_SIZE) {
      throw new Error('Imagen demasiado grande (máx 10MB)');
    }

    console.log(`📤 Subiendo a Storage...`);

    // Intentar subida con reintentos
    let lastError = null;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`📤 Intento ${attempt}/3...`);
        
        // ✅ Usar decode() de base64-arraybuffer (OFICIAL de Supabase)
        let arrayBuffer;
        try {
          arrayBuffer = decode(base64);
          console.log(`✅ Conversión base64 exitosa: ${arrayBuffer.byteLength} bytes`);
        } catch (conversionError) {
          console.error('❌ Error en conversión base64:', conversionError.message);
          throw new Error(`Fallo al procesar imagen: ${conversionError.message}`);
        }

        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          throw new Error('ArrayBuffer de imagen está vacío');
        }
        
        // Verificar sesión antes de subir
        console.log('🔐 Verificando sesión de Supabase...');
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn('⚠️ No hay sesión activa, intentando de todas formas...');
        } else {
          console.log('✅ Sesión activa:', session.user.email);
        }
        
        console.log(`📤 Iniciando upload de ${arrayBuffer.byteLength} bytes...`);
        const { data, error } = await supabase.storage
          .from('posts')
          .upload(fileName, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: true,
            cacheControl: '3600',
          });

        if (error) {
          lastError = error;
          console.error(`❌ Intento ${attempt} falló:`, error.message);
          console.error('❌ Error detallado:', JSON.stringify(error));
          
          if (attempt < 3) {
            const delayMs = 1000 * attempt;
            console.log(`⏳ Esperando ${delayMs}ms antes de reintentar...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
          continue;
        }

        if (data) {
          console.log(`✅ Intento ${attempt} exitoso`);
          console.log('📄 Archivo guardado:', data.path);
          
          // Obtener URL pública
          const { data: publicData } = supabase.storage
            .from('posts')
            .getPublicUrl(fileName);

          if (!publicData || !publicData.publicUrl) {
            throw new Error('No se pudo obtener URL pública');
          }

          console.log('✅ URL obtenida:', publicData.publicUrl);
          return { 
            success: true, 
            url: publicData.publicUrl, 
            fileName
          };
        }
      } catch (err) {
        lastError = err;
        console.error(`❌ Excepción intento ${attempt}:`, err.message);
        
        if (attempt < 3) {
          const delayMs = 1000 * attempt;
          console.log(`⏳ Esperando ${delayMs}ms antes de reintentar...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    const errorMsg = lastError?.message || 'Error desconocido';
    console.error('❌ Fallo después de 3 intentos:', errorMsg);
    console.error('💡 POSIBLES CAUSAS:');
    console.error('   1. Bucket "posts" no existe o no está public');
    console.error('   2. Políticas RLS no permiten uploads');
    console.error('   3. Credenciales de Supabase inválidas');
    console.error('   4. Problema de red real');
    return { success: false, error: `Fallo al subir imagen: ${errorMsg}` };

  } catch (error) {
    console.error('❌ Error en uploadPostImage:', error);
    return { 
      success: false, 
      error: error.message || 'Error al subir imagen'
    };
  }
};

/**
 * Crear un nuevo post
 */
export const createPost = async (postData) => {
  try {
    console.log('📸 Creando post con datos:', {
      usuario_id: postData.usuario_id,
      imagen: postData.imagen?.substring(0, 50),
      descripcion: postData.descripcion?.substring(0, 30),
    });
    
    // Validar datos
    if (!postData.usuario_id) {
      throw new Error('Usuario ID es requerido');
    }
    if (!postData.imagen) {
      throw new Error('Imagen es requerida');
    }
    if (!postData.descripcion || !postData.descripcion.trim()) {
      throw new Error('Descripción es requerida');
    }

    // Validar que el usuario existe
    console.log('🔍 Validando usuario...');
    const { data: usuarioData, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id, nombre')
      .eq('id', postData.usuario_id)
      .single();

    if (usuarioError || !usuarioData) {
      console.error('❌ Usuario no encontrado:', usuarioError?.message);
      throw new Error(`Usuario no encontrado: ${postData.usuario_id}`);
    }

    console.log('✅ Usuario validado:', usuarioData.nombre);

    // Subir la imagen
    console.log('📸 Subiendo imagen...');
    const uploadResult = await uploadPostImage(postData.imagen, postData.usuario_id);
    
    if (!uploadResult.success) {
      console.error('❌ Error en upload:', uploadResult.error);
      return { success: false, error: uploadResult.error };
    }

    console.log('✅ Imagen subida, guardando en BD...');

    // Crear el post con la URL de la imagen
    const { data, error } = await supabase
      .from('galeria')
      .insert([{
        usuario_id: postData.usuario_id,
        imagen: uploadResult.url,
        descripcion: postData.descripcion.trim(),
        ubicacion: postData.ubicacion?.trim() || null,
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
      console.error('❌ Error en BD:', error.message);
      console.error('❌ Error detalles:', JSON.stringify(error));
      return { success: false, error: `Error al guardar post: ${error.message}` };
    }
    
    console.log('✅ Post creado exitosamente:', data.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error en createPost:', error.message);
    console.error('❌ Error stack:', error.stack);
    return { 
      success: false, 
      error: error.message || 'Error al crear post'
    };
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
