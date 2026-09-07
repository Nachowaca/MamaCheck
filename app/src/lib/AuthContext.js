import { createContext, useContext, useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase, supabaseReady } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseReady) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabaseReady) return; // sin backend: claimRole maneja el profile en memoria
    if (!session?.user) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => {
        if (!cancelled) setProfile(data);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  // Mail + contraseña: entrar; si la cuenta no existe todavía, se crea sola.
  // Evita depender de Google mientras probamos (Google real ya está armado,
  // ver EXPO_PUBLIC_USE_GOOGLE_AUTH, pero pausado por temas de red probando
  // desde el celu).
  async function authenticateWithPassword(email, password) {
    if (!supabaseReady) throw new Error("Supabase no está configurado todavía");
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (!signInError) return;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) throw signUpError;

    // Red de seguridad: si el trigger de la base no llegó a crear el
    // profile, lo creamos desde acá con la sesión ya autenticada.
    if (signUpData.user) {
      await supabase.from("profiles").upsert({ id: signUpData.user.id, email }, { onConflict: "id" });
    }
  }

  async function signInWithGoogle() {
    if (!supabaseReady) throw new Error("Supabase no está configurado todavía");
    const redirectTo = Linking.createURL("auth-callback");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === "success" && result.url) {
      const { params, errorCode } = Linking.parse(result.url);
      if (errorCode) throw new Error(errorCode);
      if (params.access_token && params.refresh_token) {
        await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
      }
    }
  }

  async function claimRole(role) {
    if (!supabaseReady) {
      // Sin Supabase configurado: entra con un perfil de prueba en memoria
      // (ver mockData.js) para poder probar las pantallas sin backend.
      const mockSession = {
        user: { id: "mock-" + role, email: role === "mama" ? "lisboaser@gmail.com" : "ignacional26@gmail.com" },
      };
      setSession(mockSession);
      setProfile({
        id: mockSession.user.id,
        household_id: "mock-household",
        role,
        name: role === "mama" ? "Laura" : "Nacho",
        email: mockSession.user.email,
        phone: "+598 99 000 000",
      });
      return;
    }
    // No confiar en el `session` de React acá: justo después de loguearse
    // todavía puede no haberse actualizado (onAuthStateChange es async), y
    // claimRole se llama inmediatamente después del login. Se pide fresco.
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    let householdId = existingProfile?.household_id;
    if (!householdId) {
      // MVP de 2 personas: se unen a la única household que existe, o la crean si es la primera vez.
      const { data: existing } = await supabase.from("households").select("id").limit(1).single();
      householdId = existing?.id;
      if (!householdId) {
        const { data: created } = await supabase.from("households").insert({}).select("id").single();
        householdId = created?.id;
      }
    }

    await supabase
      .from("profiles")
      .upsert(
        { id: user.id, role, household_id: householdId, name: existingProfile?.name ?? user.email?.split("@")[0], email: user.email },
        { onConflict: "id" }
      );
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    setProfile(data);
  }

  async function signOut() {
    if (supabaseReady) await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, authenticateWithPassword, signInWithGoogle, signOut, claimRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
