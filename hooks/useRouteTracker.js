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
import { AppState, Platform } from 'react-native';
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
import { setTrackingPrivacy } from '../services/trackingPrivacy';

const STORAGE_KEY = '@rollemos_routes';

// Estados del tracker
export const TRACKER_STATUS = {
  IDLE: 'idle',
  TRACKING: 'tracking',
  PAUSED: 'paused',
};

export const useRouteTracker = (options = {}) => {
  const { isPrivateTracking = false, skipRestore = false } = options;
  const user = useAppStore((state) => state.user);

  // Estados
  const [status, setStatus] = useState(TRACKER_STATUS.IDLE);
  const [routePointCount, setRoutePointCount] = useState(0);
  const [duration, setDuration] = useState(0); // en segundos
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState(null);
  const [authUid, setAuthUid] = useState(null);

  // Estado combinado para datos de tracking (evita múltiples re-renders)
  const [trackingData, setTrackingData] = useState({
    currentLocation: null,
    routeCoordinates: [],
    distance: 0,
    speed: 0,
    avgSpeed: 0,
    maxSpeed: 0,
    calories: 0,
  });

  // Destructuring para compatibilidad con el código existente
  const { currentLocation, routeCoordinates, distance, speed, avgSpeed, maxSpeed, calories } = trackingData;
  const isStoppingRef = useRef(false);

  // Refs para tracking
  const locationSubscription = useRef(null);
  const startTime = useRef(null);
  const timerInterval = useRef(null);
  const speedHistory = useRef([]);
  const speedSumRef = useRef(0);
  const speedCountRef = useRef(0);
  const lastLiveUpdateRef = useRef(0);
  const lastPersistRef = useRef(0);
  const lastStatsUpdateRef = useRef(0);
  const authUserIdRef = useRef(null);
  const inactivityCheckInterval = useRef(null);
  const liveHeartbeatInterval = useRef(null);
  const lastMovementTime = useRef(Date.now());
  const totalPausedMsRef = useRef(0);
  const pausedAtRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const routeCoordinatesRef = useRef([]);
  const routeCoordinatesFullRef = useRef([]);
  const distanceRef = useRef(0);
  const avgSpeedRef = useRef(0);
  const maxSpeedRef = useRef(0);
  const caloriesRef = useRef(0);
  const currentLocationRef = useRef(null);
  const lastUiUpdateRef = useRef(0);
  const isPrivateTrackingRef = useRef(isPrivateTracking);

  useEffect(() => {
    routeCoordinatesRef.current = routeCoordinates;
  }, [routeCoordinates]);

  const buildReducedCoordinates = useCallback((fullCoords) => {
    const maxPoints = 500;
    if (!Array.isArray(fullCoords) || fullCoords.length <= maxPoints) {
      return fullCoords;
    }
    const step = Math.ceil(fullCoords.length / maxPoints);
    const reduced = fullCoords.filter((_, index) => index % step === 0);
    const last = fullCoords[fullCoords.length - 1];
    if (last && reduced[reduced.length - 1] !== last) {
      reduced.push(last);
    }
    return reduced;
  }, []);

  useEffect(() => {
    distanceRef.current = distance;
  }, [distance]);

  useEffect(() => {
    avgSpeedRef.current = avgSpeed;
  }, [avgSpeed]);

  useEffect(() => {
    maxSpeedRef.current = maxSpeed;
  }, [maxSpeed]);

  useEffect(() => {
    caloriesRef.current = calories;
  }, [calories]);

  useEffect(() => {
    isPrivateTrackingRef.current = isPrivateTracking;
  }, [isPrivateTracking]);


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
      if (isPrivateTracking) {
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
    [isPrivateTracking, user]
  );

  const startLiveHeartbeat = useCallback(() => {
    if (liveHeartbeatInterval.current) return;
    liveHeartbeatInterval.current = setInterval(() => {
      if (isStoppingRef.current) return;
      if (isPrivateTrackingRef.current) return;
      const latest = currentLocationRef.current;
      if (latest) {
        sendLiveUpdate(latest, true);
      }
    }, 10000);
  }, [sendLiveUpdate]);

  const stopLiveHeartbeat = useCallback(() => {
    if (!liveHeartbeatInterval.current) return;
    clearInterval(liveHeartbeatInterval.current);
    liveHeartbeatInterval.current = null;
  }, []);

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
    [trackingData]
  );

  const startLocationWatcher = useCallback(async () => {
    if (locationSubscription.current) return;

    const persistIntervalMs = Platform.OS === 'android' ? 180000 : 30000;
    const statsIntervalMs = Platform.OS === 'android' ? 8000 : 0;
    const liveUpdateIntervalMs = Platform.OS === 'android' ? 12000 : 2000;
    const uiUpdateIntervalMs = Platform.OS === 'android' ? 3000 : 2000;
    const watchOptions =
      Platform.OS === 'android'
        ? {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 3000,
            distanceInterval: 8,
          }
        : {
            accuracy: Location.Accuracy.High,
            timeInterval: 2000,
            distanceInterval: 5,
          };

    locationSubscription.current = await Location.watchPositionAsync(
      watchOptions,
      (location) => {
        try {
          if (isStoppingRef.current) return;
          const newCoord = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: Date.now(),
            speed: location.coords.speed,
          };
          currentLocationRef.current = newCoord;

          const prevFullCoords = routeCoordinatesFullRef.current;
          if (prevFullCoords.length === 0) {
            const seeded = [newCoord];
            routeCoordinatesFullRef.current = seeded;
            setRoutePointCount(1);
            const reduced = buildReducedCoordinates(seeded);
            routeCoordinatesRef.current = reduced;
            setTrackingData(prev => ({
              ...prev,
              currentLocation: newCoord,
              routeCoordinates: reduced,
            }));
            lastUiUpdateRef.current = Date.now();
            if (!isPrivateTrackingRef.current) {
              sendLiveUpdate(newCoord, true);
            }
            return;
          }

          const lastCoord = prevFullCoords[prevFullCoords.length - 1];
          const distanceFromLast = calculateDistance(
            lastCoord.latitude,
            lastCoord.longitude,
            newCoord.latitude,
            newCoord.longitude,
          );

          if (distanceFromLast > MIN_MOVEMENT_DISTANCE) {
            lastMovementTime.current = Date.now();
            updateLastMovement().catch(console.error);

            const now = Date.now();
            const nextDistance = distanceRef.current + distanceFromLast;
            distanceRef.current = nextDistance;

            const speedMps = location.coords.speed || 0;
            const speedKmh = speedMps * 3.6;

            speedSumRef.current += speedKmh;
            speedCountRef.current += 1;
            const avgSpd = speedSumRef.current / speedCountRef.current;
            avgSpeedRef.current = avgSpd;

            const nextMaxSpeed = Math.max(maxSpeedRef.current, speedKmh);
            maxSpeedRef.current = nextMaxSpeed;

            if (
              statsIntervalMs === 0 ||
              now - lastStatsUpdateRef.current >= statsIntervalMs
            ) {
              lastStatsUpdateRef.current = now;
              const durationMinutes = computeElapsedSeconds(now) / 60;
              const nextCalories = calculateCalories(durationMinutes, avgSpd);
              caloriesRef.current = nextCalories;
            }

            const nextFullCoords = [...prevFullCoords, newCoord];
            routeCoordinatesFullRef.current = nextFullCoords;
            setRoutePointCount(nextFullCoords.length);

            // Optimización: Solo recalcular reduction cada 50 puntos nuevos
            const shouldRecalculateReduction =
              nextFullCoords.length % 50 === 0 || nextFullCoords.length <= 50;
            const reduced = shouldRecalculateReduction
              ? buildReducedCoordinates(nextFullCoords)
              : [...routeCoordinatesRef.current, newCoord];
            routeCoordinatesRef.current = reduced;

            const shouldUpdateUi =
              uiUpdateIntervalMs === 0 ||
              now - lastUiUpdateRef.current >= uiUpdateIntervalMs;

            if (shouldUpdateUi) {
              lastUiUpdateRef.current = now;
              // Un solo setState para evitar múltiples re-renders
              setTrackingData({
                currentLocation: newCoord,
                routeCoordinates: reduced,
                distance: nextDistance,
                speed: speedKmh,
                avgSpeed: avgSpd,
                maxSpeed: nextMaxSpeed,
                calories: caloriesRef.current,
              });
            }

            if (now - lastLiveUpdateRef.current > liveUpdateIntervalMs) {
              lastLiveUpdateRef.current = now;
              sendLiveUpdate(newCoord, true);
            }

            if (now - lastPersistRef.current > persistIntervalMs) {
              lastPersistRef.current = now;
              persistTrackingState({
                routeCoordinates: nextFullCoords,
                distance: nextDistance,
                avgSpeed: avgSpd,
                maxSpeed: nextMaxSpeed,
                calories: caloriesRef.current,
              }).catch(console.error);
            }
          }
        } catch (watchErr) {
          console.error("Error en watcher de ubicación:", watchErr);
        }
      },
      (error) => {
        console.error("Error en watchPositionAsync:", error);
        setError(`Error de GPS: ${error.message}`);
      },
    );
    startLiveHeartbeat();
    const latest = currentLocationRef.current;
    if (latest && !isPrivateTrackingRef.current) {
      sendLiveUpdate(latest, true);
    }
  }, [
    calculateCalories,
    calculateDistance,
    computeElapsedSeconds,
    persistTrackingState,
    sendLiveUpdate,
    startLiveHeartbeat,
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
    if (isStoppingRef.current || status === TRACKER_STATUS.IDLE) {
      return;
    }

    if (authUserIdRef.current) {
      await markTrackingInactive(authUserIdRef.current);
    }

    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    stopLiveHeartbeat();

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
  }, [status, stopTimer, syncDuration]);



  /**
   * 🔄 Manejar cambios de estado de la app (background/foreground)
   * Cuando la app vuelve al foreground, verificar si el tracking debe detenerse
   */
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (isStoppingRef.current) return;
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
          if (check.inactiveMinutes > 0) {
            console.log(
              `Auto-pausa por inactividad (${check.inactiveMinutes} min)`,
            );
          }
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
  }, [autoPauseTracking, persistTrackingState, status, syncDuration]);



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
    stopLiveHeartbeat();

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
    setTrackingData({
      currentLocation: null,
      routeCoordinates: [],
      distance: 0,
      speed: 0,
      avgSpeed: 0,
      maxSpeed: 0,
      calories: 0,
    });
    setDuration(0);
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
      if (isStoppingRef.current || status !== TRACKER_STATUS.TRACKING) {
        return;
      }
      const lastMove = await getLastMovement();
      const now = Date.now();
      const pauseAt = lastMove ? lastMove + INACTIVITY_TIMEOUT : now;
      
      if (now >= pauseAt) {
        console.log('?? Inactividad detectada por timer interno');
        setError('Tracking pausado: 20 minutos sin movimiento');
        await autoPauseTracking(pauseAt);
      }
    }, 60000); // Cada 60 segundos
  }, [autoPauseTracking, status]);
  // useEffect de authUid+currentLocation ELIMINADO - el watcher ya maneja los updates

  // useEffect de privacidad - SOLO reacciona a cambios de isPrivateTracking
  useEffect(() => {
    setTrackingPrivacy(isPrivateTracking);
    if (isStoppingRef.current) return;

    if (isPrivateTracking && authUserIdRef.current) {
      // Marcar como inactivo cuando se activa modo privado
      markTrackingInactive(authUserIdRef.current);
      stopLiveHeartbeat();
    }
    // Cuando se desactiva privacidad, el watcher enviará el update en el próximo ciclo
  }, [isPrivateTracking, stopLiveHeartbeat]);

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
    console.log('Iniciando tracking...');
    isStoppingRef.current = false;

    try {
      const cleanupStartFailure = async () => {
        if (locationSubscription.current) {
          locationSubscription.current.remove();
          locationSubscription.current = null;
        }
        stopLiveHeartbeat();
        if (inactivityCheckInterval.current) {
          clearInterval(inactivityCheckInterval.current);
          inactivityCheckInterval.current = null;
        }
        await stopBackgroundTracking();
        setStatus(TRACKER_STATUS.IDLE);
        stopTimer();
      };

      if (!authUserIdRef.current) {
        console.log('tracking_live: sin sesion activa, no se puede iniciar tracking');
        setError('Debes iniciar sesion para compartir tu ubicacion.');
        return { success: false };
      }

      const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        const granted = await requestLocationPermission();
        if (!granted) {
          setError('No hay permisos de ubicacion. Por favor habilita la ubicacion en la configuracion.');
          console.error('Permisos denegados');
          await cleanupStartFailure();
          return { success: false };
        }
      }

      setStatus(TRACKER_STATUS.TRACKING);
      console.log('[useRouteTracker] status -> tracking');
      startTime.current = Date.now();
      totalPausedMsRef.current = 0;
      pausedAtRef.current = null;
      setDuration(0);
      speedSumRef.current = 0;
      speedCountRef.current = 0;
      startTimer();

      let lastKnownCoord = null;
      try {
        const lastKnown = await Location.getLastKnownPositionAsync({
          maxAge: 60000,
          requiredAccuracy: 100,
        });
        if (lastKnown?.coords) {
          lastKnownCoord = {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
            timestamp: Date.now(),
          };
          currentLocationRef.current = lastKnownCoord;
          routeCoordinatesFullRef.current = [lastKnownCoord];
          setRoutePointCount(1);
          const reduced = buildReducedCoordinates(routeCoordinatesFullRef.current);
          routeCoordinatesRef.current = reduced;
          setTrackingData(prev => ({
            ...prev,
            currentLocation: lastKnownCoord,
            routeCoordinates: reduced,
          }));
          lastLiveUpdateRef.current = Date.now();
          lastMovementTime.current = Date.now();
          // sendLiveUpdate(lastKnownCoord, true);
        }
      } catch (lastKnownError) {
        console.log('Error leyendo ultima ubicacion:', lastKnownError);
      }

      const bgResult = await startBackgroundTracking(authUserIdRef.current);
      if (bgResult?.foregroundOnly) {
        console.log('Modo foreground-only activo (Expo Go o sin permisos background)');
      }

      console.log('Obteniendo ubicacion inicial...');
      let location;
      try {
        location = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.BestForNavigation,
            timeoutMillis: 8000,
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout obteniendo ubicacion')), 12000)
          ),
        ]);
      } catch (locError) {
        console.warn('Ubicacion inicial fallo, intentando fallback:', locError.message);
        try {
          location = await Location.getLastKnownPositionAsync({
            maxAge: 60000,
            requiredAccuracy: 100,
          });
        } catch (fallbackError) {
          console.error('Error obteniendo ubicacion (fallback):', fallbackError.message);
        }

        if (!location) {
          console.error('Error obteniendo ubicacion:', locError.message);
          setError(`Error de ubicacion: ${locError.message}`);
          await cleanupStartFailure();
          return { success: false };
        }
      }
      if (!location || !location.coords) {
        setError('No se pudo obtener la ubicacion. Verifica que el GPS este habilitado.');
        console.error('Ubicacion invalida');
        await cleanupStartFailure();
        return { success: false };
      }

      const initialCoord = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: Date.now(),
      };
      currentLocationRef.current = initialCoord;

      const seededCoords = lastKnownCoord ? [lastKnownCoord, initialCoord] : [initialCoord];
      routeCoordinatesFullRef.current = seededCoords;
      setRoutePointCount(seededCoords.length);
      const reduced = buildReducedCoordinates(seededCoords);
      routeCoordinatesRef.current = reduced;
      setTrackingData(prev => ({
        ...prev,
        currentLocation: initialCoord,
        routeCoordinates: reduced,
      }));
      lastUiUpdateRef.current = Date.now();
      lastLiveUpdateRef.current = Date.now();
      lastMovementTime.current = Date.now();
      sendLiveUpdate(initialCoord, true);

      await persistTrackingState({
        isPaused: false,
        pausedAt: null,
        totalPausedMs: totalPausedMsRef.current,
        routeCoordinates: seededCoords,
      });
      await updateLastMovement();

      startInactivityCheck();

      try {
        await startLocationWatcher();
      } catch (watchError) {
        console.error('Error iniciando watcher:', watchError);
        setError(`Error iniciando tracking: ${watchError.message}`);
        await cleanupStartFailure();
        return { success: false };
      }

      console.log('Tracking iniciado correctamente');
      return { success: true };
    } catch (err) {
      console.error('Error general en startTracking:', err);
      setError(`Error: ${err.message}`);
      await stopBackgroundTracking();
      setStatus(TRACKER_STATUS.IDLE);
      stopTimer();
      return { success: false };
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
    startTimer,
    stopTimer,
  ]);

  const pauseTracking = useCallback(async () => {
    if (status !== TRACKER_STATUS.TRACKING) return;
    console.log('[useRouteTracker] pausing');
    const now = Date.now();
    await autoPauseTracking(now);
    await persistTrackingState({
      isPaused: true,
      pausedAt: now,
      totalPausedMs: totalPausedMsRef.current,
    });
  }, [autoPauseTracking, persistTrackingState, status]);

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
  }, [trackingData, startInactivityCheck, startLocationWatcher, startTimer]);

  /**
   * ?? Detener tracking y guardar ruta
   */
  const stopTracking = useCallback(async () => {
    if (isStoppingRef.current) {
      return null;
    }
    isStoppingRef.current = true;
    try {
      console.log('[useRouteTracker] stopTracking begin', {
        status,
        coords: routeCoordinates.length,
        distance,
      });
      let savedRoute = null;
      const fullCoords = routeCoordinatesFullRef.current;
      const lastCoord = currentLocation || fullCoords[fullCoords.length - 1];
      if (lastCoord) {
        await sendLiveUpdate(lastCoord, false);
      }
      console.log('Deteniendo tracking...');

    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    stopLiveHeartbeat();

      stopTimer();

      if (inactivityCheckInterval.current) {
        clearInterval(inactivityCheckInterval.current);
        inactivityCheckInterval.current = null;
      }

      if (fullCoords.length > 10 && distance > 100) {
        savedRoute = await saveRoute();
      }

      setStatus(TRACKER_STATUS.IDLE);
      console.log('[useRouteTracker] status -> idle');
      routeCoordinatesFullRef.current = [];
      routeCoordinatesRef.current = [];
      setRoutePointCount(0);
      setDuration(0);
      // Resetear todos los datos de tracking en un solo setState
      setTrackingData({
        currentLocation: null,
        routeCoordinates: [],
        distance: 0,
        speed: 0,
        avgSpeed: 0,
        maxSpeed: 0,
        calories: 0,
      });
      distanceRef.current = 0;
      avgSpeedRef.current = 0;
      maxSpeedRef.current = 0;
      caloriesRef.current = 0;
      speedHistory.current = [];
      speedSumRef.current = 0;
      speedCountRef.current = 0;
      startTime.current = null;
      totalPausedMsRef.current = 0;
      pausedAtRef.current = null;
      lastMovementTime.current = Date.now();

      await stopBackgroundTracking();
      await clearTrackingState();

      console.log('Tracking detenido');
      return savedRoute;
    } finally {
      setTimeout(() => {
        isStoppingRef.current = false;
      }, 500);
    }
  }, [trackingData, sendLiveUpdate, saveRoute, stopTimer]);

  const saveRoute = useCallback(async () => {
    try {
      const realDuration = computeElapsedSeconds();
      setDuration(realDuration);
      const fullCoords = routeCoordinatesFullRef.current;
      if (!fullCoords.length) {
        return null;
      }
      const route = {
        id: Date.now().toString(),
        userId: user?.id || 'guest',
        coordinates: fullCoords,
        distance: distance,
        duration: realDuration,
        avgSpeed: avgSpeed,
        maxSpeed: maxSpeed,
        calories: calories,
        date: new Date().toISOString(),
        startPoint: fullCoords[0],
        endPoint: fullCoords[fullCoords.length - 1],
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
  }, [user, distance, avgSpeed, maxSpeed, calories, computeElapsedSeconds]);

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
      if (skipRestore) return;
      if (isStoppingRef.current) return;
      const state = await getTrackingState();
      if (!state?.isActive || !state.startTime) return;

      startTime.current = state.startTime;
      totalPausedMsRef.current = state.totalPausedMs || 0;
      pausedAtRef.current = state.isPaused ? state.pausedAt || state.savedAt : null;

      // Restaurar refs
      let reduced = [];
      if (state.routeCoordinates && Array.isArray(state.routeCoordinates)) {
        routeCoordinatesFullRef.current = state.routeCoordinates;
        setRoutePointCount(state.routeCoordinates.length);
        reduced = buildReducedCoordinates(state.routeCoordinates);
        routeCoordinatesRef.current = reduced;
      }
      if (state.distance != null) distanceRef.current = state.distance;
      if (state.avgSpeed != null) avgSpeedRef.current = state.avgSpeed;
      if (state.maxSpeed != null) maxSpeedRef.current = state.maxSpeed;
      if (state.calories != null) caloriesRef.current = state.calories;
      if (state.lastLocation) currentLocationRef.current = state.lastLocation;

      // Un solo setState para restaurar todos los datos
      setTrackingData({
        currentLocation: state.lastLocation || null,
        routeCoordinates: reduced,
        distance: state.distance || 0,
        speed: 0,
        avgSpeed: state.avgSpeed || 0,
        maxSpeed: state.maxSpeed || 0,
        calories: state.calories || 0,
      });

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
  }, [autoPauseTracking, checkOrphanedTracking, computeElapsedSeconds, skipRestore, startLocationWatcher, startTimer]);

  /**
   * 🧹 Limpiar en unmount
   */
  useEffect(() => {
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      stopLiveHeartbeat();
      stopTimer();
    };
  }, [stopLiveHeartbeat, stopTimer]);

  return {
    // Estados
    status,
    currentLocation,
    routeCoordinates,
    routePointCount,
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
