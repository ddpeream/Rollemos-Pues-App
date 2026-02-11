import { useState, useEffect, useRef } from 'react';
import { snapToRoads } from '../services/snapToRoads';

const SNAP_INTERVAL_MS = 15000; // snap cada 15 segundos

/**
 * Hook que toma coordenadas GPS crudas y devuelve coordenadas
 * ajustadas a las vías reales (snap-to-roads).
 * Si el servicio falla, devuelve las coordenadas originales.
 */
export const useSnapToRoads = (rawCoordinates, isTracking) => {
  const [snappedCoordinates, setSnappedCoordinates] = useState([]);
  const lastSnapTimeRef = useRef(0);
  const snappingRef = useRef(false);

  useEffect(() => {
    if (!isTracking || rawCoordinates.length < 2) {
      if (!isTracking) setSnappedCoordinates([]);
      return;
    }

    const now = Date.now();
    if (now - lastSnapTimeRef.current < SNAP_INTERVAL_MS) return;
    if (snappingRef.current) return;

    lastSnapTimeRef.current = now;
    snappingRef.current = true;

    let cancelled = false;
    snapToRoads(rawCoordinates)
      .then((snapped) => {
        if (!cancelled && snapped && snapped.length > 0) {
          setSnappedCoordinates(snapped);
        }
      })
      .catch(() => {})
      .finally(() => {
        snappingRef.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, [rawCoordinates, isTracking]);

  // Si hay coordenadas snapped, usarlas. Si no, usar raw.
  return snappedCoordinates.length > 0 ? snappedCoordinates : rawCoordinates;
};
