// // supabase/functions/push/index.ts
// import { createClient } from "npm:@supabase/supabase-js@2";

// type NotificationRow = {
//   id: string;
//   user_id: string; // ajusta si tu columna se llama distinto
//   body: string;
//   titulo?: string | null;
// };

// type WebhookPayload = {
//   type: "INSERT" | "UPDATE" | "DELETE";
//   table: string;
//   schema: "public";
//   record: NotificationRow;
//   old_record: NotificationRow | null;
// };

// const supabase = createClient(
//   Deno.env.get("SUPABASE_URL")!,
//   Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // solo backend
// );

// Deno.serve(async (req) => {
//   const payload: WebhookPayload = await req.json();

//   // Solo nos interesa INSERT
//   if (payload.type !== "INSERT") {
//     return new Response("ignored", { status: 200 });
//   }

//   // 1) Buscar token del usuario
//   const { data: userRow, error: userErr } = await supabase
//     .from("usuarios")
//     .select("expo_push_token")
//     .eq("id", payload.record.user_id)
//     .single();

//   if (userErr) {
//     console.error("User lookup error:", userErr);
//     return new Response("user lookup error", { status: 500 });
//   }

//   const token = userRow?.expo_push_token;
//   if (!token) return new Response("no token", { status: 200 });

//   // 2) Enviar a Expo
//   const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       // Si activas “Enhanced Security” en Expo, necesitas este token:
//       Authorization: `Bearer ${Deno.env.get("EXPO_ACCESS_TOKEN") ?? ""}`,
//     },
//     body: JSON.stringify({
//       to: token,
//       sound: "default",
//       titulo: payload.record.titulo ?? "Notificación",
//       body: payload.record.body,
//     }),
//   });

//   const text = await expoRes.text();
//   if (!expoRes.ok) {
//     console.error("Expo error:", expoRes.status, text);
//     return new Response("expo error", { status: 502 });
//   }

//   return new Response("ok", { status: 200 });
// });
