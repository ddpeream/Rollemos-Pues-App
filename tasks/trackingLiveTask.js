import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { upsertTrackingLive } from "../services/tracking";

export const TRACKING_LIVE_TASK = "TRACKING_LIVE_TASK";
const TRACKING_USER_ID_KEY = "@tracking_user_id";

TaskManager.defineTask(TRACKING_LIVE_TASK, async ({ data, error }) => {
  if (error) {
    console.log("❌ Task error:", error);
    return;
  }

  const loc = data?.locations?.[0];
  if (!loc?.coords) return;

  const userId = await AsyncStorage.getItem(TRACKING_USER_ID_KEY);
  if (!userId) {
    console.log("⚠️ Task: no userId guardado, skip");
    return;
  }

  const { latitude, longitude, speed, heading } = loc.coords;

  const result = await upsertTrackingLive({
    userId,
    latitude,
    longitude,
    speed: speed ?? null,
    heading: heading ?? null,
    isActive: true,
  });

  if (!result.ok) console.log("❌ Task upsert error:", result.error);
});
