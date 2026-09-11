import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import { supabase, supabaseReady } from "./supabase";
import { sendPushTo } from "./pushNotifications";

export const LOCATION_TASK = "mamacheck-background-location";

// Distancia en metros entre dos puntos (fórmula haversine).
function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Guarda la ubicación y, si hay zonas seguras cargadas, avisa cuando mamá
// entra o sale de todas ellas (no repite el aviso si ya estaba en ese
// estado — solo en la transición).
async function recordLocationAndCheckZone(householdId, userId, lat, lng) {
  await supabase.from("locations").insert({ household_id: householdId, user_id: userId, lat, lng });

  const { data: zones } = await supabase
    .from("safe_zones")
    .select("lat, lng, radius_m")
    .eq("household_id", householdId);
  if (!zones || zones.length === 0) return;

  const isInside = zones.some((z) => distanceMeters(lat, lng, z.lat, z.lng) <= z.radius_m);

  const { data: lastZoneAlert } = await supabase
    .from("alerts")
    .select("type")
    .eq("household_id", householdId)
    .eq("user_id", userId)
    .in("type", ["zone_exit", "zone_enter"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const wasInside = lastZoneAlert ? lastZoneAlert.type === "zone_enter" : true;
  if (isInside === wasInside) return;

  const alertText = isInside ? "Volvió a una zona segura" : "Salió de la zona segura";
  await supabase.from("alerts").insert({
    household_id: householdId,
    user_id: userId,
    type: isInside ? "zone_enter" : "zone_exit",
    text: alertText,
  });

  const { data: others } = await supabase
    .from("profiles")
    .select("push_token")
    .eq("household_id", householdId)
    .neq("id", userId);
  others?.forEach((p) => sendPushTo(p.push_token, isInside ? "Volvió a la zona segura" : "Salió de la zona segura", alertText));
}

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error || !data || !supabaseReady) return;
  const { locations } = data;
  const point = locations?.[0];
  if (!point) return;

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return;
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();
  if (!profileRow?.household_id) return;

  await recordLocationAndCheckZone(
    profileRow.household_id,
    user.id,
    point.coords.latitude,
    point.coords.longitude
  );
});

export async function startBackgroundLocation() {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== "granted") return false;
  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== "granted") return false;

  const already = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  if (already) return true;

  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 4 * 60 * 1000,
    distanceInterval: 30,
    showsBackgroundLocationIndicator: false,
    foregroundService: {
      notificationTitle: "MamaCheck",
      notificationBody: "Compartiendo tu ubicación con tu familia",
    },
  });
  return true;
}

export async function stopBackgroundLocation() {
  const already = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  if (already) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
}

// Mientras el tracking en background no funcione (Expo Go / sin dev build),
// esto manda la ubicación real una vez mientras la app está abierta —
// alcanza para ver el punto real en el mapa de Nacho durante una prueba.
export async function writeCurrentLocationOnce() {
  if (!supabaseReady) return;
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== "granted") return;

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return;
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();
  if (!profileRow?.household_id) return;

  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  await recordLocationAndCheckZone(
    profileRow.household_id,
    user.id,
    position.coords.latitude,
    position.coords.longitude
  );
}
