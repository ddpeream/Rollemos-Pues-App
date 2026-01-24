/**
 * 🛑 Tracking Auto-Stop Service
 * 
 * Servicio para manejar el auto-stop del tracking cuando:
 * 1. El usuario no se mueve por más de 20 minutos
 * 2. La app se cierra y pasa mucho tiempo sin actividad
 * 
 * Persiste el estado del tracking para validar al reabrir la app.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

// Keys para AsyncStorage
const TRACKING_STATE_KEY = '@rollemos_tracking_state';
const LAST_MOVEMENT_KEY = '@rollemos_last_movement';

// Configuración de tiempos (en milisegundos)
export const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 20 minutos
export const MIN_MOVEMENT_DISTANCE = 10; // metros mínimos para considerar movimiento

/**
 * 💾 Guardar estado del tracking al iniciar
 */
export const saveTrackingState = async (
  userId,
  startTime,
  lastLocation,
  options = {}
) => {
  try {
    const state = {
      userId,
      startTime,
      lastLocation,
      lastMovementTime: Date.now(),
      isActive: true,
      isPaused: options.isPaused ?? false,
      pausedAt: options.pausedAt ?? null,
      totalPausedMs: options.totalPausedMs ?? 0,
      routeCoordinates: options.routeCoordinates ?? null,
      distance: options.distance ?? null,
      avgSpeed: options.avgSpeed ?? null,
      maxSpeed: options.maxSpeed ?? null,
      calories: options.calories ?? null,
      savedAt: Date.now(),
    };
    await AsyncStorage.setItem(TRACKING_STATE_KEY, JSON.stringify(state));
    console.log('💾 Estado de tracking guardado');
    return true;
  } catch (error) {
    console.error('❌ Error guardando estado de tracking:', error);
    return false;
  }
};

/**
 * 📖 Obtener estado del tracking guardado
 */
export const getTrackingState = async () => {
  try {
    const stateStr = await AsyncStorage.getItem(TRACKING_STATE_KEY);
    if (!stateStr) return null;
    return JSON.parse(stateStr);
  } catch (error) {
    console.error('❌ Error leyendo estado de tracking:', error);
    return null;
  }
};

/**
 * 🗑️ Limpiar estado del tracking
 */
export const clearTrackingState = async () => {
  try {
    await AsyncStorage.removeItem(TRACKING_STATE_KEY);
    await AsyncStorage.removeItem(LAST_MOVEMENT_KEY);
    console.log('🗑️ Estado de tracking limpiado');
    return true;
  } catch (error) {
    console.error('❌ Error limpiando estado de tracking:', error);
    return false;
  }
};

/**
 * ⏱️ Actualizar tiempo del último movimiento
 */
export const updateLastMovement = async () => {
  try {
    const now = Date.now();
    await AsyncStorage.setItem(LAST_MOVEMENT_KEY, now.toString());
    
    // También actualizar en el estado general
    const state = await getTrackingState();
    if (state) {
      state.lastMovementTime = now;
      await AsyncStorage.setItem(TRACKING_STATE_KEY, JSON.stringify(state));
    }
    
    return now;
  } catch (error) {
    console.error('❌ Error actualizando último movimiento:', error);
    return null;
  }
};

/**
 * 📖 Obtener tiempo del último movimiento
 */
export const getLastMovement = async () => {
  try {
    const timeStr = await AsyncStorage.getItem(LAST_MOVEMENT_KEY);
    return timeStr ? parseInt(timeStr, 10) : null;
  } catch (error) {
    console.error('❌ Error leyendo último movimiento:', error);
    return null;
  }
};

/**
 * 🔍 Verificar si hay tracking huérfano (sin actividad por mucho tiempo)
 * 
 * Retorna:
 * - null: No hay tracking activo
 * - { shouldStop: true, reason, inactiveMinutes }: Debe detenerse
 * - { shouldStop: false }: Tracking válido, puede continuar
 */
