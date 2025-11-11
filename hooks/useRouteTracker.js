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

  // Refs para tracking
  const locationSubscription = useRef(null);
  const startTime = useRef(null);
  const timerInterval = useRef(null);
  const speedHistory = useRef([]);

  /**
   * 📍 Solicitar permisos de ubicación
   */
  const requestLocationPermission = useCallback(async () => {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        setError('Permiso de ubicación denegado');
        return false;
      }

      // Solicitar permiso de background para tracking continuo
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      setHasPermission(true);
      console.log('✅ Permisos de ubicación concedidos');
      return true;
    } catch (err) {
      console.error('❌ Error solicitando permisos:', err);
      setError(err.message);
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

    // Verificar permisos
    const granted = hasPermission || (await requestLocationPermission());
    if (!granted) {
      setError('No hay permisos de ubicación');
      return;
    }

    try {
      // Obtener ubicación inicial
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const initialCoord = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: Date.now(),
      };

      setCurrentLocation(initialCoord);
      setRouteCoordinates([initialCoord]);
      setStatus(TRACKER_STATUS.TRACKING);
      startTime.current = Date.now();

      // Iniciar contador de tiempo
      timerInterval.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      // Suscribirse a actualizaciones de ubicación
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000, // Actualizar cada segundo
          distanceInterval: 5, // O cada 5 metros
        },
        (location) => {
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

              return [...prev, newCoord];
            }

            return prev;
          });
        }
      );

      console.log('✅ Tracking iniciado');
    } catch (err) {
      console.error('❌ Error iniciando tracking:', err);
      setError(err.message);
      setStatus(TRACKER_STATUS.IDLE);
    }
  }, [hasPermission, requestLocationPermission, calculateDistance, calculateCalories, maxSpeed]);

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
  }, [routeCoordinates, distance]);

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
