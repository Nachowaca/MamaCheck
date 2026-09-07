import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseReady = Boolean(url && anonKey);

// Login con Google real ya está armado (ver AuthContext.signInWithGoogle)
// pero pausado por problemas de red probando desde el celu — el login por
// defecto usa mail+contraseña. Poner EXPO_PUBLIC_USE_GOOGLE_AUTH=true en
// app/.env para mostrar la opción de Google de nuevo.
export const googleAuthEnabled = process.env.EXPO_PUBLIC_USE_GOOGLE_AUTH === "true";

export const supabase = supabaseReady
  ? createClient(url, anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
