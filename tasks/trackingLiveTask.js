import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { upsertTrackingLive } from "../services/tracking";
import { getTrackingPrivacy } from "../services/trackingPrivacy";
import { appendBgRoutePoint } from "../services/trackingAutoStop";

export const TRACKING_LIVE_TASK = "TRACKING_LIVE_TASK";
const TRACKING_USER_ID_KEY = "@tracking_user_id";

TaskManager.defineTask(TRACKING_LIVE_TASK, async ({ data, error }) => {
  try {
    if (error) {
      console.error("? Task error:", error);
      return;
    }

    const loc = data?.locations?.[0];
    if (!loc?.coords) {
      console.warn("? Task: No location data available");
      return;
    }

    const userId = await AsyncStorage.getItem(TRACKING_USER_ID_KEY);
    if (!userId) {
      console.warn("? Task: No user ID found");
      return;
    }

    const { latitude, longitude, speed, heading } = loc.coords;
    
    // Validar coordenadas
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      console.warn("? Task: Invalid coordinates", { latitude, longitude });
      return;
    }

    // Siempre guardar el punto en el buffer local para la ruta
    // (independiente del modo privado, la ruta es local)
    try {
      await appendBgRoutePoint({
        latitude,
        longitude,
        timestamp: Date.now(),
        speed: speed ?? null,
      });
    } catch (bufferError) {
      console.error("? Task: Error saving to buffer:", bufferError);
    }

    const isPrivate = await getTrackingPrivacy();
    if (isPrivate) return;

    const result = await upsertTrackingLive({
      userId,
      latitude,
      longitude,
      speed: speed ?? null,
      heading: heading ?? null,
      isActive: true,
    });

    if (!result.ok) console.error("? Task upsert error:", result.error);
  } catch (taskError) {
    console.error("? Task unexpected error:", taskError);
  }
});
