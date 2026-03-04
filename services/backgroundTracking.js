import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TRACKING_LIVE_TASK } from "../tasks/trackingLiveTask";
import Constants from "expo-constants";

const TRACKING_USER_ID_KEY = "@tracking_user_id";

// Detectar si estamos en Expo Go
const isExpoGo = Constants.appOwnership === "expo";

export async function startBackgroundTracking(userId) {
  try {
    await AsyncStorage.setItem(TRACKING_USER_ID_KEY, userId);
    
    if (!TaskManager.isTaskDefined(TRACKING_LIVE_TASK)) {
      console.warn("?? Tracking task no registrado; se omite background tracking");
      return { foregroundOnly: true };
    }

    // Verificar permisos (no solicitar - ya deben estar concedidos antes de llamar esta función)
    const fg = await Location.getForegroundPermissionsAsync();
    if (fg.status !== "granted") {
      throw new Error("Permiso foreground no concedido. Solicita permisos antes de iniciar tracking.");
    }

    // Si estamos en Expo Go, no intentar background tracking (no está soportado)
    if (isExpoGo) {
      console.log("📱 Expo Go detectado - background tracking no disponible, usando solo foreground");
      return { foregroundOnly: true };
    }

    // Intentar obtener permiso background (opcional, no bloquear si falla)
    try {
      const bg = await Location.getBackgroundPermissionsAsync();
      if (bg.status !== "granted") {
        // Intentar solicitar solo si no está concedido
        const bgRequest = await Location.requestBackgroundPermissionsAsync();
        if (bgRequest.status !== "granted") {
          console.warn("⚠️ Permiso background no concedido - tracking solo funcionará en primer plano");
          return { foregroundOnly: true };
        }
      }
    } catch (bgError) {
      console.warn("⚠️ Error con permisos background:", bgError.message);
      return { foregroundOnly: true };
    }

    // Solo intentar background tracking si no estamos en Expo Go
    try {
      const started = await Location.hasStartedLocationUpdatesAsync(
        TRACKING_LIVE_TASK
      );
      if (started) return { foregroundOnly: false }; // evita duplicados

      await Location.startLocationUpdatesAsync(TRACKING_LIVE_TASK, {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000, // cada 5s (ajusta para batería)
        distanceInterval: 0, // o 10-20 para ahorrar batería
        foregroundService: {
          notificationTitle: "Tracking activo",
          notificationBody: "Compartiendo ubicación en vivo",
        },
      });
      
      return { foregroundOnly: false };
    } catch (bgStartError) {
      console.error("❌ Error crítico iniciando background tracking:", bgStartError);
      return { foregroundOnly: true };
    }
  } catch (error) {
    console.error("❌ Error general en startBackgroundTracking:", error);
    return { foregroundOnly: true };
  }
}

export async function stopBackgroundTracking() {
  try {
    await AsyncStorage.removeItem(TRACKING_USER_ID_KEY);

    const started = await Location.hasStartedLocationUpdatesAsync(
      TRACKING_LIVE_TASK
    );
    if (started) {
      await Location.stopLocationUpdatesAsync(TRACKING_LIVE_TASK);
      console.log("✅ Background tracking detenido correctamente");
    }
  } catch (error) {
    console.error("❌ Error deteniendo background tracking:", error);
  }
}
