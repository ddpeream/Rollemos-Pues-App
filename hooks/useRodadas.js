/**
 * 🛼 HOOK DE RODADAS
 * 
 * Estado y acciones para manejar rodadas (eventos/quedadas)
 */

import { create } from 'zustand';
import { 
  getRodadas, 
  getRodadaById, 
  createRodada, 
  updateRodada, 
  deleteRodada,
  joinRodada,
  leaveRodada,
  isUserJoined,
  searchPlaces,
  getPlaceDetails,
} from '../services/rodadas';

// 🎭 DATOS DE PRUEBA (eliminar en producción)
const MOCK_RODADAS = [
  {
    id: 'mock-1',
    nombre: 'Rodada Nocturna El Poblado',
    descripcion: 'Rodada tranquila por las calles de El Poblado, apta para todos los niveles.',
    punto_salida_nombre: 'Parque Lleras, Medellín',
    punto_salida_lat: 6.2086,
    punto_salida_lng: -75.5659,
    punto_llegada_nombre: 'Parque del Poblado',
    punto_llegada_lat: 6.2095,
    punto_llegada_lng: -75.5695,
    fecha_inicio: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // En 2 días
    hora_encuentro: '7:00 PM',
    estado: 'programada',
    nivel_requerido: 'todos',
    participantes_count: 12,
    organizador_id: 'mock-user-1',
    organizador: { nombre: 'Carlos Skater', avatar_url: null },
  },
  {
    id: 'mock-2',
    nombre: 'Ruta Ciclorruta Río Medellín',
    descripcion: 'Recorrido largo por toda la ciclorruta del río. Se requiere buen nivel.',
    punto_salida_nombre: 'Universidad Nacional, Medellín',
    punto_salida_lat: 6.2629,
    punto_salida_lng: -75.5776,
    punto_llegada_nombre: 'Parque Norte',
    punto_llegada_lat: 6.2754,
    punto_llegada_lng: -75.5648,
    fecha_inicio: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // En 5 días
    hora_encuentro: '6:30 AM',
    estado: 'programada',
    nivel_requerido: 'intermedio',
    participantes_count: 8,
    organizador_id: 'mock-user-2',
    organizador: { nombre: 'María Wheels', avatar_url: null },
  },
  {
    id: 'mock-3',
    nombre: '¡Rodada en Curso - Laureles!',
    descripcion: 'Estamos rodando ahora mismo por la 70.',
    punto_salida_nombre: 'Estadio Atanasio Girardot',
    punto_salida_lat: 6.2567,
    punto_salida_lng: -75.5906,
    punto_llegada_nombre: null,
    punto_llegada_lat: null,
    punto_llegada_lng: null,
    fecha_inicio: new Date().toISOString(),
    hora_encuentro: '5:00 PM',
    estado: 'en_curso',
    nivel_requerido: 'principiante',
    participantes_count: 5,
    organizador_id: 'mock-user-3',
    organizador: { nombre: 'Juan Roller', avatar_url: null },
  },
  {
    id: 'mock-4',
    nombre: 'Rodada Full Moon Envigado',
    descripcion: 'Rodada especial de luna llena, traer luces y reflectivos.',
    punto_salida_nombre: 'Parque Principal Envigado',
    punto_salida_lat: 6.1739,
    punto_salida_lng: -75.5866,
    punto_llegada_nombre: 'Centro Comercial Viva',
    punto_llegada_lat: 6.1712,
    punto_llegada_lng: -75.6172,
    fecha_inicio: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // En 7 días
    hora_encuentro: '8:00 PM',
    estado: 'programada',
    nivel_requerido: 'avanzado',
    participantes_count: 15,
    organizador_id: 'mock-user-4',
    organizador: { nombre: 'Ana Speed', avatar_url: null },
  },
];

