import { Platform } from "react-native";
import Constants from "expo-constants";
import { supabase, supabaseReady } from "./supabase";

// Expo sacó las notificaciones push remotas de Expo Go (Android y iOS) en el
// SDK 53 — el módulo tira error apenas se importa, no solo al usarlo. Por
// eso el require de expo-notifications es condicional: en Expo Go, el
// módulo nunca se carga. Fuera de Expo Go (dev build) funciona normal.
const isExpoGo = Constants.appOwnership === "expo";

let Notifications = null;
if (!isExpoGo) {
  Notifications = require("expo-notifications");
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {
    // por las dudas, no bloquear el arranque de la app
  }
}

// Pide permiso, saca el push token de este celu y lo guarda en el profile
// del usuario logueado — así el otro lado sabe a dónde mandarle avisos.
export async function registerForPushToken() {
  if (!supabaseReady) return "sin supabase";
  if (Platform.OS === "web") return "es web";
  if (!Notifications) return "modulo Notifications no cargado (isExpoGo=" + isExpoGo + ")";

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== "granted") return "permiso no concedido: " + status;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const { data: tokenData } = await Notifications.getExpoPushTokenAsync({ projectId });

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return "sin usuario logueado";

  const { error } = await supabase
    .from("profiles")
    .update({ push_token: tokenData })
    .eq("id", user.id);
  if (error) return "error guardando token: " + error.message;

  return "OK: " + tokenData;
}

// Manda un push directo vía la API de Expo (no hace falta backend propio).
export async function sendPushTo(pushToken, title, body) {
  if (!pushToken) return;
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ to: pushToken, title, body, sound: "default" }),
    });
  } catch {
    // sin conexión o falla puntual: no bloquea el resto del flujo
  }
}
