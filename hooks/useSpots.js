/**
 * 📍 useSpots Hook
 *
 * Hook personalizado para manejar toda la lógica de spots de patinaje.
 *
 * Características:
 * - CRUD completo de spots
 * - Búsqueda y filtros
 * - Manejo de estados de carga y errores
 */

import { useState, useCallback } from "react";
import { supabase } from "../config/supabase";

export const useSpots = () => {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * 📋 Cargar spots
   */
  const loadSpots = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("📋 Cargando spots...");

      const { data, error: fetchError } = await supabase
        .from("spots")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setSpots(data || []);
      console.log(`✅ ${data?.length || 0} spots cargados`);

      return { success: true, data };
    } catch (err) {
      console.error('❌ Error cargando spots (raw):', err);
      console.error('❌ Error cargando spots (string):', JSON.stringify(err));
      setError(err?.message || 'Error al cargar spots');
      return { success: false, error: err?.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 🔄 Refrescar spots (pull-to-refresh)
   */
  const refreshSpots = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadSpots();
    } finally {
      setRefreshing(false);
    }
  }, [loadSpots]);

  return {
    // Estado
    spots,
    loading,
    refreshing,
    error,

    // Métodos
    loadSpots,
    refreshSpots,
    clearError: () => setError(null),
  };
};

export default useSpots;
