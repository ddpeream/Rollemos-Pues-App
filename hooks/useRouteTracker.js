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
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../config/supabase';
import { upsertTrackingLive } from '../services/tracking';
import {
  startBackgroundTracking,
  stopBackgroundTracking,
} from "../services/backgroundTracking";
import {
  saveTrackingState,
  getTrackingState,
  clearTrackingState,
  updateLastMovement,
  getLastMovement,
  checkOrphanedTracking,
  markTrackingInactive,
  pauseTrackingState,
  INACTIVITY_TIMEOUT,
  MIN_MOVEMENT_DISTANCE,
} from '../services/trackingAutoStop';

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
  const lastPersistRef = useRef(0);
  const authUserIdRef = useRef(null);
  const inactivityCheckInterval = useRef(null);
  const lastMovementTime = useRef(Date.now());
  const totalPausedMsRef = useRef(0);
  const pausedAtRef = useRef(null);
  const appState = useRef(AppState.currentState);

  const computeElapsedSeconds = useCallback((now = Date.now()) => {
    if (!startTime.current) return 0;
    let pausedMs = totalPausedMsRef.current;
    if (pausedAtRef.current) {
      pausedMs += now - pausedAtRef.current;
    }
    const elapsedMs = now - startTime.current - pausedMs;
    return Math.max(0, Math.floor(elapsedMs / 1000));
  }, []);

  const stopTimer = useCallback(() => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerInterval.current = setInterval(() => {
      setDuration(computeElapsedSeconds());
    }, 1000);
  }, [computeElapsedSeconds, stopTimer]);

  const syncDuration = useCallback(() => {
    setDuration(computeElapsedSeconds());
  }, [computeElapsedSeconds]);

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

  const persistTrackingState = useCallback(
    async (options = {}) => {
      if (!authUserIdRef.current || !startTime.current) return;

      await saveTrackingState(authUserIdRef.current, startTime.current, currentLocation, {
        isPaused: options.isPaused ?? false,
        pausedAt: options.pausedAt ?? null,
        totalPausedMs: options.totalPausedMs ?? totalPausedMsRef.current,
        routeCoordinates: options.routeCoordinates ?? routeCoordinates,
        distance: options.distance ?? distance,
        avgSpeed: options.avgSpeed ?? avgSpeed,
        maxSpeed: options.maxSpeed ?? maxSpeed,
        calories: options.calories ?? calories,
      });
    },
    [avgSpeed, calories, currentLocation, distance, maxSpeed, routeCoordinates]
  );

  const startLocationWatcher = useCallback(async () => {
    if (locationSubscription.current) return;

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 5,
      },
      (location) => {
        try {
          const newCoord = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: Date.now(),
            speed: location.coords.speed,
          };

          setCurrentLocation(newCoord);

          setRouteCoordinates((prev) => {
            if (prev.length === 0) return [newCoord];

            const lastCoord = prev[prev.length - 1];
            const distanceFromLast = calculateDistance(
              lastCoord.latitude,
              lastCoord.longitude,
              newCoord.latitude,
              newCoord.longitude
            );

            if (distanceFromLast > 3) {
              lastMovementTime.current = Date.now();
              updateLastMovement().catch(console.error);

              setDistance((prevDist) => prevDist + distanceFromLast);

              const speedMps = location.coords.speed || 0;
              const speedKmh = speedMps * 3.6;
              setSpeed(speedKmh);

              speedHistory.current.push(speedKmh);
              const avgSpd =
                speedHistory.current.reduce((a, b) => a + b, 0) /
                speedHistory.current.length;
              setAvgSpeed(avgSpd);

              if (speedKmh > maxSpeed) {
                setMaxSpeed(speedKmh);
              }

              const durationMinutes = computeElapsedSeconds(Date.now()) / 60;
              setCalories(calculateCalories(durationMinutes, avgSpd));

              const now = Date.now();
              if (now - lastLiveUpdateRef.current > 2000) {
                lastLiveUpdateRef.current = now;
                sendLiveUpdate(newCoord, true);
              }

              if (now - lastPersistRef.current > 10000) {
                lastPersistRef.current = now;
                persistTrackingState({
                  routeCoordinates: [...prev, newCoord],
                  distance: distance + distanceFromLast,
                  avgSpeed: avgSpd,
                  maxSpeed: Math.max(maxSpeed, speedKmh),
                  calories: calculateCalories(durationMinutes, avgSpd),
                }).catch(console.error);
              }

              return [...prev, newCoord];
            }

            return prev;
          });
        } catch (watchErr) {
          console.error('? Error en watcher de ubicaci¢n:', watchErr);
        }
      },
      (error) => {
        console.error('? Error en watchPositionAsync:', error);
        setError(`Error de GPS: ${error.message}`);
      }
    );
  }, [
    calculateCalories,
    calculateDistance,
    computeElapsedSeconds,
    distance,
    maxSpeed,
    persistTrackingState,
    sendLiveUpdate,
  ]);
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

  /**
   * ?? Auto-pausar tracking por inactividad
   */
  const autoPauseTracking = useCallback(async (pauseAt) => {
    console.log('?? Auto-pausando tracking...');

    if (authUserIdRef.current) {
      await markTrackingInactive(authUserIdRef.current);
    }

    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }

    // Detener timer
    stopTimer();

    // Detener chequeo de inactividad
    if (inactivityCheckInterval.current) {
      clearInterval(inactivityCheckInterval.current);
      inactivityCheckInterval.current = null;
    }

    await stopBackgroundTracking();

    const effectivePauseAt = pauseAt || Date.now();
    pausedAtRef.current = effectivePauseAt;
    setStatus(TRACKER_STATUS.PAUSED);
    await pauseTrackingState(effectivePauseAt);
    syncDuration();

    console.log('? Tracking auto-pausado');
  }, [stopTimer, syncDuration]);



  /**
   * 🔄 Manejar cambios de estado de la app (background/foreground)
   * Cuando la app vuelve al foreground, verificar si el tracking debe detenerse
   */
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      console.log(`?? AppState: ${appState.current} -> ${nextAppState}`);

      // Cuando la app vuelve al foreground
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        (status === TRACKER_STATUS.TRACKING || status === TRACKER_STATUS.PAUSED)
      ) {
        console.log('?? App volvio al foreground, verificando inactividad...');
        syncDuration();

        const check = status === TRACKER_STATUS.TRACKING
          ? await checkOrphanedTracking()
          : null;

        if (check && check.shouldStop) {
          console.log(`?? Auto-pausa por inactividad (${check.inactiveMinutes} min)`);
          setError(`Tracking pausado automaticamente por ${check.inactiveMinutes} minutos de inactividad`);

          // Pausar tracking automaticamente
          await autoPauseTracking(check.pauseAt);
        }
      }

      // Cuando la app va al background, guardar el estado
      if (nextAppState.match(/inactive|background/) && (status === TRACKER_STATUS.TRACKING || status === TRACKER_STATUS.PAUSED)) {
        console.log('?? App yendo al background, guardando estado...');
        await persistTrackingState({
          isPaused: status === TRACKER_STATUS.PAUSED,
          pausedAt: pausedAtRef.current,
          totalPausedMs: totalPausedMsRef.current,
        });
      }

      appState.current = nextAppState;
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [autoPauseTracking, currentLocation, persistTrackingState, status, syncDuration]);



  /**
   * 🛑 Auto-stop tracking por inactividad
   */
  const autoStopTracking = useCallback(async () => {
    console.log('🛑 Auto-deteniendo tracking...');

    // Marcar como inactivo en Supabase
    if (authUserIdRef.current) {
      await markTrackingInactive(authUserIdRef.current);
    }

    // Limpiar suscripción de ubicación
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }

    // Detener timer
    stopTimer();

    // Detener chequeo de inactividad
    if (inactivityCheckInterval.current) {
      clearInterval(inactivityCheckInterval.current);
      inactivityCheckInterval.current = null;
    }

    await stopBackgroundTracking();
    await clearTrackingState();

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
    totalPausedMsRef.current = 0;
    pausedAtRef.current = null;
    lastMovementTime.current = Date.now();

    console.log('✅ Tracking auto-detenido');
  }, []);

  /**
   * ⏱️ Verificar inactividad periódicamente mientras se trackea
   */
  const startInactivityCheck = useCallback(() => {
    // Verificar cada minuto
    if (inactivityCheckInterval.current) {
      clearInterval(inactivityCheckInterval.current);
    }

    inactivityCheckInterval.current = setInterval(async () => {
      const lastMove = await getLastMovement();
      const now = Date.now();
      const pauseAt = lastMove ? lastMove + INACTIVITY_TIMEOUT : now;
      
      if (now >= pauseAt) {
        console.log('?? Inactividad detectada por timer interno');
        setError('Tracking pausado: 20 minutos sin movimiento');
        await autoPauseTracking(pauseAt);
      }
    }, 60000); // Cada 60 segundos
  }, [autoPauseTracking]);
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

      // IMPORTANTE: Verificar permisos ANTES de iniciar background tracking (requerido por iOS)
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

      // Iniciar background tracking después de verificar permisos
      // En Expo Go, esto retornará { foregroundOnly: true } y no fallará
      const bgResult = await startBackgroundTracking(authUserIdRef.current);
      if (bgResult?.foregroundOnly) {
        console.log('📱 Modo foreground-only activo (Expo Go o sin permisos background)');
      }

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
      totalPausedMsRef.current = 0;
      pausedAtRef.current = null;
      setDuration(0);
      lastLiveUpdateRef.current = Date.now();
      lastMovementTime.current = Date.now();
      sendLiveUpdate(initialCoord, true);

      // 💾 Guardar estado del tracking para detectar cierre de app
      await persistTrackingState({
        isPaused: false,
        pausedAt: null,
        totalPausedMs: totalPausedMsRef.current,
        routeCoordinates: [initialCoord],
      });
      await updateLastMovement();

      // ⏱️ Iniciar verificación de inactividad
      startInactivityCheck();

      // Iniciar contador de tiempo
      startTimer();

      // Suscribirse a actualizaciones de ubicacion
      try {
        await startLocationWatcher();
      } catch (watchError) {
        console.error('? Error iniciando watcher:', watchError);
        setError(`Error iniciando tracking: ${watchError.message}`);
        setStatus(TRACKER_STATUS.IDLE);
      }

      console.log('✅ Tracking iniciado correctamente');
    } catch (err) {
      console.error('❌ Error general en startTracking:', err);
      setError(`Error: ${err.message}`);
      setStatus(TRACKER_STATUS.IDLE);
    }
  }, [
    requestLocationPermission,
    calculateDistance,
    calculateCalories,
    maxSpeed,
    sendLiveUpdate,
    computeElapsedSeconds,
    persistTrackingState,
    startLocationWatcher,
  ]);

  /**
   * ⏸️ Pausar tracking
   */
  const pauseTracking = useCallback(() => {
    console.log('?? Pausando tracking...');
    setStatus(TRACKER_STATUS.PAUSED);
    pausedAtRef.current = Date.now();
    syncDuration();

    // Detener timer
    stopTimer();

    saveTrackingState(
      authUserIdRef.current,
      startTime.current,
      currentLocation,
      {
        isPaused: true,
        pausedAt: pausedAtRef.current,
        totalPausedMs: totalPausedMsRef.current,
      }
    ).catch(console.error);
  }, [currentLocation, stopTimer, syncDuration]);

  /**
   * ?? Reanudar tracking
   */
  const resumeTracking = useCallback(async () => {
    console.log('?? Reanudando tracking...');
    setStatus(TRACKER_STATUS.TRACKING);

    if (pausedAtRef.current) {
      totalPausedMsRef.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = null;
    }

    if (authUserIdRef.current) {
      try {
        await startBackgroundTracking(authUserIdRef.current);
      } catch (bgErr) {
        console.warn('?? Error reanudando background tracking:', bgErr.message);
      }
    }

    // Reanudar timer
    startTimer();

    // Reiniciar chequeo de inactividad
    startInactivityCheck();

    if (!locationSubscription.current) {
      try {
        await startLocationWatcher();
      } catch (watchErr) {
        console.error('? Error reanudando watcher:', watchErr);
      }
    }

    saveTrackingState(
      authUserIdRef.current,
      startTime.current,
      currentLocation,
      {
        isPaused: false,
        pausedAt: null,
        totalPausedMs: totalPausedMsRef.current,
      }
    ).catch(console.error);
  }, [currentLocation, startInactivityCheck, startLocationWatcher, startTimer]);

  /**
   * ?? Detener tracking y guardar ruta
   */
  const stopTracking = useCallback(async () => {
    let savedRoute = null;
    const lastCoord = currentLocation || routeCoordinates[routeCoordinates.length - 1];
    if (lastCoord) {
      await sendLiveUpdate(lastCoord, false);
    }
    console.log('?? Deteniendo tracking...');

    // Limpiar suscripcion de ubicacion
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }

    // Detener timer
    stopTimer();

    // Detener verificacion de inactividad
    if (inactivityCheckInterval.current) {
      clearInterval(inactivityCheckInterval.current);
      inactivityCheckInterval.current = null;
    }

    // Guardar ruta si tiene datos significativos
    if (routeCoordinates.length > 10 && distance > 100) {
      savedRoute = await saveRoute();
    }

    await stopBackgroundTracking();

    // Limpiar estado de tracking persistido
    await clearTrackingState();

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
    totalPausedMsRef.current = 0;
    pausedAtRef.current = null;
    lastMovementTime.current = Date.now();

    console.log('? Tracking detenido');
    return savedRoute;
  }, [currentLocation, routeCoordinates, distance, sendLiveUpdate, saveRoute, stopTimer]);

  /**
   * 💾 Guardar ruta en AsyncStorage
   */
  const saveRoute = useCallback(async () => {
    try {
      const realDuration = computeElapsedSeconds();
      setDuration(realDuration);
      const route = {
        id: Date.now().toString(),
        userId: user?.id || 'guest',
        coordinates: routeCoordinates,
        distance: distance,
        duration: realDuration,
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
  }, [user, routeCoordinates, distance, avgSpeed, maxSpeed, calories, computeElapsedSeconds]);

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

  useEffect(() => {
    const restoreTrackingState = async () => {
      const state = await getTrackingState();
      if (!state?.isActive || !state.startTime) return;

      startTime.current = state.startTime;
      totalPausedMsRef.current = state.totalPausedMs || 0;
      pausedAtRef.current = state.isPaused ? state.pausedAt || state.savedAt : null;

      if (state.routeCoordinates && Array.isArray(state.routeCoordinates)) {
        setRouteCoordinates(state.routeCoordinates);
      }
      if (state.distance != null) setDistance(state.distance);
      if (state.avgSpeed != null) setAvgSpeed(state.avgSpeed);
      if (state.maxSpeed != null) setMaxSpeed(state.maxSpeed);
      if (state.calories != null) setCalories(state.calories);
      if (state.lastLocation) setCurrentLocation(state.lastLocation);

      setDuration(computeElapsedSeconds());

      const check = !state.isPaused ? await checkOrphanedTracking() : null;
      if (check && check.shouldStop) {
        setError(`Tracking pausado automaticamente por ${check.inactiveMinutes} minutos de inactividad`);
        await autoPauseTracking(check.pauseAt);
        return;
      }

      setStatus(state.isPaused ? TRACKER_STATUS.PAUSED : TRACKER_STATUS.TRACKING);

      if (!state.isPaused) {
        startTimer();
        try {
          await startLocationWatcher();
        } catch (err) {
          console.error('? Error reanudando watcher:', err);
        }
      }
    };

    restoreTrackingState();
  }, [autoPauseTracking, checkOrphanedTracking, computeElapsedSeconds, startLocationWatcher, startTimer]);

  /**
   * 🧹 Limpiar en unmount
   */
  useEffect(() => {
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      stopTimer();
    };
  }, [stopTimer]);

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

































