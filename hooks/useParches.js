/**
 * 👥 useParches Hook
 *
 * Hook personalizado para manejar toda la lógica de parches/equipos.
 *
 * Características:
 * - CRUD completo de parches
 * - Búsqueda y filtros
 * - Validación de permisos
 * - Manejo de estados de carga y errores
 */

import { useState, useCallback } from 'react';
import {
  getParches,
  getParche,
  createParche,
  updateParche,
  deleteParche,
  getCiudadesParches,
  getDisciplinasParches,
  joinParche as joinParcheService,
  leaveParche as leaveParcheService,
  uploadMultipleParcheImages,
  getParcheMiembros,
} from "../services/parches";
import { useAppStore } from '../store/useAppStore';

export const useParches = () => {
  const user = useAppStore((state) => state.user);

  const [parches, setParches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filtros
  const [filters, setFilters] = useState({
    text: '',
    ciudad: '',
    disciplina: '',
  });

  /**
   * 📋 Cargar parches con filtros
   */
  const loadParches = useCallback(async (customFilters = null) => {
    setLoading(true);
    setError(null);

    try {
      console.log('📋 Cargando parches...');
      const activeFilters = customFilters || filters;
      const data = await getParches(activeFilters);

      setParches(data || []);
      console.log(`✅ ${data?.length || 0} parches cargados`);

      return { success: true, data };
    } catch (err) {
      console.error('❌ Error cargando parches:', err);
      setError(err.message || 'Error al cargar parches');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * 🔄 Refrescar parches (pull-to-refresh)
   */
  const refreshParches = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadParches();
    } finally {
      setRefreshing(false);
    }
  }, [loadParches]);

  /**
   * 🔍 Obtener un parche específico por ID
   */
  const loadParche = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Cargando parche:', id);
      const data = await getParche(id);

      if (!data) {
        setError('Parche no encontrado');
        return { success: false, error: 'Parche no encontrado' };
      }

      console.log('✅ Parche cargado:', data.nombre);
      return { success: true, data };
    } catch (err) {
      console.error('❌ Error cargando parche:', err);
      setError(err.message || 'Error al cargar parche');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * ✏️ Crear nuevo parche
   */
  const createNewParche = useCallback(async (parcheData) => {
    if (!user?.id) {
      setError('Debes iniciar sesión para crear un parche');
      return { success: false, error: 'Debes iniciar sesión' };
    }

    setLoading(true);
    setError(null);

    try {
      console.log('✏️ Creando parche...');
      const data = await createParche(parcheData, user.id);

      if (!data) {
        setError('Error al crear parche');
        return { success: false, error: 'Error al crear parche' };
      }

      console.log('✅ Parche creado:', data.nombre);

      // Recargar parches
      await loadParches();

      return { success: true, data };
    } catch (err) {
      console.error('❌ Error creando parche:', err);
      setError(err.message || 'Error al crear parche');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user, loadParches]);

  /**
   * 🔄 Actualizar parche existente
   */
  const updateExistingParche = useCallback(async (id, updates) => {
    if (!user?.id) {
      setError('Debes iniciar sesión');
      return { success: false, error: 'Debes iniciar sesión' };
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Actualizando parche:', id);
      const data = await updateParche(id, updates, user.id);

      if (!data) {
        setError('Error al actualizar parche');
        return { success: false, error: 'Error al actualizar parche' };
      }

      console.log('✅ Parche actualizado:', data.nombre);

      // Recargar parches
      await loadParches();

      return { success: true, data };
    } catch (err) {
      console.error('❌ Error actualizando parche:', err);
      setError(err.message || 'Error al actualizar parche');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user, loadParches]);

  /**
   * 🗑️ Eliminar parche
   */
  const deleteExistingParche = useCallback(async (id) => {
    if (!user?.id) {
      setError('Debes iniciar sesión');
      return { success: false, error: 'Debes iniciar sesión' };
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🗑️ Eliminando parche:', id);
      const result = await deleteParche(id, user.id);

      if (!result) {
        setError('Error al eliminar parche');
        return { success: false, error: 'Error al eliminar parche' };
      }

      console.log('✅ Parche eliminado exitosamente');

      // Recargar parches
      await loadParches();

      return { success: true };
    } catch (err) {
      console.error('❌ Error eliminando parche:', err);
      setError(err.message || 'Error al eliminar parche');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user, loadParches]);

  /**
   * ➕ Unirse a un parche
   */
  const joinParche = useCallback(async (parcheId) => {
    if (!user?.id) {
      setError('Debes iniciar sesión');
      return { success: false, error: 'Debes iniciar sesión' };
    }

    try {
      console.log('➕ Uniéndose al parche:', parcheId);
      const result = await joinParcheService(parcheId, user.id);
      
      if (!result.success) {
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      console.error('❌ Error uniéndose al parche:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [user]);

  /**
   * ➖ Salir de un parche
   */
  const leaveParche = useCallback(async (parcheId) => {
    if (!user?.id) {
      setError('Debes iniciar sesión');
      return { success: false, error: 'Debes iniciar sesión' };
    }

    try {
      console.log('➖ Saliendo del parche:', parcheId);
      const result = await leaveParcheService(parcheId, user.id);
      
      if (!result.success) {
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      console.error('❌ Error saliendo del parche:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [user]);

  /**
   * 📸 Agregar imágenes al parche
   */
  const addParcheImages = useCallback(async (parcheId, imageUris) => {
    if (!user?.id) {
      setError('Debes iniciar sesión');
      return { success: false, error: 'Debes iniciar sesión' };
    }

    try {
      console.log(`📸 Subiendo ${imageUris.length} imágenes...`);
      const result = await uploadMultipleParcheImages(parcheId, imageUris);
      
      if (!result.success) {
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      console.error('❌ Error subiendo imágenes:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [user]);

  /**
   * 🏙️ Obtener lista de ciudades únicas
   */
  const loadCiudades = useCallback(async () => {
    try {
      const ciudades = await getCiudadesParches();
      return { success: true, data: ciudades };
    } catch (err) {
      console.error('❌ Error obteniendo ciudades:', err);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * 🎨 Obtener lista de disciplinas únicas
   */
  const loadDisciplinas = useCallback(async () => {
    try {
      const disciplinas = await getDisciplinasParches();
      return { success: true, data: disciplinas };
    } catch (err) {
      console.error('❌ Error obteniendo disciplinas:', err);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * 🔍 Aplicar filtros
   */
  const applyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    loadParches(newFilters);
  }, [loadParches]);

  /**
   * 🧹 Limpiar filtros
   */
  const clearFilters = useCallback(() => {
    const emptyFilters = { text: '', ciudad: '', disciplina: '' };
    setFilters(emptyFilters);
    loadParches(emptyFilters);
  }, [loadParches]);

  /**
   * ✅ Verificar si el usuario puede editar un parche
   */
  const canEdit = useCallback((parche) => {
    return parche?.created_by === user?.id;
  }, [user]);

  return {
    // Estado
    parches,
    loading,
    refreshing,
    error,
    filters,

    // Métodos CRUD
    loadParches,
    loadParche,
    createParche: createNewParche,
    updateParche: updateExistingParche,
    deleteParche: deleteExistingParche,

    // Métodos de membresía
    joinParche,
    leaveParche,
    addParcheImages,

    // Métodos de filtros
    applyFilters,
    clearFilters,
    loadCiudades,
    loadDisciplinas,

    // Métodos auxiliares
    refreshParches,
    canEdit,
    clearError: () => setError(null),
  };
};

export default useParches;
