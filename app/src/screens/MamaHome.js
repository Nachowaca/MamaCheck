import { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Linking, ScrollView } from "react-native";
import { C, radiusLg, radiusMd } from "../theme/colors";
import { useAuth } from "../lib/AuthContext";
import { useContacts, useAlerts } from "../hooks/useHouseholdData";
import { startBackgroundLocation, writeCurrentLocationOnce } from "../lib/locationTask";
import { scheduleCheckinReminder } from "../lib/pushNotifications";
import { reportBatteryStatus } from "../lib/battery";
import ExitButton from "../components/ExitButton";
import GlowText from "../components/GlowText";
import { Button } from "../components/common";

const CHECKIN_GREEN = "#4cd97b";

function todayLabel() {
  const d = new Date().toLocaleDateString("es-UY", { day: "numeric", month: "long", year: "numeric" });
  return d.charAt(0).toUpperCase() + d.slice(1);
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

function isDaytime() {
  const h = new Date().getHours();
  return h >= 6 && h < 19;
}

export default function MamaHome() {
  const { profile, session, signOut } = useAuth();
  const { contacts } = useContacts(profile?.household_id);
  const { sendAlert } = useAlerts(profile?.household_id);
  const [checkInNote, setCheckInNote] = useState("Toca el círculo para activar el aviso");
  const [sosOpen, setSosOpen] = useState(false);
  const [sosSent, setSosSent] = useState(false);

  useEffect(() => {
    scheduleCheckinReminder().catch((e) => console.warn("checkin reminder:", e?.message ?? e));

    startBackgroundLocation().catch((e) => console.warn("background location:", e?.message ?? e));

    // Mientras el background no funcione en Expo Go: manda la ubicación real
    // apenas abre la app, y de nuevo cada 4 min mientras la tenga abierta.
    writeCurrentLocationOnce().catch((e) => console.warn("foreground location:", e?.message ?? e));
    reportBatteryStatus();
    const interval = setInterval(() => {
      writeCurrentLocationOnce().catch((e) => console.warn("foreground location:", e?.message ?? e));
      reportBatteryStatus();
    }, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  function checkIn() {
    setCheckInNote(isDaytime() ? "Disfruta tu día, te queremos!" : "Que tengas buen descanso");
    sendAlert({ userId: session?.user?.id, type: "checkin", text: 'Check-in: "Estoy bien"' });
    scheduleCheckinReminder().catch((e) => console.warn("checkin reminder:", e?.message ?? e));
  }

  function sendSos() {
    setSosOpen(false);
    setSosSent(true);
    sendAlert({ userId: session?.user?.id, type: "sos", text: "Pidió ayuda (SOS)" });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <ExitButton onPress={signOut} />
      </View>
      <Text style={styles.greeting}>
        {greeting()}, {profile?.name ?? session?.user?.email?.split("@")[0]} 😊
      </Text>

      <Pressable onPress={checkIn} style={styles.checkinBtn}>
        <View style={styles.check} />
        <Text style={styles.checkinText}>Estoy bien</Text>
      </Pressable>
      <GlowText style={styles.checkinNote} color={C.accent}>{checkInNote}</GlowText>

      <View style={{ width: "100%", gap: 8 }}>
        {contacts.map((c) => (
          <ContactRow key={c.id} contact={c} />
        ))}
      </View>

      <Button variant="ghostDanger" onDark style={styles.sosBtn} onPress={() => setSosOpen(true)}>
        Necesito ayuda
      </Button>

      <GlowText style={styles.footer}>Tu familia puede ver que estás bien</GlowText>
      <GlowText style={styles.credit}>App creada por Nacho ❤️</GlowText>
      <Text style={styles.date}>{todayLabel()}</Text>

      {sosOpen && (
        <Dialog>
          <Text style={styles.dialogTitle}>¿Pedir ayuda?</Text>
          <Text style={styles.dialogBody}>Le avisamos a tu familia ahora mismo con tu ubicación.</Text>
          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
            <Button variant="secondary" style={styles.dialogBtn} onPress={() => setSosOpen(false)}>
              Cancelar
            </Button>
            <Button variant="ghostDanger" style={styles.dialogBtn} onPress={sendSos}>
              Sí, avisar
            </Button>
          </View>
        </Dialog>
      )}
      {sosSent && (
        <Dialog>
          <View style={{ alignItems: "center", gap: 12 }}>
            <View style={styles.sosDoneIcon} />
            <Text style={styles.dialogTitle}>Le avisamos a tu familia</Text>
            <Text style={styles.dialogBody}>Ya lo saben.</Text>
            <Button variant="secondary" onPress={() => setSosSent(false)}>
              Cerrar
            </Button>
          </View>
        </Dialog>
      )}
    </ScrollView>
  );
}

function ContactRow({ contact }) {
  return (
    <View style={styles.contactRow}>
      <View style={styles.contactAvatar}>
        <Text style={styles.contactInitial}>{contact.initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.contactName}>{contact.name}</Text>
        <Text style={styles.contactNote}>Toca para llamar</Text>
      </View>
      <Pressable style={styles.callBtn} onPress={() => Linking.openURL(`tel:${contact.phone}`)}>
        <View style={styles.callIcon} />
      </Pressable>
    </View>
  );
}

function Dialog({ children }) {
  return (
    <View style={styles.dialogOverlay}>
      <View style={styles.dialogCard}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: C.bg, alignItems: "center", padding: 24, paddingBottom: 64, gap: 22 },
  header: { width: "100%", flexDirection: "row", justifyContent: "flex-end" },
  greeting: { fontSize: 22, fontWeight: "500", color: C.text, textAlign: "center" },
  checkinBtn: {
    width: 220, height: 220, borderRadius: 110,
    borderWidth: 1.5, borderColor: CHECKIN_GREEN,
    alignItems: "center", justifyContent: "center", gap: 10,
    shadowColor: CHECKIN_GREEN,
    shadowOpacity: 0.8,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  check: { width: 34, height: 18, borderLeftWidth: 3, borderBottomWidth: 3, borderColor: CHECKIN_GREEN, transform: [{ rotate: "-45deg" }], marginBottom: 4 },
  checkinText: { color: CHECKIN_GREEN, fontWeight: "500", fontSize: 22 },
  checkinNote: { fontSize: 16, color: C.text, opacity: 0.7 },
  contactRow: {
    flexDirection: "row", alignItems: "center", gap: 12, width: "100%",
    backgroundColor: C.surface, borderRadius: radiusLg, padding: 12, paddingHorizontal: 16,
  },
  contactAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.surfaceAlt, alignItems: "center", justifyContent: "center" },
  contactInitial: { color: C.accentText, fontSize: 17 },
  contactName: { fontSize: 18, fontWeight: "500", color: C.textCard },
  contactNote: { fontSize: 14, color: C.textCardMuted },
  callBtn: { width: 36, height: 36, borderRadius: radiusMd, borderWidth: 1, borderColor: C.cardDivider, alignItems: "center", justifyContent: "center" },
  callIcon: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.6, borderColor: C.textCard },
  sosBtn: { width: 190, height: 44, alignSelf: "center" },
  footer: { fontSize: 14, color: "#ffffff", fontWeight: "600", textAlign: "center" },
  credit: { fontSize: 12, color: "#ffffff", fontWeight: "500", textAlign: "center" },
  date: { fontSize: 11, color: C.text, opacity: 0.45, textAlign: "center" },
  dialogOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(41,43,49,0.5)", alignItems: "center", justifyContent: "center", padding: 16 },
  dialogCard: { width: "100%", maxWidth: 380, backgroundColor: C.surface, borderRadius: radiusLg, padding: 20, gap: 12 },
  dialogTitle: { fontSize: 20, fontWeight: "500", color: C.textCard },
  dialogBody: { fontSize: 16, color: C.textCardMuted },
  dialogBtn: { height: 40, paddingHorizontal: 16 },
  sosDoneIcon: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: C.danger },
});
