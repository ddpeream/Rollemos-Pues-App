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
  consumeBgRouteBuffer,
  clearBgRouteBuffer,
  INACTIVITY_TIMEOUT,
  MIN_MOVEMENT_DISTANCE,
} from '../services/trackingAutoStop';
import { setTrackingPrivacy } from '../services/trackingPrivacy';

const STORAGE_KEY = '@rollemos_routes';
const ROUTES_LIMIT = 50;
const ROUTE_CHUNK_PREFIX = '@rollemos_route_chunks_';
const ROUTE_CHUNK_SIZE = 250;
const ROUTE_PREVIEW_MAX_POINTS = 300;
const UI_MAX_ROUTE_POINTS = 3000;

const toRadians = (value) => (value * Math.PI) / 180;

const normalizeHeading = (value) => {
  if (!Number.isFinite(value)) return null;
  const normalized = ((value % 360) + 360) % 360;
  return normalized;
};

const calculateBearing = (from, to) => {
  if (!from || !to) return null;
  const lat1 = toRadians(from.latitude);
  const lon1 = toRadians(from.longitude);
  const lat2 = toRadians(to.latitude);
  const lon2 = toRadians(to.longitude);
  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const heading = (Math.atan2(y, x) * 180) / Math.PI;
  return normalizeHeading(heading);
};

const angleDelta = (a, b) => {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
};

const buildRoutePreview = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length === 0) return [];
  if (coordinates.length <= ROUTE_PREVIEW_MAX_POINTS) {
    return coordinates.slice();
  }

  const step = Math.ceil(coordinates.length / ROUTE_PREVIEW_MAX_POINTS);
  const preview = coordinates.filter((_, index) => index % step === 0);
  const last = coordinates[coordinates.length - 1];
  if (last && preview[preview.length - 1] !== last) {
    preview.push(last);
  }
  return preview;
};

// Estados del tracker
export const TRACKER_STATUS = {
  IDLE: 'idle',
  TRACKING: 'tracking',
  PAUSED: 'paused',
};

