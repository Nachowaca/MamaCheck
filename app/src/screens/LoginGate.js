import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { C, radiusLg, radiusMd } from "../theme/colors";
import { useAuth } from "../lib/AuthContext";
import { supabaseReady, googleAuthEnabled } from "../lib/supabase";
import { NachoAvatar, MamaAvatar } from "../components/Avatars";
import { Button } from "../components/common";

// Cuenta fija de mamá: ella solo toca "Soy mamá" y entra, sin escribir nada.
// La contraseña vive en app/.env — no es un secreto real (queda en el
// bundle), pero alcanza para este uso: su celu, app familiar de 2 personas.
const MAMA_EMAIL = process.env.EXPO_PUBLIC_MAMA_EMAIL;
const MAMA_PASSWORD = process.env.EXPO_PUBLIC_MAMA_PASSWORD;

// TEMPORAL, solo para probar más rápido: "Soy Nacho" también entra directo
// mientras iteramos, sin tipear cada vez. Sacar NACHO_EMAIL/PASSWORD de
// app/.env cuando quieras que vuelva a pedir mail+contraseña (o Google).
const NACHO_EMAIL = process.env.EXPO_PUBLIC_NACHO_EMAIL;
const NACHO_PASSWORD = process.env.EXPO_PUBLIC_NACHO_PASSWORD;

export default function LoginGate() {
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { authenticateWithPassword, signInWithGoogle, claimRole } = useAuth();

  function handleNachoPick() {
    if (NACHO_EMAIL && NACHO_PASSWORD) {
      handleAutoLogin("cuidador", NACHO_EMAIL, NACHO_PASSWORD);
    } else {
      setError("");
      setRole("cuidador");
    }
  }

  async function handleAutoLogin(role, autoEmail, autoPassword) {
    setRole(role);
    setBusy(true);
    setError("");
    try {
      if (supabaseReady && autoEmail && autoPassword) {
        await authenticateWithPassword(autoEmail, autoPassword);
      }
      await claimRole(role);
    } catch (e) {
      setError(e.message ?? String(e));
      setRole(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle(r) {
    setBusy(true);
    setError("");
    try {
      if (supabaseReady) await signInWithGoogle();
      await claimRole(r);
    } catch (e) {
      setError(e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handlePassword(r) {
    setError("");
    if (!email.trim() || password.length < 6) {
      setError("Poné tu mail y una contraseña de al menos 6 caracteres.");
      return;
    }
    setBusy(true);
    try {
      if (supabaseReady) await authenticateWithPassword(email.trim(), password);
      await claimRole(r);
    } catch (e) {
      setError(e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.centered}>
      <View style={styles.card}>
        <View style={styles.logo}>
          <View style={styles.check} />
        </View>
        <Text style={styles.title}>
          Mama<Text style={{ color: C.accent }}>Check</Text>
        </Text>
        <Text style={styles.subtitle}>Cuidado a distancia, con calma</Text>

        {role === null && (
          <>
            <Text style={styles.prompt}>¿Quién entra?</Text>
            <RoleCard
              title="Soy Nacho"
              subtitle="Ves ubicación, estado y alertas"
              icon={<NachoAvatar size={22} />}
              onPress={handleNachoPick}
            />
            <RoleCard
              title="Soy mamá"
              subtitle="Avisar que estoy bien y pedir ayuda"
              icon={<MamaAvatar size={22} />}
              onPress={() => handleAutoLogin("mama", MAMA_EMAIL, MAMA_PASSWORD)}
            />
            {error !== "" && <Text style={styles.error}>{error}</Text>}
          </>
        )}

        {(role === "mama" || (role === "cuidador" && busy && NACHO_EMAIL && NACHO_PASSWORD)) && (
          <View style={{ alignItems: "center", gap: 14, paddingVertical: 10 }}>
            <ActivityIndicator color={C.accent} />
            <Text style={styles.prompt}>Entrando…</Text>
          </View>
        )}

        {role === "cuidador" && !(busy && NACHO_EMAIL && NACHO_PASSWORD) && (
          <>
            <Text style={styles.prompt}>Entrá con tu mail</Text>
            <TextInput
              style={styles.input}
              placeholder="tu-mail@gmail.com"
              placeholderTextColor="rgba(34,31,54,0.4)"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!busy}
            />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="rgba(34,31,54,0.4)"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!busy}
            />
            <Button variant="primary" style={styles.fullBtn} disabled={busy} onPress={() => handlePassword(role)}>
              {busy ? <ActivityIndicator color={C.accentText} /> : "Entrar"}
            </Button>
            {error !== "" && <Text style={styles.error}>{error}</Text>}
            <Text style={styles.hint}>Si es la primera vez, se crea la cuenta sola.</Text>

            {googleAuthEnabled && (
              <Button variant="secondary" style={styles.fullBtn} disabled={busy} onPress={() => handleGoogle(role)}>
                Continuar con Google
              </Button>
            )}

            <Pressable onPress={() => { setError(""); setRole(null); }} disabled={busy}>
              <Text style={styles.back}>← Volver</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

function RoleCard({ title, subtitle, icon, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.roleCard, pressed && { borderColor: C.accent }]}
    >
      <View style={styles.roleIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.roleTitle}>{title}</Text>
        <Text style={styles.roleSubtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center", padding: 24 },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: C.surface,
    borderRadius: radiusLg,
    padding: 30,
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  check: { width: 22, height: 12, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: C.accent, transform: [{ rotate: "-45deg" }] },
  title: { fontSize: 24, fontWeight: "500", color: C.textCard },
  subtitle: { fontSize: 13, color: C.textCardMuted, marginBottom: 26 },
  prompt: { fontSize: 19, fontWeight: "500", color: C.textCard, marginBottom: 8, alignSelf: "center" },
  error: { fontSize: 12, color: C.dangerTextOnLight, marginTop: 10, textAlign: "center" },
  roleCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(145,132,217,0.35)",
    backgroundColor: "rgba(145,132,217,0.06)",
    borderRadius: radiusMd,
    padding: 14,
    marginTop: 10,
    shadowColor: C.accent,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  roleIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(145,132,217,0.18)", alignItems: "center", justifyContent: "center" },
  roleTitle: { fontSize: 15, fontWeight: "500", color: C.textCard },
  roleSubtitle: { fontSize: 12.5, color: C.textCardMuted, marginTop: 1 },
  input: {
    width: "100%",
    height: 44,
    borderRadius: radiusMd,
    borderWidth: 1,
    borderColor: C.cardDivider,
    paddingHorizontal: 14,
    color: C.textCard,
    fontSize: 14,
    marginTop: 10,
  },
  fullBtn: { width: "100%", marginTop: 10 },
  hint: { fontSize: 11, color: C.textCardMuted, marginTop: 8, textAlign: "center" },
  back: { color: C.accentText, fontSize: 12, opacity: 0.8, marginTop: 14 },
});
