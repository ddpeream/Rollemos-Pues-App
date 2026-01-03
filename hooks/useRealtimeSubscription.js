/**
 * ?? useRealtimeSubscription Hook
 *
 * Hook personalizado para suscribirse a cambios en tiempo real de Supabase
 * en una tabla especifica. Se limpia automaticamente al desmontar.
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
  const channelNameRef = useRef(null);

  // Actualizar referencias sin triggear re-suscripcion
  useEffect(() => {
    tableRef.current = table;
    callbackRef.current = onDataChange;
  }, [table, onDataChange]);

  useEffect(() => {
    if (!enabled || !tableRef.current || !callbackRef.current) {
      if (subscriptionRef.current) {
        console.log(`? Realtime deshabilitado, limpiando: ${tableRef.current}`);
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
        channelNameRef.current = null;
      }
      console.log(`?? Realtime deshabilitado o datos incompletos para: ${tableRef.current}`);
      return;
    }

    // Si ya tenemos una suscripcion activa, no crear otra
    if (subscriptionRef.current) {
      console.log(`?? Suscripcion ya activa para: ${tableRef.current}`);
      return;
    }

    console.log(`?? Iniciando suscripcion realtime para tabla: ${tableRef.current}`);

    // Nombre de canal unico por instancia para evitar colisiones
    if (!channelNameRef.current) {
      channelNameRef.current = `public:${tableRef.current}:changes:${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
    }

    // Crear canal de suscripcion
    const channel = supabase
      .channel(channelNameRef.current)
      .on(
        'postgres_changes',
        {
          event: '*', // Todos los eventos: INSERT, UPDATE, DELETE
          schema: 'public',
          table: tableRef.current,
        },
        (payload) => {
          console.log(`?? ${tableRef.current} - Evento: ${payload.eventType}`, {
            action: payload.eventType,
            newData: payload.new?.id,
            oldData: payload.old?.id,
          });
          callbackRef.current(payload);
        }
      )
      .subscribe((status) => {
        console.log(`?? [${tableRef.current}] Estado: ${status}`);
      });

    subscriptionRef.current = channel;

    // Limpiar suscripcion al desmontar
    return () => {
      if (subscriptionRef.current) {
        console.log(`? Limpiando suscripcion de: ${tableRef.current}`);
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
        channelNameRef.current = null;
      }
    };
  }, [enabled]); // SOLO depende de 'enabled', no de table ni onDataChange
};

export default useRealtimeSubscription;
