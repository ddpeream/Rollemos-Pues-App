/**
 * 🛼 SERVICIO DE RODADAS (Eventos/Quedadas)
 * 
 * CRUD para rodadas + búsqueda de lugares con Google Places API
 */

import { supabase } from '../config/supabase';

// API Key de Google Places
// TODO: Mover a .env cuando se reinicie el servidor con --clear
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || 'AIzaSyBU5TGIrte_aiYK0IYTuA72P2l3lTSYh_w';

// ============================================
// GOOGLE PLACES API
// ============================================

/**
 * Buscar lugares con Google Places Autocomplete
 * @param {string} query - Texto de búsqueda
 * @param {object} options - Opciones adicionales
 * @returns {Promise<Array>} Lista de predicciones de lugares
 */
export const searchPlaces = async (query, options = {}) => {
  if (!query || query.length < 3) {
    return [];
  }

  if (!GOOGLE_PLACES_API_KEY) {
    console.error('❌ Google Places API Key no configurada');
    return [];
  }

  try {
    const params = new URLSearchParams({
      input: query,
      key: GOOGLE_PLACES_API_KEY,
      language: 'es',
      components: options.country ? `country:${options.country}` : 'country:co', // Colombia por defecto
      types: options.types || 'geocode|establishment',
    });

    // Agregar location bias si está disponible
    if (options.latitude && options.longitude) {
      params.append('location', `${options.latitude},${options.longitude}`);
      params.append('radius', options.radius || '50000'); // 50km por defecto
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
    );

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('❌ Error Places API:', data.status, data.error_message);
      return [];
    }

    // Mapear resultados a formato más simple
    return (data.predictions || []).map(prediction => ({
      placeId: prediction.place_id,
      description: prediction.description,
      mainText: prediction.structured_formatting?.main_text || prediction.description,
      secondaryText: prediction.structured_formatting?.secondary_text || '',
    }));
  } catch (error) {
    console.error('❌ Error buscando lugares:', error);
    return [];
  }
};

/**
 * Obtener detalles de un lugar (coordenadas)
 * @param {string} placeId - ID del lugar de Google
 * @returns {Promise<object|null>} Detalles del lugar con coordenadas
 */
