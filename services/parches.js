/**
 * 🎯 UTILS PARCHES - CRUD COMPLETO CON SUPABASE
 * ===============================================
 * 
 * Manejo completo de la tabla 'parches' usando Opción 1:
 * - Un solo tipo de parche diferenciado por created_by
 * - CRUD completo: crear, leer, actualizar, eliminar
 * - Sistema de miembros y unirse/salirse
 * - Búsquedas y filtros optimizados
 * - Manejo de errores robusto
 * 
 * Estructura tabla 'parches':
 * - id (uuid, primary key)
 * - nombre (text, not null)
 * - descripcion (text)
 * - ciudad (text)
 * - disciplinas (text[])
 * - foto (text, URL)
 * - miembros_aprox (integer)
 * - contacto (jsonb: {correo, instagram, telefono})
 * - created_by (uuid, foreign key to usuarios)
 * - created_at (timestamp)
 * - updated_at (timestamp)
 */

import { supabase } from '../config/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

// ==========================================
// 📤 FUNCIONES DE UPLOAD
// ==========================================

/**
 * Subir imagen de parche a Storage
 * @param {string} imageUri - URI local de la imagen
 * @param {string} parcheName - Nombre del parche (para nombrar archivo)
 * @returns {Promise<Object>} { success, url, error }
 */
