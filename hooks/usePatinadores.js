/**
 * 🛹 usePatinadores Hook
 *
 * Hook personalizado para manejar toda la lógica de patinadores/usuarios.
 *
 * Características:
 * - Obtención de usuarios
 * - Búsqueda y filtros avanzados
 * - Actualización de perfil
 * - Upload de avatares
 * - Manejo de estados de carga y errores
 */

import { useState, useCallback } from 'react';
import {
  getUsuarios,
  getUsuarioById,
  getUsuariosFiltered,
  updateUsuario,
  uploadAvatarImage,
} from '../services/usuarios';
import { useAppStore } from '../store/useAppStore';

export const usePatinadores = () => {
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);

  const [patinadores, setPatinadores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filtros
  const [filters, setFilters] = useState({
    text: '',
    ciudad: '',
    disciplina: '',
    nivel: '',
  });

  /**
   * 📋 Cargar todos los patinadores
   */
  const loadPatinadores = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📋 Cargando patinadores...');
      const data = await getUsuarios();

      setPatinadores(data || []);
      console.log(`✅ ${data?.length || 0} patinadores cargados`);

      return { success: true, data };
    } catch (err) {
      console.error('❌ Error cargando patinadores:', err);
      setError(err.message || 'Error al cargar patinadores');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 🔍 Cargar patinadores con filtros
   */
  const loadPatinadoresFiltered = useCallback(async (customFilters = null) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Buscando patinadores con filtros...');
      const activeFilters = customFilters || filters;
      const result = await getUsuariosFiltered(activeFilters);

      if (result.success) {
        setPatinadores(result.data || []);
        console.log(`✅ ${result.data?.length || 0} patinadores encontrados`);
        return { success: true, data: result.data, total: result.total };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('❌ Error buscando patinadores:', err);
      setError(err.message || 'Error al buscar patinadores');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * 🔄 Refrescar patinadores (pull-to-refresh)
   */
  const refreshPatinadores = useCallback(async () => {
    setRefreshing(true);
    try {
      // Si hay filtros activos, recargar con filtros
      if (filters.text || filters.ciudad || filters.disciplina || filters.nivel) {
        await loadPatinadoresFiltered();
      } else {
        await loadPatinadores();
      }
    } finally {
      setRefreshing(false);
    }
  }, [filters, loadPatinadores, loadPatinadoresFiltered]);

  /**
   * 👤 Obtener un patinador específico por ID
   */
  const loadPatinador = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Cargando patinador:', id);
      const data = await getUsuarioById(id);

      if (!data) {
        setError('Patinador no encontrado');
        return { success: false, error: 'Patinador no encontrado' };
      }

      console.log('✅ Patinador cargado:', data.nombre);
      return { success: true, data };
    } catch (err) {
      console.error('❌ Error cargando patinador:', err);
      setError(err.message || 'Error al cargar patinador');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 🔄 Actualizar perfil
   */
  const updatePerfil = useCallback(async (id, updates) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Actualizando perfil...');
      const result = await updateUsuario(id, updates);

      if (!result.success) {
        setError(result.error);
        return { success: false, error: result.error };
      }

      console.log('✅ Perfil actualizado');

      // Si es el usuario actual, actualizar el store
      if (id === user?.id) {
        setUser({ ...user, ...updates });
      }

      return { success: true, data: result.data };
    } catch (err) {
      console.error('❌ Error actualizando perfil:', err);
      setError(err.message || 'Error al actualizar perfil');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user, setUser]);

  /**
   * 📸 Subir avatar
   */
  const uploadAvatar = useCallback(async (imageUri, userId) => {
    setLoading(true);
    setError(null);

    try {
      console.log('📸 Subiendo avatar...');
      const result = await uploadAvatarImage(imageUri, userId);

      if (!result.success) {
        setError(result.error);
        return { success: false, error: result.error };
      }

      console.log('✅ Avatar subido:', result.url);

      // Actualizar el usuario con la nueva URL del avatar
      await updatePerfil(userId, { avatar_url: result.url });

      return { success: true, url: result.url };
    } catch (err) {
      console.error('❌ Error subiendo avatar:', err);
      setError(err.message || 'Error al subir avatar');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [updatePerfil]);

  /**
   * 🔍 Aplicar filtros
   */
  const applyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    loadPatinadoresFiltered(newFilters);
  }, [loadPatinadoresFiltered]);

  /**
   * 🧹 Limpiar filtros
   */
  const clearFilters = useCallback(() => {
    const emptyFilters = { text: '', ciudad: '', disciplina: '', nivel: '' };
    setFilters(emptyFilters);
    loadPatinadores();
  }, [loadPatinadores]);

  /**
   * 🔄 Sincronizar perfil actual desde el servidor
   */
  const syncCurrentUser = useCallback(async () => {
    if (!user?.id) {
      return { success: false, error: 'No hay usuario autenticado' };
    }

    try {
      console.log('🔄 Sincronizando perfil actual...');
      const freshUser = await getUsuarioById(user.id);

      if (freshUser) {
        setUser(freshUser);
        console.log('✅ Perfil sincronizado');
        return { success: true, data: freshUser };
      }

      return { success: false, error: 'No se pudo sincronizar' };
    } catch (err) {
      console.error('❌ Error sincronizando perfil:', err);
      return { success: false, error: err.message };
    }
  }, [user, setUser]);

  return {
    // Estado
    patinadores,
    loading,
    refreshing,
    error,
    filters,

    // Métodos
    loadPatinadores,
    loadPatinadoresFiltered,
    loadPatinador,
    updatePerfil,
    uploadAvatar,

    // Métodos de filtros
    applyFilters,
    clearFilters,

    // Métodos auxiliares
    refreshPatinadores,
    syncCurrentUser,
    clearError: () => setError(null),
  };
};

export default usePatinadores;
