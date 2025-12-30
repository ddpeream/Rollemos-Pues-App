/**
 * 🗺️ useRouteTracker Hook
 * 
 * Hook personalizado para tracking de rutas en tiempo real con GPS.
 * 
 * Características:
 * - Geolocalización en tiempo real con alta precisión
 * - Tracking de polyline (dibujar ruta en mapa)
 * - Cálculo de distancia, velocidad, tiempo
 * - Guardar/cargar rutas con AsyncStorage
 * - Estados: IDLE, TRACKING, PAUSED
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../config/supabase';
import { upsertTrackingLive } from '../services/tracking';

const STORAGE_KEY = '@rollemos_routes';

// Estados del tracker
export const TRACKER_STATUS = {
  IDLE: 'idle',
  TRACKING: 'tracking',
  PAUSED: 'paused',
};

export const useRouteTracker = () => {
  const user = useAppStore((state) => state.user);

  // Estados
  const [status, setStatus] = useState(TRACKER_STATUS.IDLE);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [distance, setDistance] = useState(0); // en metros
  const [duration, setDuration] = useState(0); // en segundos
  const [speed, setSpeed] = useState(0); // km/h
  const [avgSpeed, setAvgSpeed] = useState(0); // km/h
  const [maxSpeed, setMaxSpeed] = useState(0); // km/h
  const [calories, setCalories] = useState(0); // kcal estimadas
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState(null);
  const [authUid, setAuthUid] = useState(null);

  // Refs para tracking
  const locationSubscription = useRef(null);
  const startTime = useRef(null);
  const timerInterval = useRef(null);
  const speedHistory = useRef([]);
  const lastLiveUpdateRef = useRef(0);
  const authUserIdRef = useRef(null);

  const sendLiveUpdate = useCallback(
    async (coord, isActive = true) => {
      if (!coord) {
        return;
      }

      try {
        const userId = authUserIdRef.current;
        if (!userId) {
          console.log('?? tracking_live skip: no auth user id');
          return;
        }

        console.log('?? tracking_live upsert:', {
          userId,
          authUid: authUserIdRef.current,
          profileId: user?.id || null,
          lat: coord.latitude,
          lng: coord.longitude,
          isActive,
        });

        const { data: sessionData } = await supabase.auth.getSession();
        console.log('?? tracking_live session uid:', sessionData?.session?.user?.id || null);

        const result = await upsertTrackingLive({
          userId,
          latitude: coord.latitude,
          longitude: coord.longitude,
          speed: coord.speed ?? null,
          heading: coord.heading ?? null,
          isActive,
        });

        if (!result.ok) {
          console.error('❌ tracking_live upsert error:', result.error);
        } else {
          console.log('✅ tracking_live upsert ok');
        }
      } catch (err) {
        console.error('❌ Error updating tracking_live:', err);
      }
    },
    [user]
  );

  useEffect(() => {
    let isMounted = true;

    const loadAuthUserId = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (isMounted) {
          authUserIdRef.current = data?.user?.id || null;
          setAuthUid(authUserIdRef.current);
          console.log('?? tracking_live auth uid:', authUserIdRef.current);
        }
      } catch (err) {
        console.error('Error loading auth user for tracking:', err);
      }
    };

    loadAuthUserId();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (authUid && status === TRACKER_STATUS.TRACKING && currentLocation) {
      sendLiveUpdate(currentLocation, true);
    }
  }, [authUid, status, currentLocation, sendLiveUpdate]);

  /**
   * 📍 Solicitar permisos de ubicación
   */
  const requestLocationPermission = useCallback(async () => {
    try {
      console.log('🔍 Verificando permisos de ubicación...');
      
      // Primero verificar si ya tenemos permisos
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      if (existingStatus === 'granted') {
        setHasPermission(true);
        console.log('✅ Permisos ya concedidos');
        return true;
      }

      // Solicitar permisos foreground
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        setError('Permiso de ubicación denegado. Por favor, habilita la ubicación en la configuración de la app.');
        setHasPermission(false);
        console.log('❌ Permiso foreground denegado');
        return false;
      }

      setHasPermission(true);
      console.log('✅ Permisos de ubicación concedidos');
      
      // Solicitar permiso de background solo si foreground fue concedido (opcional, no bloqueante)
      try {
        await Location.requestBackgroundPermissionsAsync();
      } catch (bgErr) {
        console.log('⚠️ Permiso background no disponible:', bgErr.message);
        // No es crítico, continuar igual
      }
      
      return true;
    } catch (err) {
      console.error('❌ Error solicitando permisos:', err);
      setError(`Error de permisos: ${err.message}`);
      setHasPermission(false);
      return false;
    }
  }, []);

  /**
   * 📏 Calcular distancia entre dos coordenadas (Haversine formula)
   */
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en metros
  }, []);

  /**
   * 🔥 Calcular calorías quemadas (estimación para patinaje)
   * Fórmula: MET (Metabolic Equivalent) * peso * tiempo
   * Patinaje recreacional: 7 MET
   * Patinaje intenso: 9.8 MET
   */
  const calculateCalories = useCallback((durationMinutes, avgSpeedKmh) => {
    const weight = 70; // kg (valor promedio, idealmente vendría del perfil)
    const met = avgSpeedKmh > 15 ? 9.8 : 7; // Intensidad según velocidad
    return (met * weight * (durationMinutes / 60)).toFixed(0);
  }, []);

  /**
   * ▶️ Iniciar tracking
   */
  const startTracking = useCallback(async () => {
    console.log('▶️ Iniciando tracking...');

    try {
      if (!authUserIdRef.current) {
        console.log('?? tracking_live: sin sesion activa, no se puede iniciar tracking');
        setError('Debes iniciar sesion para compartir tu ubicacion.');
        return;
      }

      // Verificar permisos
      const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        const granted = await requestLocationPermission();
        if (!granted) {
          setError('No hay permisos de ubicación. Por favor habilita la ubicación en la configuración.');
          console.error('❌ Permisos denegados');
          return;
        }
      }

      console.log('✅ Permisos verificados');

      // Obtener ubicación inicial con timeout
      // Obtener ubicaci¢n inicial con timeout y fallback
      console.log('?? Obteniendo ubicaci¢n inicial...');
      let location;
      try {
        location = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.BestForNavigation,
            timeoutMillis: 8000,
          }),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Timeout obteniendo ubicaci¢n')),
              12000
            )
          ),
        ]);
      } catch (locError) {
        console.warn('? Ubicaci¢n inicial fall¢, intentando fallback:', locError.message);
        try {
          location = await Location.getLastKnownPositionAsync({
            maxAge: 60000,
            requiredAccuracy: 100,
          });
        } catch (fallbackError) {
          console.error('? Error obteniendo ubicaci¢n (fallback):', fallbackError.message);
        }
      
        if (!location) {
          console.error('? Error obteniendo ubicaci¢n:', locError.message);
          setError(`Error de ubicaci¢n: ${locError.message}`);
          return;
        }
      }
      if (!location || !location.coords) {
        setError('No se pudo obtener la ubicación. Verifica que el GPS esté habilitado.');
        console.error('❌ Ubicación inválida');
        return;
      }

      const initialCoord = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: Date.now(),
      };

      console.log('📍 Ubicación inicial:', initialCoord);

      setCurrentLocation(initialCoord);
      setRouteCoordinates([initialCoord]);
      setStatus(TRACKER_STATUS.TRACKING);
      startTime.current = Date.now();
      lastLiveUpdateRef.current = Date.now();
      sendLiveUpdate(initialCoord, true);

      // Iniciar contador de tiempo
      timerInterval.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      // Suscribirse a actualizaciones de ubicación
      try {
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000, // Actualizar cada segundo
            distanceInterval: 5, // O cada 5 metros
          },
          (location) => {
            try {
              const newCoord = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                timestamp: Date.now(),
                speed: location.coords.speed, // m/s
              };

              setCurrentLocation(newCoord);

              // Agregar a la ruta solo si hay movimiento significativo
              setRouteCoordinates((prev) => {
                if (prev.length === 0) return [newCoord];

                const lastCoord = prev[prev.length - 1];
                const distanceFromLast = calculateDistance(
                  lastCoord.latitude,
                  lastCoord.longitude,
                  newCoord.latitude,
                  newCoord.longitude
                );

                // Solo agregar si se movió más de 3 metros (evitar ruido GPS)
                if (distanceFromLast > 3) {
                  // Actualizar distancia total
                  setDistance((prevDist) => prevDist + distanceFromLast);

                  // Calcular velocidad instantánea
                  const speedMps = location.coords.speed || 0;
                  const speedKmh = speedMps * 3.6;
                  setSpeed(speedKmh);

                  // Actualizar historial de velocidades
                  speedHistory.current.push(speedKmh);
                  const avgSpd =
                    speedHistory.current.reduce((a, b) => a + b, 0) /
                    speedHistory.current.length;
                  setAvgSpeed(avgSpd);

                  // Actualizar velocidad máxima
                  if (speedKmh > maxSpeed) {
                    setMaxSpeed(speedKmh);
                  }

                  // Calcular calorías
                  const durationMinutes = (Date.now() - startTime.current) / 60000;
                  setCalories(calculateCalories(durationMinutes, avgSpd));

                  const now = Date.now();
                  if (now - lastLiveUpdateRef.current > 2000) {
                    lastLiveUpdateRef.current = now;
                    sendLiveUpdate(newCoord, true);
                  }

                  return [...prev, newCoord];
                }

                return prev;
              });
            } catch (watchErr) {
              console.error('❌ Error en watcher de ubicación:', watchErr);
            }
          },
          (error) => {
            console.error('❌ Error en watchPositionAsync:', error);
            setError(`Error de GPS: ${error.message}`);
          }
        );
      } catch (watchError) {
        console.error('❌ Error iniciando watcher:', watchError);
        setError(`Error iniciando tracking: ${watchError.message}`);
        setStatus(TRACKER_STATUS.IDLE);
      }

      console.log('✅ Tracking iniciado correctamente');
    } catch (err) {
      console.error('❌ Error general en startTracking:', err);
      setError(`Error: ${err.message}`);
      setStatus(TRACKER_STATUS.IDLE);
    }
  }, [requestLocationPermission, calculateDistance, calculateCalories, maxSpeed, sendLiveUpdate]);

  /**
   * ⏸️ Pausar tracking
   */
  const pauseTracking = useCallback(() => {
    console.log('⏸️ Pausando tracking...');
    setStatus(TRACKER_STATUS.PAUSED);

    // Detener timer
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
  }, []);

  /**
   * ▶️ Reanudar tracking
   */
  const resumeTracking = useCallback(() => {
    console.log('▶️ Reanudando tracking...');
    setStatus(TRACKER_STATUS.TRACKING);

    // Reanudar timer
    timerInterval.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  /**
   * ⏹️ Detener tracking y guardar ruta
   */
  const stopTracking = useCallback(async () => {
    const lastCoord = currentLocation || routeCoordinates[routeCoordinates.length - 1];
    if (lastCoord) {
      await sendLiveUpdate(lastCoord, false);
    }
    console.log('⏹️ Deteniendo tracking...');

    // Limpiar suscripción de ubicación
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }

    // Detener timer
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }

    // Guardar ruta si tiene datos significativos
    if (routeCoordinates.length > 10 && distance > 100) {
      await saveRoute();
    }

    // Resetear estados
    setStatus(TRACKER_STATUS.IDLE);
    setRouteCoordinates([]);
    setDistance(0);
    setDuration(0);
    setSpeed(0);
    setAvgSpeed(0);
    setMaxSpeed(0);
    setCalories(0);
    speedHistory.current = [];
    startTime.current = null;

    console.log('✅ Tracking detenido');
  }, [currentLocation, routeCoordinates, distance, sendLiveUpdate]);

  /**
   * 💾 Guardar ruta en AsyncStorage
   */
  const saveRoute = useCallback(async () => {
    try {
      const route = {
        id: Date.now().toString(),
        userId: user?.id || 'guest',
        coordinates: routeCoordinates,
        distance: distance,
        duration: duration,
        avgSpeed: avgSpeed,
        maxSpeed: maxSpeed,
        calories: calories,
        date: new Date().toISOString(),
        startPoint: routeCoordinates[0],
        endPoint: routeCoordinates[routeCoordinates.length - 1],
      };

      // Cargar rutas existentes
      const storedRoutes = await AsyncStorage.getItem(STORAGE_KEY);
      const routes = storedRoutes ? JSON.parse(storedRoutes) : [];

      // Agregar nueva ruta
      routes.unshift(route); // Agregar al inicio

      // Guardar (limitar a últimas 50 rutas)
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(routes.slice(0, 50)));

      console.log('✅ Ruta guardada:', route.id);
      return route;
    } catch (err) {
      console.error('❌ Error guardando ruta:', err);
      setError(err.message);
      return null;
    }
  }, [user, routeCoordinates, distance, duration, avgSpeed, maxSpeed, calories]);

  /**
   * 📋 Cargar rutas guardadas
   */
  const loadRoutes = useCallback(async () => {
    try {
      const storedRoutes = await AsyncStorage.getItem(STORAGE_KEY);
      return storedRoutes ? JSON.parse(storedRoutes) : [];
    } catch (err) {
      console.error('❌ Error cargando rutas:', err);
      return [];
    }
  }, []);

  /**
   * 🗑️ Eliminar ruta
   */
  const deleteRoute = useCallback(async (routeId) => {
    try {
      const storedRoutes = await AsyncStorage.getItem(STORAGE_KEY);
      const routes = storedRoutes ? JSON.parse(storedRoutes) : [];
      const filteredRoutes = routes.filter((r) => r.id !== routeId);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRoutes));
      console.log('✅ Ruta eliminada:', routeId);
      return true;
    } catch (err) {
      console.error('❌ Error eliminando ruta:', err);
      return false;
    }
  }, []);

  /**
   * 🧹 Limpiar en unmount
   */
  useEffect(() => {
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  return {
    // Estados
    status,
    currentLocation,
    routeCoordinates,
    distance,
    duration,
    speed,
    avgSpeed,
    maxSpeed,
    calories,
    hasPermission,
    error,

    // Métodos
    requestLocationPermission,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
    saveRoute,
    loadRoutes,
    deleteRoute,
  };
};

export default useRouteTracker;

