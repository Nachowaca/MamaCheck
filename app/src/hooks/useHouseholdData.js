import { useEffect, useState, useCallback } from "react";
import { supabase, supabaseReady } from "../lib/supabase";
import { MOCK_CONTACTS, MOCK_ALERTS, MOCK_ZONE, MOCK_LOCATION, MOCK_MAMA_PROFILE } from "../lib/mockData";

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
      .limit(6)
      .then(({ data }) => active && setAlerts(data ?? []));

    const channel = supabase
      .channel(`alerts-${householdId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts", filter: `household_id=eq.${householdId}` },
        (payload) => setAlerts((prev) => [payload.new, ...prev].slice(0, 6))
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [householdId]);

  async function sendAlert({ userId, type, text }) {
    if (!supabaseReady) {
      setAlerts((prev) => [{ id: String(Date.now()), created_at: new Date().toISOString(), type, text }, ...prev].slice(0, 6));
      return;
    }
    if (!householdId) return;
    await supabase.from("alerts").insert({ household_id: householdId, user_id: userId, type, text });
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
  }, [householdId, role]);
  return other;
}

export function useSafeZone(householdId) {
  const [zone, setZone] = useState(supabaseReady ? null : MOCK_ZONE);
  useEffect(() => {
    if (!supabaseReady || !householdId) return;
    supabase
      .from("safe_zones")
      .select("*")
      .eq("household_id", householdId)
      .limit(1)
      .single()
      .then(({ data }) => data && setZone(data));
  }, [householdId]);
  return zone;
}