export const uploadParcheImage = async (imageUri, parcheName) => {
  try {
    if (!imageUri || !imageUri.startsWith('file://')) {
      console.log('📸 No hay imagen local para subir');
      return { success: true, url: imageUri || '' };
    }

    // Crear nombre único para la imagen
    const timestamp = Date.now();
    const safeName = parcheName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const fileName = `parches/${safeName}_${timestamp}.jpg`;

    console.log(`📤 Subiendo imagen de parche: ${fileName}`);

    // Leer archivo como base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    console.log(`📦 Base64 creado: ${base64.length} caracteres`);

    // Convertir a ArrayBuffer
    const arrayBuffer = decode(base64);

    // Subir a Storage (usar bucket 'posts' o crear uno nuevo 'parches')
    const { data, error } = await supabase.storage
      .from('posts') // Reutilizamos el bucket posts para parches
      .upload(fileName, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.error('❌ Error subiendo imagen de parche:', error.message);
      return { success: false, error: error.message };
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('posts')
      .getPublicUrl(fileName);

    console.log('✅ Imagen de parche subida:', urlData.publicUrl);
    return { success: true, url: urlData.publicUrl };

  } catch (error) {
    console.error('❌ Error en uploadParcheImage:', error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// 🔍 FUNCIONES DE LECTURA (READ)
// ==========================================

/**
 * Obtener todos los parches con información del creador
 * @param {Object} filters - Filtros opcionales
 * @param {string} filters.ciudad - Filtrar por ciudad
 * @param {string} filters.disciplina - Filtrar por disciplina
 * @param {string} filters.texto - Búsqueda por texto libre
 * @param {string} filters.created_by - Filtrar por creador específico
 * @returns {Promise<Array>} Array de parches con datos del usuario creador
 */
export const getParches = async (filters = {}) => {
  try {
    console.log('🔍 Cargando parches con filtros:', filters);
    
    let query = supabase
      .from('parches')
      .select(`
        *,
        usuario_creador:usuarios!parches_created_by_fkey (
          id,
          nombre,
          email,
          avatar_url
        ),
        parches_seguidores(count)
      `)
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (filters.ciudad) {
      query = query.eq('ciudad', filters.ciudad);
    }

    if (filters.disciplina) {
      query = query.contains('disciplinas', [filters.disciplina]);
    }

    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by);
    }

    if (filters.texto) {
      const searchTerm = `%${filters.texto.toLowerCase()}%`;
      query = query.or(`nombre.ilike.${searchTerm},descripcion.ilike.${searchTerm},ciudad.ilike.${searchTerm}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error obteniendo parches:', error);
      throw error;
    }

    // Mapear para extraer el conteo de seguidores
    const parchesMapped = (data || []).map(parche => ({
      ...parche,
      miembros: parche.parches_seguidores?.[0]?.count || 0,
    }));

    console.log(`✅ ${parchesMapped.length} parches cargados`);
    return parchesMapped;

  } catch (error) {
    console.error('💥 Error en getParches:', error);
    throw new Error(`Error cargando parches: ${error.message}`);
  }
};

/**
 * Obtener un parche específico por ID
 * @param {string} id - ID del parche
 * @returns {Promise<Object|null>} Datos del parche con información del creador y miembros
 */
export const getParche = async (id) => {
  try {
    console.log('🔍 Cargando parche:', id);
    
    const { data, error } = await supabase
      .from('parches')
      .select(`
        *,
        usuario_creador:usuarios!parches_created_by_fkey (
          id,
          nombre,
          email,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.warn('⚠️ Parche no encontrado:', id);
        return null;
      }
      console.error('❌ Error obteniendo parche:', error);
      throw error;
    }

    // Cargar miembros del parche
    const miembros = await getParcheMiembros(id);
    
    console.log('✅ Parche cargado:', data.nombre, `(${miembros.length} miembros)`);
    return { ...data, miembros };

  } catch (error) {
    console.error('💥 Error en getParche:', error);
    throw new Error(`Error cargando parche: ${error.message}`);
  }
};

/**
 * Obtener parches de un usuario específico
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Array de parches creados por el usuario
 */
export const getParchesByUser = async (userId) => {
  try {
    console.log('🔍 Cargando parches del usuario:', userId);
    
    const { data, error } = await supabase
      .from('parches')
      .select(`
        *,
        usuario_creador:usuarios!parches_created_by_fkey (
          id,
          nombre,
          email,
          avatar_url
        )
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo parches del usuario:', error);
      throw error;
    }

    console.log(`✅ ${data?.length || 0} parches del usuario cargados`);
    return data || [];

  } catch (error) {
    console.error('💥 Error en getParchesByUser:', error);
    throw new Error(`Error cargando parches del usuario: ${error.message}`);
  }
};

/**
 * Obtener estadísticas generales de parches
 * @returns {Promise<Object>} Estadísticas de parches
 */
export const getParchesStats = async () => {
  try {
    console.log('📊 Calculando estadísticas de parches...');
    
    const { data, error } = await supabase
      .from('parches')
      .select('ciudad, disciplinas, miembros_aprox');

    if (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw error;
    }

    const stats = {
      total: data.length,
      ciudades: [...new Set(data.map(p => p.ciudad).filter(Boolean))].length,
      disciplinas: [...new Set(data.flatMap(p => p.disciplinas || []))].length,
      miembrosTotal: data.reduce((sum, p) => sum + (p.miembros_aprox || 0), 0),
      promMiembrosPorParche: data.length > 0 
        ? Math.round(data.reduce((sum, p) => sum + (p.miembros_aprox || 0), 0) / data.length)
        : 0
    };

    console.log('✅ Estadísticas calculadas:', stats);
    return stats;

  } catch (error) {
    console.error('💥 Error en getParchesStats:', error);
    throw new Error(`Error calculando estadísticas: ${error.message}`);
  }
};

// ==========================================
// ✏️ FUNCIONES DE ESCRITURA (CREATE/UPDATE)
// ==========================================

/**
 * Crear un nuevo parche
 * @param {Object} patchData - Datos del parche
 * @param {string} patchData.nombre - Nombre del parche (requerido)
 * @param {string} patchData.descripcion - Descripción
 * @param {string} patchData.ciudad - Ciudad
 * @param {Array} patchData.disciplinas - Array de disciplinas
 * @param {string} patchData.foto - URL de la foto
 * @param {number} patchData.miembros_aprox - Número aproximado de miembros
 * @param {Object} patchData.contacto - Información de contacto
 * @param {string} userId - ID del usuario que crea el parche
 * @returns {Promise<Object>} Parche creado
 */
export const createParche = async (patchData, userId) => {
  try {
    console.log('➕ Creando parche:', patchData.nombre);
    
    // Validaciones básicas
    if (!patchData.nombre?.trim()) {
      throw new Error('El nombre del parche es requerido');
    }
    
    if (!userId) {
      throw new Error('ID de usuario requerido');
    }

    // Si hay una imagen local, subirla primero
    let fotoUrl = patchData.foto || '';
    if (patchData.foto && patchData.fotoLocal) {
      console.log('📤 Subiendo imagen del parche...');
      const uploadResult = await uploadParcheImage(patchData.foto, patchData.nombre);
      if (uploadResult.success) {
        fotoUrl = uploadResult.url;
      } else {
        console.warn('⚠️ No se pudo subir la imagen, continuando sin foto');
        fotoUrl = '';
      }
    }

    // Preparar datos para inserción
    const parcheToInsert = {
      nombre: patchData.nombre.trim(),
      descripcion: patchData.descripcion?.trim() || '',
      ciudad: patchData.ciudad?.trim() || '',
      disciplinas: Array.isArray(patchData.disciplinas) ? patchData.disciplinas : [],
      foto: fotoUrl,
      miembros_aprox: parseInt(patchData.miembros_aprox) || 1,
      contacto: patchData.contacto || {},
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('parches')
      .insert([parcheToInsert])
      .select(`
        *,
        usuario_creador:usuarios!parches_created_by_fkey (
          id,
          nombre,
          email,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('❌ Error creando parche:', error);
      throw error;
    }

    console.log('✅ Parche creado exitosamente:', data.id);
    return data;

  } catch (error) {
    console.error('💥 Error en createParche:', error);
    throw new Error(`Error creando parche: ${error.message}`);
  }
};

/**
 * Actualizar un parche existente
 * @param {string} id - ID del parche
 * @param {Object} updates - Datos a actualizar
 * @param {string} userId - ID del usuario que actualiza (para verificación)
 * @returns {Promise<Object>} Parche actualizado
 */
export const updateParche = async (id, updates, userId) => {
  try {
    console.log('✏️ Actualizando parche:', id);
    
    // Verificar que el usuario puede editar este parche
    const parche = await getParche(id);
    if (!parche) {
      throw new Error('Parche no encontrado');
    }
    
    if (parche.created_by !== userId) {
      throw new Error('No tienes permisos para editar este parche');
    }

    // Preparar datos para actualización
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Limpiar datos undefined/null
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === null) {
        delete updateData[key];
      }
    });

    const { data, error } = await supabase
      .from('parches')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        usuario_creador:usuarios!parches_created_by_fkey (
          id,
          nombre,
          email,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('❌ Error actualizando parche:', error);
      throw error;
    }

    console.log('✅ Parche actualizado exitosamente');
    return data;

  } catch (error) {
    console.error('💥 Error en updateParche:', error);
    throw new Error(`Error actualizando parche: ${error.message}`);
  }
};

// ==========================================
// 🗑️ FUNCIONES DE ELIMINACIÓN (DELETE)
// ==========================================

/**
 * Eliminar un parche
 * @param {string} id - ID del parche
 * @param {string} userId - ID del usuario que elimina (para verificación)
 * @returns {Promise<boolean>} True si se eliminó exitosamente
 */
export const deleteParche = async (id, userId) => {
  try {
    console.log('🗑️ Eliminando parche:', id);
    
    // Verificar que el usuario puede eliminar este parche
    const parche = await getParche(id);
    if (!parche) {
      throw new Error('Parche no encontrado');
    }
    
    if (parche.created_by !== userId) {
      throw new Error('No tienes permisos para eliminar este parche');
    }

    const { error } = await supabase
      .from('parches')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error eliminando parche:', error);
      throw error;
    }

    console.log('✅ Parche eliminado exitosamente');
    return true;

  } catch (error) {
    console.error('💥 Error en deleteParche:', error);
    throw new Error(`Error eliminando parche: ${error.message}`);
  }
};