const useRodadasStore = create((set, get) => ({
  // ============================================
  // ESTADO
  // ============================================
  rodadas: MOCK_RODADAS, // Inicializar con datos de prueba
  rodadaActual: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  
  // Estado para búsqueda de lugares
  placeSearchResults: [],
  isSearchingPlaces: false,

  // ============================================
  // ACCIONES - RODADAS
  // ============================================
  
  /**
   * Cargar lista de rodadas
   */
  fetchRodadas: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const data = await getRodadas(filters);
      set({ rodadas: data, isLoading: false });
      return data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return [];
    }
  },

  /**
   * Refrescar rodadas (pull-to-refresh)
   */
  refreshRodadas: async (filters = {}) => {
    set({ isRefreshing: true });
    try {
      const data = await getRodadas(filters);
      set({ rodadas: data, isRefreshing: false });
      return data;
    } catch (error) {
      set({ isRefreshing: false });
      return [];
    }
  },

  /**
   * Cargar una rodada por ID
   */
  fetchRodadaById: async (rodadaId) => {
    set({ isLoading: true, error: null });
    try {
      const data = await getRodadaById(rodadaId);
      set({ rodadaActual: data, isLoading: false });
      return data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  /**
   * Crear nueva rodada
   */
  crearRodada: async (rodadaData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await createRodada(rodadaData);
      if (result.success) {
        // Agregar al inicio de la lista
        set(state => ({
          rodadas: [result.data, ...state.rodadas],
          isLoading: false,
        }));
      } else {
        set({ error: result.error, isLoading: false });
      }
      return result;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  /**
   * Actualizar rodada
   */
  actualizarRodada: async (rodadaId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const result = await updateRodada(rodadaId, updates);
      if (result.success) {
        set(state => ({
          rodadas: state.rodadas.map(r => 
            r.id === rodadaId ? { ...r, ...result.data } : r
          ),
          rodadaActual: state.rodadaActual?.id === rodadaId 
            ? { ...state.rodadaActual, ...result.data } 
            : state.rodadaActual,
          isLoading: false,
        }));
      } else {
        set({ error: result.error, isLoading: false });
      }
      return result;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  /**
   * Eliminar rodada
   */
  eliminarRodada: async (rodadaId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await deleteRodada(rodadaId);
      if (result.success) {
        set(state => ({
          rodadas: state.rodadas.filter(r => r.id !== rodadaId),
          rodadaActual: state.rodadaActual?.id === rodadaId ? null : state.rodadaActual,
          isLoading: false,
        }));
      } else {
        set({ error: result.error, isLoading: false });
      }
      return result;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // ACCIONES - PARTICIPANTES
  // ============================================

  /**
   * Unirse a una rodada
   */
  unirseARodada: async (rodadaId, usuarioId) => {
    try {
      const result = await joinRodada(rodadaId, usuarioId);
      if (result.success && !result.alreadyJoined) {
        // Solo actualizar contador si realmente se unió (no si ya estaba)
        set(state => ({
          rodadas: state.rodadas.map(r => 
            r.id === rodadaId 
              ? { ...r, participantes_count: (r.participantes_count || 0) + 1 }
              : r
          ),
        }));
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Salir de una rodada
   */
  salirDeRodada: async (rodadaId, usuarioId) => {
    try {
      const result = await leaveRodada(rodadaId, usuarioId);
      if (result.success) {
        // Actualizar contador en la lista
        set(state => ({
          rodadas: state.rodadas.map(r => 
            r.id === rodadaId 
              ? { ...r, participantes_count: Math.max(0, (r.participantes_count || 1) - 1) }
              : r
          ),
        }));
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Verificar si el usuario está unido
   */
  verificarParticipacion: async (rodadaId, usuarioId) => {
    return await isUserJoined(rodadaId, usuarioId);
  },

  // ============================================
  // ACCIONES - BÚSQUEDA DE LUGARES
  // ============================================

  /**
   * Buscar lugares con Google Places
   */
  buscarLugares: async (query, options = {}) => {
    if (!query || query.length < 3) {
      set({ placeSearchResults: [] });
      return [];
    }

    set({ isSearchingPlaces: true });
    try {
      const results = await searchPlaces(query, options);
      set({ placeSearchResults: results, isSearchingPlaces: false });
      return results;
    } catch (error) {
      set({ placeSearchResults: [], isSearchingPlaces: false });
      return [];
    }
  },

  /**
   * Obtener detalles de un lugar
   */
  obtenerDetallesLugar: async (placeId) => {
    try {
      return await getPlaceDetails(placeId);
    } catch (error) {
      return null;
    }
  },

  /**
   * Limpiar resultados de búsqueda
   */
  limpiarBusquedaLugares: () => {
    set({ placeSearchResults: [], isSearchingPlaces: false });
  },

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Limpiar rodada actual
   */
  limpiarRodadaActual: () => {
    set({ rodadaActual: null });
  },

  /**
   * Limpiar error
   */
  limpiarError: () => {
    set({ error: null });
  },

  /**
   * Obtener rodadas próximas (para el mapa)
   */
  getRodadasProximas: () => {
    const { rodadas } = get();
    const ahora = new Date();
    return rodadas.filter(r => 
      r.estado === 'programada' && new Date(r.fecha_inicio) > ahora
    );
  },

  /**
   * Obtener rodadas en curso (para el mapa)
   */
  getRodadasEnCurso: () => {
    const { rodadas } = get();
    return rodadas.filter(r => r.estado === 'en_curso');
  },
}));

// Hook personalizado
export const useRodadas = () => {
  const store = useRodadasStore();
  return store;
};

export default useRodadas;
