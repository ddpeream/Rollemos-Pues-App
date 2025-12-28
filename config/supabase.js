import "expo-sqlite/localStorage/install";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "❌ Falta EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY"
  );
}

console.log("✅ Supabase URL:", SUPABASE_URL);
console.log(
  "✅ Supabase Key (primeros 20 chars):",
  SUPABASE_ANON_KEY.substring(0, 20) + "..."
);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof localStorage !== "undefined" ? localStorage : null,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      "Content-Type": "application/json",
    },
  },
});

export const pingSupabase = async () => {
  try {
    console.log("🔄 Intentando SELECT simple en spots...");
    const { data, error } = await supabase
      .from("spots")
      .select("id, nombre")
      .limit(1);

    if (error) {
      console.error("❌ Error de Supabase:", error);
      return { ok: false, error: error.message };
    }

    console.log("✅ Spots respondieron:", data);
    return { ok: true, data };
  } catch (error) {
    console.error("❌ Exception:", error.message);
    return { ok: false, error: error.message };
  }
};