// ==========================================
// 🔄 FUNCIONES AUXILIARES
// ==========================================

/**
 * Obtener todas las ciudades únicas de los parches
 * @returns {Promise<Array>} Array de ciudades
 */
export const getCiudadesParches = async () => {
  try {
    const { data, error } = await supabase
      .from('parches')
      .select('ciudad')
      .not('ciudad', 'is', null)
      .not('ciudad', 'eq', '');

    if (error) throw error;

    const ciudades = [...new Set(data.map(p => p.ciudad))].sort();
    console.log(`✅ ${ciudades.length} ciudades encontradas`);
    return ciudades;

  } catch (error) {
    console.error('💥 Error obteniendo ciudades:', error);
    return [];
  }
};

/**
 * Obtener todas las disciplinas únicas de los parches
 * @returns {Promise<Array>} Array de disciplinas
 */
export const getDisciplinasParches = async () => {
  try {
    const { data, error } = await supabase
      .from('parches')
      .select('disciplinas');

    if (error) throw error;

    const disciplinas = [...new Set(data.flatMap(p => p.disciplinas || []))].sort();
    console.log(`✅ ${disciplinas.length} disciplinas encontradas`);
    return disciplinas;

  } catch (error) {
    console.error('💥 Error obteniendo disciplinas:', error);
    return [];
  }
};

