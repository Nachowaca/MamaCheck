import { useEffect, useState, useCallback } from "react";
import { supabase, supabaseReady } from "../lib/supabase";
import { MOCK_CONTACTS, MOCK_ALERTS, MOCK_ZONES, MOCK_LOCATION, MOCK_MAMA_PROFILE } from "../lib/mockData";
import { sendPushTo } from "../lib/pushNotifications";

const ALERT_TITLES = {
  sos: "Pidió ayuda",
  checkin: "Check-in",
  zone_exit: "Salió de la zona segura",
  zone_enter: "Volvió a la zona segura",
  message: "Mensaje",
};

export function useContacts(householdId) {
  const [contacts, setContacts] = useState(supabaseReady ? [] : MOCK_CONTACTS);

  const reload = useCallback(async () => {
    if (!supabaseReady || !householdId) return;
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("household_id", householdId)
      .order("sort_order");
    setContacts(data ?? []);
  }, [householdId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { contacts, reload };
}

export function useAlerts(householdId) {
  const [alerts, setAlerts] = useState(supabaseReady ? [] : MOCK_ALERTS);

  useEffect(() => {
    if (!supabaseReady || !householdId) return;
    let active = true;
    supabase
      .from("alerts")
      .select("*")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false })
      .limit(4)
      .then(({ data }) => active && setAlerts(data ?? []));

    const channel = supabase
      .channel(`alerts-${householdId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts", filter: `household_id=eq.${householdId}` },
        (payload) => setAlerts((prev) => [payload.new, ...prev].slice(0, 4))
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [householdId]);

  async function sendAlert({ userId, type, text }) {
    if (!supabaseReady) {
      setAlerts((prev) => [{ id: String(Date.now()), created_at: new Date().toISOString(), type, text }, ...prev].slice(0, 4));
      return;
    }
    if (!householdId) return;
    await supabase.from("alerts").insert({ household_id: householdId, user_id: userId, type, text });

    const { data: others } = await supabase
      .from("profiles")
      .select("push_token")
      .eq("household_id", householdId)
      .neq("id", userId);
    others?.forEach((p) => sendPushTo(p.push_token, ALERT_TITLES[type] ?? "MamaCheck", text));
  }

  return { alerts, sendAlert };
}

export function useLatestLocation(householdId, targetUserId) {
  const [location, setLocation] = useState(supabaseReady ? null : MOCK_LOCATION);

  useEffect(() => {
    if (!supabaseReady || !householdId || !targetUserId) return;
    let active = true;
    supabase
      .from("locations")
      .select("*")
      .eq("household_id", householdId)
      .eq("user_id", targetUserId)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => active && data && setLocation(data));

    const channel = supabase
      .channel(`locations-${householdId}-${targetUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "locations",
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          if (payload.new.user_id === targetUserId) setLocation(payload.new);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [householdId, targetUserId]);

  return location;
}

export function useOtherProfile(householdId, role) {
  const [other, setOther] = useState(!supabaseReady && role === "mama" ? MOCK_MAMA_PROFILE : null);
  useEffect(() => {
    if (!supabaseReady || !householdId) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("household_id", householdId)
      .eq("role", role)
      .limit(1)
      .single()
      .then(({ data }) => data && setOther(data));

    // Realtime: batería/push_token/etc. del otro perfil se actualizan solos
    // en pantalla (ej. Nacho viendo la batería de mamá) sin recargar.
    const channel = supabase
      .channel(`profile-${householdId}-${role}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `household_id=eq.${householdId}` },
        (payload) => {
          if (payload.new.role === role) setOther(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, role]);
  return other;
}

// Puede haber más de una zona segura por household (casa de mamá, casa de
// un familiar, etc.) — el mapa dibuja un círculo por cada una y la
// detección de salida/entrada (locationTask.js) chequea si está dentro de
// CUALQUIERA de ellas, no solo la primera.
export function useSafeZones(householdId) {
  const [zones, setZones] = useState(supabaseReady ? [] : MOCK_ZONES);
  useEffect(() => {
    if (!supabaseReady || !householdId) return;
    supabase
      .from("safe_zones")
      .select("*")
      .eq("household_id", householdId)
      .order("created_at")
      .then(({ data }) => setZones(data ?? []));
  }, [householdId]);
  return zones;
}