export const checkOrphanedTracking = async () => {
  try {
    const state = await getTrackingState();
    
    if (!state || !state.isActive) {
      return null; // No hay tracking activo
    }

    if (state.isPaused) {
      return {
        shouldStop: false,
        inactiveMinutes: 0,
        userId: state.userId,
        pauseAt: state.pausedAt || state.savedAt,
      };
    }

    const now = Date.now();
    const lastMovement = state.lastMovementTime || state.savedAt;
    const inactiveTime = now - lastMovement;
    const inactiveMinutes = Math.floor(inactiveTime / 60000);
    const pauseAt = lastMovement + INACTIVITY_TIMEOUT;

    console.log(`⏱️ Tracking inactivo por ${inactiveMinutes} minutos`);

    if (inactiveTime >= INACTIVITY_TIMEOUT) {
      return {
        shouldStop: true,
        reason: 'inactivity',
        inactiveMinutes,
        userId: state.userId,
        startTime: state.startTime,
        pauseAt,
      };
    }

    return {
      shouldStop: false,
      inactiveMinutes,
      userId: state.userId,
      pauseAt,
    };
  } catch (error) {
    console.error('❌ Error verificando tracking huérfano:', error);
    return null;
  }
};

/**
 * 🛑 Marcar tracking como inactivo en Supabase
 * (Para cuando se detecta tracking huérfano)
 */
export const markTrackingInactive = async (userId) => {
  try {
    if (!userId) {
      console.log('⚠️ No userId para marcar inactivo');
      return false;
    }

    const { error } = await supabase
      .from('tracking_live')
      .update({ 
        is_active: false, 
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error marcando tracking inactivo:', error);
      return false;
    }

    console.log('✅ Tracking marcado como inactivo en Supabase');
    return true;
  } catch (error) {
    console.error('❌ Error marcando tracking inactivo:', error);
    return false;
  }
};

/**
 * ?? Pausar tracking por inactividad (no borra el estado)
 */
export const pauseTrackingState = async (pauseAt) => {
  try {
    const state = await getTrackingState();
    if (!state || !state.isActive) return false;

    const pausedAt = pauseAt || Date.now();
    if (state.isPaused && state.pausedAt === pausedAt) {
      return true;
    }

    const nextState = {
      ...state,
      isPaused: true,
      pausedAt,
      savedAt: Date.now(),
    };

    await AsyncStorage.setItem(TRACKING_STATE_KEY, JSON.stringify(nextState));
    console.log('?? Tracking pausado por inactividad');
    return true;
  } catch (error) {
    console.error('? Error pausando tracking:', error);
    return false;
  }
};


/**
 * 🔄 Limpiar tracking huérfano si es necesario
 * 
 * Llamar al iniciar la app para verificar y limpiar tracking abandonado
 */
export const cleanupOrphanedTracking = async () => {
  try {
    const check = await checkOrphanedTracking();
    
    if (!check) {
      console.log('✅ No hay tracking huérfano');
      return { cleaned: false, reason: 'no_tracking' };
    }

    if (check.shouldStop) {
      console.log(`🛑 Pausando tracking huérfano (${check.inactiveMinutes} min inactivo)`);
      
      // Marcar como inactivo en Supabase
      await markTrackingInactive(check.userId);
      
      // Pausar estado local
      await pauseTrackingState(check.pauseAt);
      
      return { 
        cleaned: true,
        action: 'paused',
        reason: check.reason,
        inactiveMinutes: check.inactiveMinutes 
      };
    }

    console.log(`✅ Tracking válido (${check.inactiveMinutes} min inactivo, < 20 min)`);
    return { cleaned: false, reason: 'still_valid', action: 'none' };
  } catch (error) {
    console.error('❌ Error en cleanup de tracking:', error);
    return { cleaned: false, reason: 'error', error: error.message };
  }
};