/**
 * Buscar parches por texto libre
 * @param {string} searchTerm - Término de búsqueda
 * @returns {Promise<Array>} Array de parches que coinciden
 */
export const searchParches = async (searchTerm) => {
  if (!searchTerm?.trim()) {
    return await getParches();
  }

  return await getParches({ texto: searchTerm.trim() });
};

/**
 * Verificar si un usuario puede editar un parche
 * @param {string} parcheId - ID del parche
 * @param {string} userId - ID del usuario
 * @returns {Promise<boolean>} True si puede editar
 */
export const canEditParche = async (parcheId, userId) => {
  try {
    const parche = await getParche(parcheId);
    return parche && parche.created_by === userId;
  } catch (error) {
    console.error('💥 Error verificando permisos:', error);
    return false;
  }
};

// ==========================================
// � FUNCIONES DE MEMBRESÍA
// ==========================================

/**
 * Unirse a un parche
 * @param {string} parcheId - ID del parche
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Resultado de la operación
 */
export const joinParche = async (parcheId, userId) => {
  try {
    console.log('➕ Uniéndose al parche:', parcheId);
    
    // Verificar si ya es seguidor/miembro
    const { data: existing } = await supabase
      .from('parches_seguidores')
      .select('id')
      .eq('parche_id', parcheId)
      .eq('usuario_id', userId)
      .single();
    
    if (existing) {
      return { success: false, error: 'Ya eres miembro de este parche' };
    }
    
    // Insertar nuevo seguidor
    const { data, error } = await supabase
      .from('parches_seguidores')
      .insert([{
        parche_id: parcheId,
        usuario_id: userId
      }])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error uniéndose al parche:', error);
      throw error;
    }
    
    console.log('✅ Usuario unido al parche');
    return { success: true, data };
    
  } catch (error) {
    console.error('💥 Error en joinParche:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Salir de un parche
 * @param {string} parcheId - ID del parche
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Resultado de la operación
 */
export const leaveParche = async (parcheId, userId) => {
  try {
    console.log('➖ Saliendo del parche:', parcheId);
    
    const { error } = await supabase
      .from('parches_seguidores')
      .delete()
      .eq('parche_id', parcheId)
      .eq('usuario_id', userId);
    
    if (error) {
      console.error('❌ Error saliendo del parche:', error);
      throw error;
    }
    
    console.log('✅ Usuario salió del parche');
    return { success: true };
    
  } catch (error) {
    console.error('💥 Error en leaveParche:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener miembros de un parche
 * @param {string} parcheId - ID del parche
 * @returns {Promise<Array>} Lista de miembros
 */
export const getParcheMiembros = async (parcheId) => {
  try {
    const { data, error } = await supabase
      .from('parches_seguidores')
      .select(`
        *,
        usuario:usuarios!parches_seguidores_usuario_id_fkey (
          id,
          nombre,
          avatar_url,
          ciudad
        )
      `)
      .eq('parche_id', parcheId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
    
  } catch (error) {
    console.error('❌ Error obteniendo miembros:', error);
    return [];
  }
};

// ==========================================
// 📸 FUNCIONES DE IMÁGENES MÚLTIPLES
// ==========================================

/**
 * Subir múltiples imágenes para un parche
 * @param {string} parcheId - ID del parche
 * @param {Array<string>} imageUris - URIs locales de las imágenes
 * @returns {Promise<Object>} { success, urls, error }
 */
export const uploadMultipleParcheImages = async (parcheId, imageUris) => {
  try {
    console.log(`📸 Subiendo ${imageUris.length} imágenes para parche ${parcheId}`);
    
    const uploadedUrls = [];
    
    for (let i = 0; i < imageUris.length; i++) {
      const uri = imageUris[i];
      const timestamp = Date.now();
      const fileName = `parches/${parcheId}/gallery_${timestamp}_${i}.jpg`;
      
      // Leer archivo como base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      
      // Convertir a ArrayBuffer
      const arrayBuffer = decode(base64);
      
      // Subir a Storage
      const { data, error } = await supabase.storage
        .from('posts')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });
      
      if (error) {
        console.error(`❌ Error subiendo imagen ${i + 1}:`, error.message);
        continue; // Continuar con las siguientes
      }
      
      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName);
      
      uploadedUrls.push(urlData.publicUrl);
      console.log(`✅ Imagen ${i + 1}/${imageUris.length} subida`);
    }
    
    if (uploadedUrls.length === 0) {
      return { success: false, error: 'No se pudo subir ninguna imagen' };
    }
    
    // Actualizar el array de fotos en el parche
    const { data: parche } = await supabase
      .from('parches')
      .select('fotos')
      .eq('id', parcheId)
      .single();
    
    const existingPhotos = parche?.fotos || [];
    const newPhotos = [...existingPhotos, ...uploadedUrls];
    
    const { error: updateError } = await supabase
      .from('parches')
      .update({ fotos: newPhotos, updated_at: new Date().toISOString() })
      .eq('id', parcheId);
    
    if (updateError) {
      console.error('❌ Error actualizando fotos del parche:', updateError);
      return { success: false, error: 'Imágenes subidas pero no guardadas en el parche' };
    }
    
    console.log(`✅ ${uploadedUrls.length} imágenes guardadas en el parche`);
    return { success: true, urls: uploadedUrls };
    
  } catch (error) {
    console.error('💥 Error en uploadMultipleParcheImages:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Eliminar una imagen de un parche
 * @param {string} parcheId
 * @param {string} imageUrl
 * @returns {Promise<Object>}
 */
export const removeParcheImage = async (parcheId, imageUrl) => {
  try {
    const { data: parche, error } = await supabase
      .from('parches')
      .select('foto, fotos')
      .eq('id', parcheId)
      .single();

    if (error) {
      console.error('💥 Error obteniendo parche:', error);
      return { success: false, error: error.message };
    }

    const nextFotos = (parche?.fotos || []).filter((url) => url !== imageUrl);
    const nextFoto = parche?.foto === imageUrl ? nextFotos[0] || null : parche?.foto;

    const { error: updateError } = await supabase
      .from('parches')
      .update({ fotos: nextFotos, foto: nextFoto, updated_at: new Date().toISOString() })
      .eq('id', parcheId);

    if (updateError) {
      console.error('💥 Error eliminando imagen:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('💥 Error en removeParcheImage:', error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// �📊 FUNCIONES DE VALIDACIÓN
// ==========================================

/**
 * Validar datos de parche antes de crear/actualizar
 * @param {Object} patchData - Datos del parche
 * @returns {Object} { isValid: boolean, errors: Array }
 */
export const validatePatchData = (patchData) => {
  const errors = [];

  // Validar nombre (requerido)
  if (!patchData.nombre?.trim()) {
    errors.push('El nombre del parche es requerido');
  } else if (patchData.nombre.trim().length < 3) {
    errors.push('El nombre debe tener al menos 3 caracteres');
  } else if (patchData.nombre.trim().length > 100) {
    errors.push('El nombre no puede tener más de 100 caracteres');
  }

  // Validar descripción
  if (patchData.descripcion && patchData.descripcion.length > 500) {
    errors.push('La descripción no puede tener más de 500 caracteres');
  }

  // Validar ciudad
  if (patchData.ciudad && patchData.ciudad.length > 100) {
    errors.push('El nombre de la ciudad es muy largo');
  }

  // Validar miembros_aprox
  if (patchData.miembros_aprox !== undefined) {
    const miembros = parseInt(patchData.miembros_aprox);
    if (isNaN(miembros) || miembros < 1) {
      errors.push('El número de miembros debe ser mayor a 0');
    } else if (miembros > 10000) {
      errors.push('El número de miembros parece muy alto');
    }
  }

  // Validar disciplinas
  if (patchData.disciplinas && !Array.isArray(patchData.disciplinas)) {
    errors.push('Las disciplinas deben ser un array');
  }

  // Validar contacto
  if (patchData.contacto) {
    if (patchData.contacto.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patchData.contacto.correo)) {
      errors.push('El formato del correo electrónico no es válido');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

console.log('🎯 Utils Parches cargado - CRUD completo disponible');
