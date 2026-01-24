/**
 * ?? SERVICIO DE COMUNIDADES
 *
 * CRUD basico + seguidores
 */

import { supabase } from '../config/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

/**
 * Obtener comunidades con info del creador y conteo de miembros
 */
export const getComunidades = async (filters = {}) => {
  try {
    let query = supabase
      .from('comunidades')
      .select(`
        *,
        usuario_creador:usuarios!comunidades_created_by_fkey (
          id,
          nombre,
          avatar_url
        ),
        comunidades_seguidores(count)
      `)
      .order('created_at', { ascending: false });

    if (filters.texto) {
      query = query.ilike('nombre', `%${filters.texto}%`);
    }

    if (filters.ciudad) {
      query = query.eq('ciudad', filters.ciudad);
    }

    if (filters.isPublic != null) {
      query = query.eq('is_public', filters.isPublic);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error obteniendo comunidades:', error);
      return [];
    }

    const mapped = (data || []).map((comunidad) => ({
      ...comunidad,
      miembros: comunidad.comunidades_seguidores?.[0]?.count || 0,
    }));

    return mapped;
  } catch (error) {
    console.error('💥 Error en getComunidades:', error);
    return [];
  }
};

/**
 * Obtener una comunidad por ID
 */
export const getComunidadById = async (comunidadId) => {
  try {
    if (!comunidadId) return null;

    const { data, error } = await supabase
      .from('comunidades')
      .select(`
        *,
        usuario_creador:usuarios!comunidades_created_by_fkey (
          id,
          nombre,
          avatar_url
        ),
        comunidades_seguidores(count),
        comunidades_lideres(
          id,
          usuario:usuarios!comunidades_lideres_usuario_id_fkey (
            id,
            nombre,
            avatar_url
          )
        )
      `)
      .eq('id', comunidadId)
      .single();

    if (error) {
      console.error('💥 Error obteniendo comunidad:', error);
      return null;
    }

    return {
      ...data,
      miembros: data.comunidades_seguidores?.[0]?.count || 0,
    };
  } catch (error) {
    console.error('💥 Error en getComunidadById:', error);
    return null;
  }
};

/**
 * Agregar lider a comunidad
 */
export const addComunidadLeader = async (comunidadId, userId, createdBy) => {
  try {
    const { data, error } = await supabase
      .from('comunidades_lideres')
      .insert([
        {
          comunidad_id: comunidadId,
          usuario_id: userId,
          created_by: createdBy || null,
        },
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: true, alreadyLeader: true };
      }
      console.error('💥 Error agregando lider:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('💥 Error en addComunidadLeader:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subir multiples imagenes para una comunidad
 */
export const uploadMultipleComunidadImages = async (comunidadId, imageUris, coverIndex) => {
  try {
    const uploadedUrls = [];

    for (let i = 0; i < imageUris.length; i++) {
      const uri = imageUris[i];
      const timestamp = Date.now();
      const fileName = `comunidades/${comunidadId}/gallery_${timestamp}_${i}.jpg`;

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      const arrayBuffer = decode(base64);

      const { error } = await supabase.storage
        .from('posts')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.error('💥 Error subiendo imagen:', error);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName);

      uploadedUrls.push(urlData.publicUrl);
    }

    if (uploadedUrls.length === 0) {
      return { success: false, error: 'No se pudo subir ninguna imagen' };
    }

    const { data: comunidad } = await supabase
      .from('comunidades')
      .select('foto, fotos')
      .eq('id', comunidadId)
      .single();

    const existingPhotos = comunidad?.fotos || [];
    const newPhotos = [...existingPhotos, ...uploadedUrls];
    const coverUrl = Number.isInteger(coverIndex) ? uploadedUrls[coverIndex] : null;
    const nextFoto = coverUrl || comunidad?.foto || newPhotos[0] || null;

    const { error: updateError } = await supabase
      .from('comunidades')
      .update({ fotos: newPhotos, foto: nextFoto, updated_at: new Date().toISOString() })
      .eq('id', comunidadId);

    if (updateError) {
      console.error('💥 Error actualizando fotos de comunidad:', updateError);
      return { success: false, error: 'Imagenes subidas pero no guardadas' };
    }

    return { success: true, urls: uploadedUrls };
  } catch (error) {
    console.error('💥 Error en uploadMultipleComunidadImages:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Eliminar una imagen de comunidad
 */
export const removeComunidadImage = async (comunidadId, imageUrl) => {
  try {
    const { data: comunidad, error } = await supabase
      .from('comunidades')
      .select('foto, fotos')
      .eq('id', comunidadId)
      .single();

    if (error) {
      console.error('💥 Error obteniendo comunidad:', error);
      return { success: false, error: error.message };
    }

    const nextFotos = (comunidad?.fotos || []).filter((url) => url !== imageUrl);
    const nextFoto = comunidad?.foto === imageUrl ? nextFotos[0] || null : comunidad?.foto;

    const { error: updateError } = await supabase
      .from('comunidades')
      .update({ fotos: nextFotos, foto: nextFoto, updated_at: new Date().toISOString() })
      .eq('id', comunidadId);

    if (updateError) {
      console.error('💥 Error eliminando imagen:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('💥 Error en removeComunidadImage:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Crear una comunidad
 */
export const createComunidad = async (comunidadData, userId) => {
  try {
    if (!comunidadData?.nombre) {
      throw new Error('El nombre de la comunidad es requerido');
    }

    const toInsert = {
      nombre: comunidadData.nombre,
      descripcion: comunidadData.descripcion || null,
      ciudad: comunidadData.ciudad || null,
      foto: comunidadData.foto || null,
      tags: comunidadData.tags || null,
      is_public: comunidadData.isPublic ?? true,
      created_by: userId,
    };

    const { data, error } = await supabase
      .from('comunidades')
      .insert([toInsert])
      .select(`
        *,
        usuario_creador:usuarios!comunidades_created_by_fkey (
          id,
          nombre,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('❌ Error creando comunidad:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('💥 Error en createComunidad:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener IDs de comunidades donde el usuario es miembro
 */
export const getComunidadesByUser = async (userId) => {
  try {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('comunidades_seguidores')
      .select('comunidad_id')
      .eq('usuario_id', userId);

    if (error) {
      console.error('❌ Error obteniendo comunidades del usuario:', error);
      return [];
    }

    return (data || []).map((row) => row.comunidad_id);
  } catch (error) {
    console.error('💥 Error en getComunidadesByUser:', error);
    return [];
  }
};

/**
 * Unirse a una comunidad
 */
export const joinComunidad = async (comunidadId, userId) => {
  try {
    const { data, error } = await supabase
      .from('comunidades_seguidores')
      .insert([
        {
          comunidad_id: comunidadId,
          usuario_id: userId,
        },
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: true, alreadyJoined: true };
      }
      console.error('❌ Error uniendose a comunidad:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('💥 Error en joinComunidad:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Salir de una comunidad
 */
export const leaveComunidad = async (comunidadId, userId) => {
  try {
    const { error } = await supabase
      .from('comunidades_seguidores')
      .delete()
      .eq('comunidad_id', comunidadId)
      .eq('usuario_id', userId);

    if (error) {
      console.error('❌ Error saliendo de comunidad:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('💥 Error en leaveComunidad:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getComunidades,
  getComunidadById,
  createComunidad,
  addComunidadLeader,
  uploadMultipleComunidadImages,
  removeComunidadImage,
  getComunidadesByUser,
  joinComunidad,
  leaveComunidad,
};
