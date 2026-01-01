import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TRACKING_LIVE_TASK } from "../tasks/trackingLiveTask";

const TRACKING_USER_ID_KEY = "@tracking_user_id";

export async function startBackgroundTracking(userId) {
  await AsyncStorage.setItem(TRACKING_USER_ID_KEY, userId);

  // permisos
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== "granted") throw new Error("Permiso foreground denegado");

  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== "granted") throw new Error("Permiso background denegado");

  const started = await Location.hasStartedLocationUpdatesAsync(
    TRACKING_LIVE_TASK
  );
  if (started) return; // evita duplicados

  await Location.startLocationUpdatesAsync(TRACKING_LIVE_TASK, {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 5000, // cada 5s (ajusta para batería)
    distanceInterval: 0, // o 10-20 para ahorrar batería
    foregroundService: {
      notificationTitle: "Tracking activo",
      notificationBody: "Compartiendo ubicación en vivo",
    },
  });
}

export async function stopBackgroundTracking() {
  await AsyncStorage.removeItem(TRACKING_USER_ID_KEY);

  const started = await Location.hasStartedLocationUpdatesAsync(
    TRACKING_LIVE_TASK
  );
  if (started) await Location.stopLocationUpdatesAsync(TRACKING_LIVE_TASK);
}
