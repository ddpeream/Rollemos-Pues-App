
import { createClient } from "@supabase/supabase-js";

// Expo solo expone variables con prefijo EXPO_PUBLIC_
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("❌ Supabase env vars missing");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
