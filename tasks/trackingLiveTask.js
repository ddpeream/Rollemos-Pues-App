import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { upsertTrackingLive } from "../services/tracking";
import { getTrackingPrivacy } from "../services/trackingPrivacy";
import { appendBgRoutePoint } from "../services/trackingAutoStop";

export const TRACKING_LIVE_TASK = "TRACKING_LIVE_TASK";
const TRACKING_USER_ID_KEY = "@tracking_user_id";

TaskManager.defineTask(TRACKING_LIVE_TASK, async ({ data, error }) => {
  if (error) {
    console.log("? Task error:", error);
    return;
  }

  const loc = data?.locations?.[0];
  if (!loc?.coords) return;

  const userId = await AsyncStorage.getItem(TRACKING_USER_ID_KEY);
  if (!userId) return;

  const { latitude, longitude, speed, heading } = loc.coords;

  // Siempre guardar el punto en el buffer local para la ruta
  // (independiente del modo privado, la ruta es local)
  appendBgRoutePoint({
    latitude,
    longitude,
    timestamp: Date.now(),
    speed: speed ?? null,
  }).catch(() => {});

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

  if (!result.ok) console.log("? Task upsert error:", result.error);
});