export const getPlaceDetails = async (placeId) => {
  if (!placeId || !GOOGLE_PLACES_API_KEY) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      place_id: placeId,
      key: GOOGLE_PLACES_API_KEY,
      fields: 'geometry,formatted_address,name',
      language: 'es',
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params}`
    );

    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('❌ Error Place Details:', data.status);
      return null;
    }

    const result = data.result;
    return {
      placeId,
      nombre: result.name || result.formatted_address,
      direccion: result.formatted_address,
      lat: result.geometry?.location?.lat,
      lng: result.geometry?.location?.lng,
    };
  } catch (error) {
    console.error('❌ Error obteniendo detalles:', error);
    return null;
  }
};

// ============================================
// CRUD RODADAS
// ============================================

/**
 * Crear una nueva rodada
 * @param {object} rodadaData - Datos de la rodada
 * @returns {Promise<object>} Resultado de la operación
 */
export const createRodada = async (rodadaData) => {
  try {
    const { data, error } = await supabase
      .from('rodadas')
      .insert([{
        nombre: rodadaData.nombre,
        descripcion: rodadaData.descripcion || null,
        punto_salida_nombre: rodadaData.puntoSalida.nombre,
        punto_salida_lat: rodadaData.puntoSalida.lat,
        punto_salida_lng: rodadaData.puntoSalida.lng,
        punto_salida_place_id: rodadaData.puntoSalida.placeId || null,
        punto_llegada_nombre: rodadaData.puntoLlegada?.nombre || null,
        punto_llegada_lat: rodadaData.puntoLlegada?.lat || null,
        punto_llegada_lng: rodadaData.puntoLlegada?.lng || null,
        punto_llegada_place_id: rodadaData.puntoLlegada?.placeId || null,
        fecha_inicio: rodadaData.fechaInicio,
        hora_encuentro: rodadaData.horaEncuentro || null,
        organizador_id: rodadaData.organizadorId,
        parche_id: rodadaData.parcheId || null,
        nivel_requerido: rodadaData.nivelRequerido || 'todos',
        distancia_estimada: rodadaData.distanciaEstimada || null,
        duracion_estimada: rodadaData.duracionEstimada || null,
        max_participantes: rodadaData.maxParticipantes || null,
        imagen: rodadaData.imagen || null,
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando rodada:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Rodada creada:', data.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error en createRodada:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener lista de rodadas
 * @param {object} filters - Filtros opcionales
 * @returns {Promise<Array>} Lista de rodadas
 */
export const getRodadas = async (filters = {}) => {
  try {
    let query = supabase
      .from('rodadas')
      .select(`
        *,
        organizador:usuarios!organizador_id(id, nombre, avatar_url),
        parche:parches(id, nombre, foto)
      `)
      .order('fecha_inicio', { ascending: true });

    // Filtrar por estado
    if (filters.estado) {
      query = query.eq('estado', filters.estado);
    } else {
      // Por defecto, solo rodadas activas (no canceladas ni finalizadas)
      query = query.in('estado', ['programada', 'en_curso']);
    }

    // Filtrar por fecha (solo futuras o en curso)
    if (filters.soloProximas) {
      query = query.gte('fecha_inicio', new Date().toISOString());
    }

    // Filtrar por parche
    if (filters.parcheId) {
      query = query.eq('parche_id', filters.parcheId);
    }

    // Filtrar por organizador
    if (filters.organizadorId) {
      query = query.eq('organizador_id', filters.organizadorId);
    }

    // Límite
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error obteniendo rodadas:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error en getRodadas:', error);
    return [];
  }
};

/**
 * Obtener una rodada por ID
 * @param {string} rodadaId - ID de la rodada
 * @returns {Promise<object|null>} Rodada o null
 */
export const getRodadaById = async (rodadaId) => {
  try {
    const { data, error } = await supabase
      .from('rodadas')
      .select(`
        *,
        organizador:usuarios!organizador_id(id, nombre, avatar_url),
        parche:parches(id, nombre, foto),
        participantes:rodadas_participantes(
          id,
          estado,
          usuario:usuarios(id, nombre, avatar_url)
        )
      `)
      .eq('id', rodadaId)
      .single();

    if (error) {
      console.error('❌ Error obteniendo rodada:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Error en getRodadaById:', error);
    return null;
  }
};

/**
 * Actualizar una rodada
 * @param {string} rodadaId - ID de la rodada
 * @param {object} updates - Campos a actualizar
 * @returns {Promise<object>} Resultado
 */
export const updateRodada = async (rodadaId, updates) => {
  try {
    const { data, error } = await supabase
      .from('rodadas')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rodadaId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error actualizando rodada:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('❌ Error en updateRodada:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Eliminar una rodada
 * @param {string} rodadaId - ID de la rodada
 * @returns {Promise<object>} Resultado
 */
export const deleteRodada = async (rodadaId) => {
  try {
    const { error } = await supabase
      .from('rodadas')
      .delete()
      .eq('id', rodadaId);

    if (error) {
      console.error('❌ Error eliminando rodada:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error en deleteRodada:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// PARTICIPANTES
// ============================================

/**
 * Unirse a una rodada
 * @param {string} rodadaId - ID de la rodada
 * @param {string} usuarioId - ID del usuario
 * @returns {Promise<object>} Resultado
 */
export const joinRodada = async (rodadaId, usuarioId) => {
  try {
    const { data, error } = await supabase
      .from('rodadas_participantes')
      .insert([{
        rodada_id: rodadaId,
        usuario_id: usuarioId,
        estado: 'confirmado',
      }])
      .select()
      .single();

    if (error) {
      // Si ya está unido, no es error
      if (error.code === '23505') {
        return { success: true, alreadyJoined: true };
      }
      console.error('❌ Error uniéndose a rodada:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('❌ Error en joinRodada:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Salir de una rodada
 * @param {string} rodadaId - ID de la rodada
 * @param {string} usuarioId - ID del usuario
 * @returns {Promise<object>} Resultado
 */
export const leaveRodada = async (rodadaId, usuarioId) => {
  try {
    const { error } = await supabase
      .from('rodadas_participantes')
      .delete()
      .eq('rodada_id', rodadaId)
      .eq('usuario_id', usuarioId);

    if (error) {
      console.error('❌ Error saliendo de rodada:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error en leaveRodada:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verificar si un usuario está unido a una rodada
 * @param {string} rodadaId - ID de la rodada
 * @param {string} usuarioId - ID del usuario
 * @returns {Promise<boolean>} true si está unido
 */
export const isUserJoined = async (rodadaId, usuarioId) => {
  try {
    const { data, error } = await supabase
      .from('rodadas_participantes')
      .select('id')
      .eq('rodada_id', rodadaId)
      .eq('usuario_id', usuarioId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error verificando participación:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('❌ Error en isUserJoined:', error);
    return false;
  }
};

/**
 * Obtener participantes de una rodada
 * @param {string} rodadaId - ID de la rodada
 * @returns {Promise<Array>} Lista de participantes
 */
export const getRodadaParticipantes = async (rodadaId) => {
  try {
    const { data, error } = await supabase
      .from('rodadas_participantes')
      .select(`
        id,
        estado,
        created_at,
        usuario:usuarios(id, nombre, avatar_url)
      `)
      .eq('rodada_id', rodadaId)
      .eq('estado', 'confirmado')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo participantes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error en getRodadaParticipantes:', error);
    return [];
  }
};

export default {
  // Places API
  searchPlaces,
  getPlaceDetails,
  // CRUD Rodadas
  createRodada,
  getRodadas,
  getRodadaById,
  updateRodada,
  deleteRodada,
  // Participantes
  joinRodada,
  leaveRodada,
  isUserJoined,
  getRodadaParticipantes,
};