export const useRouteTracker = (options = {}) => {
  const { isPrivateTracking = false, skipRestore = false } = options;

  // 🔎 DEBUG: logs para diagnosticar speed/coords (desactívalo en prod)
  const DEBUG_SPEED = true;

  // Fidelidad de tracking
  const ROUTE_POINT_MIN_DISTANCE_M = 1.5;
  const ROUTE_POINT_MIN_DISTANCE_BG_M = 1.5;
  const STATS_MIN_DISTANCE_M = MIN_MOVEMENT_DISTANCE;
  const TURN_MIN_DISTANCE_M = 1.0;
  const TURN_ANGLE_THRESHOLD_DEG = 12;

  // 🏎️ MV Speed: configuración para velocidad más precisa/estable
  const ACCURACY_GOOD_MAX_M = 15; // si accuracy > esto, no confiamos en speed
  const SPEED_UI_UPDATE_MS = 1000; // frecuencia de update de speed en UI
  const MAX_REASONABLE_SPEED_KMH = 180; // clamp de seguridad (moto/carro)
  const SPEED_EMA_ALPHA = 0.25; // suavizado leve (0..1). Más alto = más reactivo
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
  const lastStatsCoordRef = useRef(null);
  const lastUiUpdateRef = useRef(0);
  const lastMovementPersistRef = useRef(0);
  const isPrivateTrackingRef = useRef(isPrivateTracking);

  // 🏎️ MV Speed refs
  const lastSpeedUiUpdateRef = useRef(0);
  const lastGoodSpeedKmhRef = useRef(0);
  const lastGoodSpeedAtRef = useRef(0);
  const lastGoodCoordForSpeedRef = useRef(null);
  const emaSpeedKmhRef = useRef(null);

  useEffect(() => {
    routeCoordinatesRef.current = routeCoordinates;
  }, [routeCoordinates]);

  const buildReducedCoordinates = useCallback((fullCoords, maxPoints = UI_MAX_ROUTE_POINTS) => {
    if (!Array.isArray(fullCoords) || fullCoords.length <= maxPoints) {
      return fullCoords.slice();
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
      if (!coord) return;
      if (isPrivateTracking) return;

      try {
        const userId = authUserIdRef.current;
        if (!userId) return;

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

  const getRouteChunkKey = useCallback((routeId, index) => {
    return `${ROUTE_CHUNK_PREFIX}${routeId}_${index}`;
  }, []);

  const saveRouteChunks = useCallback(
    async (routeId, coordinates) => {
      if (!routeId || !Array.isArray(coordinates) || coordinates.length === 0) {
        return 0;
      }

      const totalChunks = Math.ceil(coordinates.length / ROUTE_CHUNK_SIZE);
      const pairs = [];

      for (let index = 0; index < totalChunks; index += 1) {
        const start = index * ROUTE_CHUNK_SIZE;
        const end = start + ROUTE_CHUNK_SIZE;
        const chunk = coordinates.slice(start, end);
        pairs.push([getRouteChunkKey(routeId, index), JSON.stringify(chunk)]);
      }

      if (pairs.length > 0) {
        await AsyncStorage.multiSet(pairs);
      }

      return totalChunks;
    },
    [getRouteChunkKey]
  );

  const loadRouteChunks = useCallback(
    async (routeId, chunkCount) => {
      if (!routeId || !Number.isFinite(chunkCount) || chunkCount <= 0) {
        return [];
      }

      const keys = Array.from({ length: chunkCount }, (_, index) =>
        getRouteChunkKey(routeId, index)
      );
      const keyValues = await AsyncStorage.multiGet(keys);

      const points = [];
      keyValues.forEach(([, value]) => {
        if (!value) return;
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            points.push(...parsed);
          }
        } catch (_) {
          // ignore invalid chunk
        }
      });

      return points;
    },
    [getRouteChunkKey]
  );

  const deleteRouteChunks = useCallback(
    async (routeId, chunkCount) => {
      if (!routeId || !Number.isFinite(chunkCount) || chunkCount <= 0) return;
      const keys = Array.from({ length: chunkCount }, (_, index) =>
        getRouteChunkKey(routeId, index)
      );
      await AsyncStorage.multiRemove(keys);
    },
    [getRouteChunkKey]
  );

  const hydrateRouteCoordinates = useCallback(
    async (route) => {
      if (!route) return route;

      if (!route.coordinatesStoredSeparately || !route.coordinateChunks) {
        return {
          ...route,
          coordinates: Array.isArray(route.coordinates) ? route.coordinates : [],
        };
      }

      const fullCoordinates = await loadRouteChunks(route.id, route.coordinateChunks);
      if (fullCoordinates.length === 0) {
        return {
          ...route,
          coordinates: Array.isArray(route.coordinates) ? route.coordinates : [],
        };
      }

      return {
        ...route,
        coordinates: fullCoordinates,
      };
    },
    [loadRouteChunks]
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
    [trackingData]
  );

  const startLocationWatcher = useCallback(async () => {
    if (locationSubscription.current) return;

    const persistIntervalMs = Platform.OS === 'android' ? 180000 : 30000;
    const statsIntervalMs = Platform.OS === 'android' ? 8000 : 0;
    const liveUpdateIntervalMs = Platform.OS === 'android' ? 12000 : 2000;
    const uiUpdateIntervalMs = 1000;
    const watchOptions =
      Platform.OS === 'android'
        ? {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 1,
          }
        : {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 1,
          };

    locationSubscription.current = await Location.watchPositionAsync(
      watchOptions,
      (location) => {
        try {
          if (isStoppingRef.current) return;
          const now = Date.now();

          if (DEBUG_SPEED) {
            const c = location?.coords || {};
            console.log(
              '📍[tracker] raw coords',
              JSON.stringify({
                lat: c.latitude,
                lon: c.longitude,
                speed_mps: c.speed,
                accuracy_m: c.accuracy,
                altAcc_m: c.altitudeAccuracy,
                heading: c.heading,
                ts: Date.now(),
              })
            );
          }

          const coords = location?.coords || {};
          const rawHeading = normalizeHeading(coords.heading);
          const newCoord = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            timestamp: now,
            speed: coords.speed,
            heading: rawHeading,
          };
          currentLocationRef.current = newCoord;

          const prevFullCoords = routeCoordinatesFullRef.current;
          if (prevFullCoords.length === 0) {
            const seeded = [newCoord];
            routeCoordinatesFullRef.current = seeded;
            lastStatsCoordRef.current = newCoord;
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
          const distanceFromLastRoute = calculateDistance(
            lastCoord.latitude,
            lastCoord.longitude,
            newCoord.latitude,
            newCoord.longitude,
          );

          let turnAngle = 0;
          let isTurnPoint = false;
          if (prevFullCoords.length >= 2) {
            const prevCoord = prevFullCoords[prevFullCoords.length - 2];
            const prevBearing = calculateBearing(prevCoord, lastCoord);
            const nextBearing = calculateBearing(lastCoord, newCoord);
            if (newCoord.heading == null && nextBearing != null) {
              newCoord.heading = nextBearing;
            }
            turnAngle = angleDelta(prevBearing, nextBearing);
            isTurnPoint =
              distanceFromLastRoute >= TURN_MIN_DISTANCE_M &&
              turnAngle >= TURN_ANGLE_THRESHOLD_DEG;
          } else if (newCoord.heading == null) {
            newCoord.heading = calculateBearing(lastCoord, newCoord);
          }

          if (newCoord.heading == null && Number.isFinite(lastCoord?.heading)) {
            newCoord.heading = lastCoord.heading;
          }

          const shouldAppendRoute =
            distanceFromLastRoute >= ROUTE_POINT_MIN_DISTANCE_M || isTurnPoint;

          if (DEBUG_SPEED) {
            console.log(
              `📏[tracker] distanceFromLastRoute=${distanceFromLastRoute.toFixed(2)}m` +
                ` routeMin=${ROUTE_POINT_MIN_DISTANCE_M}m` +
                ` statsMin=${STATS_MIN_DISTANCE_M}m` +
                ` turnAngle=${turnAngle.toFixed(1)}°` +
                ` append=${shouldAppendRoute}`
            );
          }

          // 🏎️ MV Speed: estimación de velocidad independiente del filtro de distancia
          const accuracy = typeof coords.accuracy === 'number' ? coords.accuracy : null;
          const rawSpeedMps = typeof coords.speed === 'number' ? coords.speed : null;

          let speedCandidateKmh = null;
          let speedSource = null;

          const accuracyOk = accuracy != null && accuracy <= ACCURACY_GOOD_MAX_M;
          const rawSpeedOk = rawSpeedMps != null && rawSpeedMps >= 0;

          if (accuracyOk && rawSpeedOk) {
            speedCandidateKmh = rawSpeedMps * 3.6;
            speedSource = 'coords.speed';
          } else if (accuracyOk) {
            const prev = lastGoodCoordForSpeedRef.current;
            if (prev?.latitude != null && prev?.longitude != null && prev?.timestamp) {
              const dtSeconds = Math.max(0, (now - prev.timestamp) / 1000);
              if (dtSeconds > 0) {
                const dMeters = calculateDistance(
                  prev.latitude,
                  prev.longitude,
                  newCoord.latitude,
                  newCoord.longitude,
                );
                const mps = dMeters / dtSeconds;
                speedCandidateKmh = mps * 3.6;
                speedSource = 'distance/dt';
              }
            }
          }

          // Clamp de seguridad
          if (speedCandidateKmh != null) {
            speedCandidateKmh = Math.min(
              MAX_REASONABLE_SPEED_KMH,
              Math.max(0, speedCandidateKmh)
            );

            // Suavizado leve (EMA)
            const prevEma = emaSpeedKmhRef.current;
            const nextEma =
              prevEma == null
                ? speedCandidateKmh
                : prevEma * (1 - SPEED_EMA_ALPHA) + speedCandidateKmh * SPEED_EMA_ALPHA;

            emaSpeedKmhRef.current = nextEma;
            lastGoodSpeedKmhRef.current = nextEma;
            lastGoodSpeedAtRef.current = now;
            lastGoodCoordForSpeedRef.current = { ...newCoord, timestamp: now };
          }

          const lastGoodAgeMs = lastGoodSpeedAtRef.current
            ? now - lastGoodSpeedAtRef.current
            : Number.POSITIVE_INFINITY;

          // Freeze: si no hay dato confiable, mantenemos última velocidad buena
          const speedForUi = lastGoodSpeedKmhRef.current || 0;

          if (DEBUG_SPEED) {
            console.log(
              `🏎️[tracker] speedCandidate=${speedCandidateKmh != null ? speedCandidateKmh.toFixed(2) : 'null'} km/h` +
                ` source=${speedSource || 'n/a'}` +
                ` accuracy=${accuracy != null ? accuracy.toFixed(1) : 'n/a'}m` +
                ` rawSpeed=${rawSpeedMps != null ? rawSpeedMps : 'n/a'} m/s` +
                ` lastGoodAge=${Number.isFinite(lastGoodAgeMs) ? Math.round(lastGoodAgeMs) : 'inf'}ms`
            );
          }

          // Update de speed en UI (aunque no se supere MIN_MOVEMENT_DISTANCE)
          if (
            SPEED_UI_UPDATE_MS === 0 ||
            now - lastSpeedUiUpdateRef.current >= SPEED_UI_UPDATE_MS
          ) {
            lastSpeedUiUpdateRef.current = now;
            setTrackingData((prev) => ({
              ...prev,
              currentLocation: newCoord,
              speed: speedForUi,
            }));
          }

          let nextDistance = distanceRef.current;
          let avgSpd = avgSpeedRef.current;
          let nextMaxSpeed = maxSpeedRef.current;

          const lastStatsCoord = lastStatsCoordRef.current || lastCoord;
          const distanceForStats = lastStatsCoord
            ? calculateDistance(
                lastStatsCoord.latitude,
                lastStatsCoord.longitude,
                newCoord.latitude,
                newCoord.longitude
              )
            : 0;
          const shouldUpdateStats = distanceForStats >= STATS_MIN_DISTANCE_M;

          if (shouldUpdateStats) {
            lastStatsCoordRef.current = newCoord;
            lastMovementTime.current = now;
            if (now - lastMovementPersistRef.current > 30000) {
              lastMovementPersistRef.current = now;
              updateLastMovement().catch(console.error);
            }

            nextDistance = distanceRef.current + distanceForStats;
            distanceRef.current = nextDistance;

            const speedMps =
              typeof coords.speed === 'number' && coords.speed > 0
                ? coords.speed
                : 0;
            const speedKmh = speedMps * 3.6;

            speedSumRef.current += speedKmh;
            speedCountRef.current += 1;
            avgSpd = speedSumRef.current / speedCountRef.current;
            avgSpeedRef.current = avgSpd;

            nextMaxSpeed = Math.max(maxSpeedRef.current, speedKmh);
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
          }

          if (shouldAppendRoute) {
            prevFullCoords.push(newCoord);

            const shouldUpdateUi =
              uiUpdateIntervalMs === 0 ||
              now - lastUiUpdateRef.current >= uiUpdateIntervalMs;

            if (shouldUpdateUi) {
              lastUiUpdateRef.current = now;
              const reduced = buildReducedCoordinates(prevFullCoords);
              routeCoordinatesRef.current = reduced;
              setRoutePointCount(prevFullCoords.length);
              setTrackingData({
                currentLocation: newCoord,
                routeCoordinates: reduced,
                distance: nextDistance,
                speed: lastGoodSpeedKmhRef.current || 0,
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
                routeCoordinates: prevFullCoords,
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
        syncDuration();

        // Fusionar puntos GPS capturados en background con la ruta
        try {
          const bgPoints = await consumeBgRouteBuffer();
          if (bgPoints.length > 0) {
            const fullCoords = routeCoordinatesFullRef.current;
            let addedDistance = 0;
            for (const point of bgPoints) {
              const last = fullCoords[fullCoords.length - 1];
              if (last) {
                const d = calculateDistance(
                  last.latitude, last.longitude,
                  point.latitude, point.longitude,
                );
                if (d >= ROUTE_POINT_MIN_DISTANCE_BG_M) {
                  fullCoords.push(point);
                }
                if (d >= STATS_MIN_DISTANCE_M) {
                  addedDistance += d;
                }
              } else {
                fullCoords.push(point);
              }
            }
            if (fullCoords.length > 0) {
              lastStatsCoordRef.current = fullCoords[fullCoords.length - 1];
            }
            if (addedDistance > 0) {
              distanceRef.current += addedDistance;
              lastMovementTime.current = Date.now();
            }
            const reduced = buildReducedCoordinates(fullCoords);
            routeCoordinatesRef.current = reduced;
            setRoutePointCount(fullCoords.length);
            const lastBgPoint = bgPoints[bgPoints.length - 1];
            currentLocationRef.current = lastBgPoint;
            setTrackingData(prev => ({
              ...prev,
              currentLocation: lastBgPoint,
              routeCoordinates: reduced,
              distance: distanceRef.current,
            }));
          }
        } catch (bgErr) {
          console.error('Error merging bg route buffer:', bgErr);
        }

        const check = status === TRACKER_STATUS.TRACKING
          ? await checkOrphanedTracking()
          : null;

        if (check && check.shouldStop) {
          setError(`Tracking pausado automaticamente por ${check.inactiveMinutes} minutos de inactividad`);
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
  }, [autoPauseTracking, buildReducedCoordinates, calculateDistance, persistTrackingState, status, syncDuration]);



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
    lastStatsCoordRef.current = null;
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
    await clearBgRouteBuffer();

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
      distanceRef.current = 0;
      avgSpeedRef.current = 0;
      maxSpeedRef.current = 0;
      caloriesRef.current = 0;
      lastStatsCoordRef.current = null;
      lastGoodSpeedKmhRef.current = 0;
      lastGoodSpeedAtRef.current = 0;
      lastGoodCoordForSpeedRef.current = null;
      emaSpeedKmhRef.current = null;
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
            heading: normalizeHeading(lastKnown.coords.heading),
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
        speed: location.coords.speed,
        heading: normalizeHeading(location.coords.heading),
      };
      currentLocationRef.current = initialCoord;

      const seededCoords = lastKnownCoord ? [lastKnownCoord, initialCoord] : [initialCoord];
      routeCoordinatesFullRef.current = seededCoords;
      lastStatsCoordRef.current = initialCoord;
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

      // Fusionar puntos capturados en background antes de guardar
      try {
        const bgPoints = await consumeBgRouteBuffer();
        if (bgPoints.length > 0) {
          const fc = routeCoordinatesFullRef.current;
          for (const point of bgPoints) {
            const last = fc[fc.length - 1];
            if (last) {
              const d = calculateDistance(
                last.latitude, last.longitude,
                point.latitude, point.longitude,
              );
              if (d >= ROUTE_POINT_MIN_DISTANCE_BG_M) {
                fc.push(point);
              }
              if (d >= STATS_MIN_DISTANCE_M) {
                distanceRef.current += d;
              }
            } else {
              fc.push(point);
            }
          }
          if (fc.length > 0) {
            lastStatsCoordRef.current = fc[fc.length - 1];
          }
        }
      } catch (_) {}

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

      if (fullCoords.length > 10 && distanceRef.current > 100) {
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
      lastStatsCoordRef.current = null;
      startTime.current = null;
      totalPausedMsRef.current = 0;
      pausedAtRef.current = null;
      lastMovementTime.current = Date.now();

      await stopBackgroundTracking();
      await clearTrackingState();
      await clearBgRouteBuffer();

      console.log('Tracking detenido');
      return savedRoute;
    } finally {
      setTimeout(() => {
        isStoppingRef.current = false;
      }, 500);
    }
  }, [trackingData, sendLiveUpdate, saveRoute, stopTimer]);

  const saveRoute = useCallback(async () => {
    let routeId = null;
    let chunkCount = 0;
    try {
      const realDuration = computeElapsedSeconds();
      setDuration(realDuration);
      const fullCoords = routeCoordinatesFullRef.current;
      if (!fullCoords.length) {
        return null;
      }
      routeId = Date.now().toString();
      const fullCoordinates = fullCoords.slice();
      const previewCoordinates = buildRoutePreview(fullCoordinates);
      chunkCount = await saveRouteChunks(routeId, fullCoordinates);

      const route = {
        id: routeId,
        userId: user?.id || 'guest',
        coordinates: previewCoordinates,
        coordinatesStoredSeparately: chunkCount > 0,
        coordinateChunks: chunkCount,
        pointsCount: fullCoordinates.length,
        distance: distanceRef.current,
        duration: realDuration,
        avgSpeed: avgSpeedRef.current,
        maxSpeed: maxSpeedRef.current,
        calories: caloriesRef.current,
        date: new Date().toISOString(),
        startPoint: fullCoordinates[0],
        endPoint: fullCoordinates[fullCoordinates.length - 1],
      };

      // Cargar rutas existentes
      const storedRoutes = await AsyncStorage.getItem(STORAGE_KEY);
      const existingRoutes = storedRoutes ? JSON.parse(storedRoutes) : [];
      const routes = Array.isArray(existingRoutes) ? existingRoutes : [];

      // Agregar nueva ruta
      routes.unshift(route); // Agregar al inicio
      const keptRoutes = routes.slice(0, ROUTES_LIMIT);
      const removedRoutes = routes.slice(ROUTES_LIMIT);

      // Guardar (limitar a últimas rutas)
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(keptRoutes));

      if (removedRoutes.length > 0) {
        await Promise.all(
          removedRoutes.map((removed) =>
            deleteRouteChunks(removed.id, removed.coordinateChunks || 0)
          )
        );
      }

      console.log('✅ Ruta guardada:', route.id);
      return {
        ...route,
        coordinates: fullCoordinates,
      };
    } catch (err) {
      console.error('❌ Error guardando ruta:', err);
      if (routeId && chunkCount > 0) {
        await deleteRouteChunks(routeId, chunkCount).catch(() => {});
      }
      setError(err.message);
      return null;
    }
  }, [
    user,
    computeElapsedSeconds,
    saveRouteChunks,
    deleteRouteChunks,
  ]);

  /**
   * 📋 Cargar rutas guardadas
   */
  const loadRoutes = useCallback(async () => {
    try {
      const storedRoutes = await AsyncStorage.getItem(STORAGE_KEY);
      const routes = storedRoutes ? JSON.parse(storedRoutes) : [];
      return Array.isArray(routes) ? routes : [];
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
      const safeRoutes = Array.isArray(routes) ? routes : [];
      const routeToDelete = safeRoutes.find((r) => r.id === routeId);
      const filteredRoutes = safeRoutes.filter((r) => r.id !== routeId);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRoutes));
      await deleteRouteChunks(routeId, routeToDelete?.coordinateChunks || 0);
      console.log('✅ Ruta eliminada:', routeId);
      return true;
    } catch (err) {
      console.error('❌ Error eliminando ruta:', err);
      return false;
    }
  }, [deleteRouteChunks]);

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
        const lastRestored = state.routeCoordinates[state.routeCoordinates.length - 1];
        if (lastRestored) {
          lastStatsCoordRef.current = lastRestored;
        }
      }
      if (state.distance != null) distanceRef.current = state.distance;
      if (state.avgSpeed != null) avgSpeedRef.current = state.avgSpeed;
      if (state.maxSpeed != null) maxSpeedRef.current = state.maxSpeed;
      if (state.calories != null) caloriesRef.current = state.calories;
      if (state.lastLocation) currentLocationRef.current = state.lastLocation;
      if (state.lastLocation) lastStatsCoordRef.current = state.lastLocation;

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
    hydrateRouteCoordinates,
    deleteRoute,
  };
};

export default useRouteTracker;
