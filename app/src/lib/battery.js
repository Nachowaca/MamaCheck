import * as Battery from "expo-battery";
import { supabase, supabaseReady } from "./supabase";

// Guarda el nivel de batería del celu actual en el profile del usuario
// logueado — así el otro lado (Nacho) puede ver si a mamá se le está por
// apagar el teléfono.
export async function reportBatteryStatus() {
  if (!supabaseReady) return;
  try {
    const level = await Battery.getBatteryLevelAsync();
    const state = await Battery.getBatteryStateAsync();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user || level == null || level < 0) return;

    await supabase
      .from("profiles")
      .update({
        battery_level: Math.round(level * 100),
        battery_charging: state === Battery.BatteryState.CHARGING || state === Battery.BatteryState.FULL,
      })
      .eq("id", user.id);
  } catch (e) {
    console.warn("battery status:", e?.message ?? e);
  }
}
