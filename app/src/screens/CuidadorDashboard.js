import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Linking } from "react-native";
import { C, radiusMd } from "../theme/colors";
import { useAuth } from "../lib/AuthContext";
import { useAlerts, useLatestLocation, useSafeZones, useOtherProfile } from "../hooks/useHouseholdData";
import OsmMap from "../components/OsmMap";
import { Card, Tag, Button } from "../components/common";
import ProfileScreen from "./ProfileScreen";
import ExitButton from "../components/ExitButton";

const QUICK_MESSAGES = [
  "Todo bien, gracias por avisar",
  "Te llamo en 5 minutos",
  "¿Tomaste la medicación?",
];

export default function CuidadorDashboard() {
  const { profile, signOut } = useAuth();
  const householdId = profile?.household_id;
  const { alerts, sendAlert } = useAlerts(householdId);
  const zones = useSafeZones(householdId);
  const mama = useOtherProfile(householdId, "mama");
  const mamaLocation = useLatestLocation(householdId, mama?.id);
  const [chatOpen, setChatOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const lastSos = alerts.find((a) => a.type === "sos");

  if (showProfile) {
    return <ProfileScreen onBack={() => setShowProfile(false)} mama={mama} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.hello}>Hola</Text>
          <Text style={styles.name}>{profile?.name ?? "Nacho"}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <ExitButton onPress={signOut} />
          <Pressable onPress={() => setShowProfile(true)} style={styles.avatar}>
            <Text style={{ color: C.accent }}>{(profile?.name ?? "N")[0]}</Text>
          </Pressable>
        </View>
      </View>

      {lastSos && (
        <View style={styles.sosBanner}>
          <View>
            <Text style={styles.sosTitle}>Emergencia activada</Text>
            <Text style={styles.sosSubtitle}>Pidió ayuda hace un momento</Text>
          </View>
        </View>
      )}

      <OsmMap
        lat={mamaLocation?.lat ?? zones[0]?.lat}
        lng={mamaLocation?.lng ?? zones[0]?.lng}
        zones={zones}
      />

      <Card style={{ gap: 10 }}>
        <Text style={styles.aiLabel}>Análisis de IA</Text>
        <Text style={styles.aiBody}>Generar estará habilitado en versiones futuras.</Text>
        <Button variant="secondary" disabled>
          Generar
        </Button>
      </Card>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Button variant="secondary" onDark style={{ flex: 1 }} onPress={() => setChatOpen(true)}>
          Mensaje rápido
        </Button>
        <Button
          variant="primary"
          onDark
          style={{ flex: 1 }}
          onPress={() => mama?.phone && Linking.openURL(`tel:${mama.phone}`)}
        >
          Llamar
        </Button>
      </View>

      <View>
        <Text style={styles.sectionTitle}>Actividad reciente</Text>
        <View style={{ gap: 8 }}>
          {alerts.map((a) => (
            <Card key={a.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 10 }}>
              <Tag variant={a.type === "sos" ? "outline" : "neutral"}>
                {new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Tag>
              <Text style={{ color: C.textCard, fontSize: 13, flex: 1 }}>{a.text}</Text>
            </Card>
          ))}
          {alerts.length === 0 && (
            <Text style={{ color: C.text, opacity: 0.5, fontSize: 13 }}>Todavía no hay actividad.</Text>
          )}
        </View>
      </View>

      {chatOpen && (
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Mensaje rápido</Text>
            <Text style={styles.dialogBody}>Se envía como notificación simple a su teléfono.</Text>
            <View style={{ gap: 8 }}>
              {QUICK_MESSAGES.map((m) => (
                <Button
                  key={m}
                  variant="secondary"
                  onPress={() => {
                    sendAlert({ userId: profile?.id, type: "message", text: m });
                    setChatOpen(false);
                  }}
                >
                  {m}
                </Button>
              ))}
            </View>
            <Pressable onPress={() => setChatOpen(false)} style={{ alignSelf: "flex-end" }}>
              <Text style={{ color: C.accentText }}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: C.bg, padding: 16, gap: 14 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hello: { fontSize: 12, color: C.text, opacity: 0.6 },
  name: { fontSize: 20, fontWeight: "500", color: C.text },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.shellChip, borderWidth: 1, borderColor: C.shellDivider, alignItems: "center", justifyContent: "center" },
  sosBanner: { borderWidth: 1, borderColor: C.danger, borderRadius: radiusMd, backgroundColor: "#fceceb", padding: 12 },
  sosTitle: { color: C.dangerTextOnLight, fontWeight: "500", fontSize: 13 },
  sosSubtitle: { color: C.textCardMuted, fontSize: 11 },
  aiLabel: { color: C.accentText, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" },
  aiTitle: { color: C.textCard, fontSize: 15, fontWeight: "500" },
  aiBody: { color: C.textCardMuted, fontSize: 13 },
  aiError: { color: C.dangerTextOnLight, fontSize: 12 },
  sectionTitle: { color: C.text, opacity: 0.7, fontSize: 13, marginBottom: 8 },
  dialogOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(41,43,49,0.5)", alignItems: "center", justifyContent: "center", padding: 16 },
  dialogCard: { width: "100%", maxWidth: 440, backgroundColor: C.surface, borderRadius: 14, padding: 20, gap: 12 },
  dialogTitle: { fontSize: 20, fontWeight: "500", color: C.textCard },
  dialogBody: { fontSize: 14, color: C.textCardMuted },
});
