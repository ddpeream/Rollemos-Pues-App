/**
 * 📡 useRealtimeSubscription Hook
 * 
 * Hook personalizado para suscribirse a cambios en tiempo real de Supabase
 * en una tabla específica. Se limpia automáticamente al desmontar.
 * 
 * Uso:
 * useRealtimeSubscription('spots', () => loadSpots());
 * useRealtimeSubscription('parches', (payload) => { ... });
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../config/supabase';

export const useRealtimeSubscription = (table, onDataChange, enabled = true) => {
  const subscriptionRef = useRef(null);
  const tableRef = useRef(table);
  const callbackRef = useRef(onDataChange);

  // Actualizar referencias sin triggear re-suscripción
  useEffect(() => {
    tableRef.current = table;
    callbackRef.current = onDataChange;
  }, [table, onDataChange]);

  useEffect(() => {
    if (!enabled || !tableRef.current || !callbackRef.current) {
      console.log(`⏭️ Realtime deshabilitado o datos incompletos para: ${tableRef.current}`);
      return;
    }

    // Si ya tenemos una suscripción activa, no crear otra
    if (subscriptionRef.current) {
      console.log(`📡 Suscripción ya activa para: ${tableRef.current}`);
      return;
    }

    console.log(`📡 Iniciando suscripción realtime para tabla: ${tableRef.current}`);

    // Crear canal de suscripción
    const channel = supabase
      .channel(`public:${tableRef.current}:changes`)
      .on(
        'postgres_changes',
        {
          event: '*', // Todos los eventos: INSERT, UPDATE, DELETE
          schema: 'public',
          table: tableRef.current,
        },
        (payload) => {
          console.log(`🔄 ${tableRef.current} - Evento: ${payload.eventType}`, {
            action: payload.eventType,
            newData: payload.new?.id,
            oldData: payload.old?.id,
          });
          callbackRef.current(payload);
        }
      )
      .subscribe((status) => {
        console.log(`📡 [${tableRef.current}] Estado: ${status}`);
      });

    subscriptionRef.current = channel;

    // Limpiar suscripción al desmontar
    return () => {
      if (subscriptionRef.current) {
        console.log(`❌ Limpiando suscripción de: ${tableRef.current}`);
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [enabled]); // SOLO depende de 'enabled', no de table ni onDataChange
};

export default useRealtimeSubscription;
