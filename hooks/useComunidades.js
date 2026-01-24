/**
 * ?? useComunidades Hook
 *
 * CRUD basico + seguimiento
 */

import { useState, useCallback } from 'react';
import {
  getComunidades,
  createComunidad,
  getComunidadesByUser,
  addComunidadLeader,
  uploadMultipleComunidadImages,
  removeComunidadImage,
  joinComunidad as joinComunidadService,
  leaveComunidad as leaveComunidadService,
} from '../services/comunidades';
import { useAppStore } from '../store/useAppStore';

export const useComunidades = () => {
  const user = useAppStore((state) => state.user);

  const [comunidades, setComunidades] = useState([]);
  const [membershipIds, setMembershipIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadComunidades = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getComunidades(filters);
      setComunidades(data || []);

      if (user?.id) {
        const ids = await getComunidadesByUser(user.id);
        setMembershipIds(new Set(ids));
      } else {
        setMembershipIds(new Set());
      }

      return { success: true, data };
    } catch (err) {
      setError(err.message || 'Error al cargar comunidades');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const refreshComunidades = useCallback(async (filters = {}) => {
    setRefreshing(true);
    try {
      await loadComunidades(filters);
    } finally {
      setRefreshing(false);
    }
  }, [loadComunidades]);

  const createNewComunidad = useCallback(async (comunidadData) => {
    if (!user?.id) {
      setError('Debes iniciar sesion');
      return { success: false, error: 'Debes iniciar sesion' };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await createComunidad(comunidadData, user.id);
      if (result.success) {
        await loadComunidades();
      }
      return result;
    } catch (err) {
      setError(err.message || 'Error al crear comunidad');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user?.id, loadComunidades]);

  const joinComunidad = useCallback(async (comunidadId) => {
    if (!user?.id) {
      return { success: false, error: 'Debes iniciar sesion' };
    }

    const result = await joinComunidadService(comunidadId, user.id);
    if (result.success && !result.alreadyJoined) {
      setMembershipIds((prev) => new Set([...prev, comunidadId]));
    }
    return result;
  }, [user?.id]);

  const leaveComunidad = useCallback(async (comunidadId) => {
    if (!user?.id) {
      return { success: false, error: 'Debes iniciar sesion' };
    }

    const result = await leaveComunidadService(comunidadId, user.id);
    if (result.success) {
      setMembershipIds((prev) => {
        const next = new Set(prev);
        next.delete(comunidadId);
        return next;
      });
    }
    return result;
  }, [user?.id]);

  const addLeader = useCallback(async (comunidadId, userId) => {
    if (!user?.id) {
      return { success: false, error: 'Debes iniciar sesion' };
    }

    return addComunidadLeader(comunidadId, userId, user.id);
  }, [user?.id]);

  const addComunidadImages = useCallback(async (comunidadId, imageUris, coverIndex) => {
    if (!user?.id) {
      return { success: false, error: 'Debes iniciar sesion' };
    }

    return uploadMultipleComunidadImages(comunidadId, imageUris, coverIndex);
  }, [user?.id]);

  const deleteComunidadImage = useCallback(async (comunidadId, imageUrl) => {
    if (!user?.id) {
      return { success: false, error: 'Debes iniciar sesion' };
    }

    return removeComunidadImage(comunidadId, imageUrl);
  }, [user?.id]);

  const isMember = useCallback((comunidadId) => {
    return membershipIds.has(comunidadId);
  }, [membershipIds]);

  return {
    comunidades,
    membershipIds,
    loading,
    refreshing,
    error,
    loadComunidades,
    refreshComunidades,
    createComunidad: createNewComunidad,
    addLeader,
    addComunidadImages,
    deleteComunidadImage,
    joinComunidad,
    leaveComunidad,
    isMember,
  };
};

export default useComunidades;
