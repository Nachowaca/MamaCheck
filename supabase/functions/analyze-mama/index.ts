// Supabase Edge Function: arma un resumen en lenguaje natural del estado de
// mamá (movimiento, check-ins, alertas, zona segura) usando la API de Claude.
// La API key de Anthropic vive acá como secret, nunca en la app.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.115.0";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "No autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("household_id")
      .eq("id", userData.user.id)
      .single();
    const householdId = profile?.household_id;
    if (!householdId) {
      return new Response(JSON.stringify({ error: "Sin household" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [{ data: locations }, { data: alerts }, { data: zones }] = await Promise.all([
      supabase
        .from("locations")
        .select("lat, lng, recorded_at")
        .eq("household_id", householdId)
        .gte("recorded_at", since)
        .order("recorded_at", { ascending: true }),
      supabase
        .from("alerts")
        .select("type, text, created_at")
        .eq("household_id", householdId)
        .gte("created_at", since)
        .order("created_at", { ascending: true }),
      supabase.from("safe_zones").select("name, radius_m").eq("household_id", householdId),
    ]);

    const summaryInput = {
      cantidad_ubicaciones_ultimas_24h: locations?.length ?? 0,
      primera_ubicacion: locations?.[0]?.recorded_at ?? null,
      ultima_ubicacion: locations?.at(-1)?.recorded_at ?? null,
      zonas_seguras: zones ?? [],
      eventos_ultimas_24h: (alerts ?? []).map((a) => ({ tipo: a.type, texto: a.text, cuando: a.created_at })),
    };

    const prompt = `Sos un asistente que ayuda a un hijo (Nacho) a entender cómo estuvo su madre en las últimas 24 horas, a partir de datos de ubicación y eventos de una app de cuidado a distancia. Escribí un resumen corto (3-4 líneas), en español rioplatense, cálido pero directo, sin alarmismo innecesario. Si no hay datos suficientes, decilo con honestidad en vez de inventar. Datos:\n\n${JSON.stringify(summaryInput, null, 2)}`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      return new Response(JSON.stringify({ error: "Claude API error", detail: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const claudeJson = await claudeRes.json();
    const text = claudeJson.content?.[0]?.text ?? "No se pudo generar el resumen.";

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
