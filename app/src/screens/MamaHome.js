import { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Linking, ScrollView } from "react-native";
import { C, radiusLg, radiusMd } from "../theme/colors";
import { useAuth } from "../lib/AuthContext";
import { useContacts, useAlerts } from "../hooks/useHouseholdData";
import { startBackgroundLocation, writeCurrentLocationOnce } from "../lib/locationTask";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

export default function MamaHome() {
  const { profile, session, signOut } = useAuth();
  const { contacts } = useContacts(profile?.household_id);
  const { sendAlert } = useAlerts(profile?.household_id);
  const [checkInNote, setCheckInNote] = useState("Todavía no avisaste hoy");
  const [sosOpen, setSosOpen] = useState(false);
  const [sosSent, setSosSent] = useState(false);

  useEffect(() => {
    startBackgroundLocation().catch((e) => console.warn("background location:", e?.message ?? e));

    // Mientras el background no funcione en Expo Go: manda la ubicación real
    // apenas abre la app, y de nuevo cada 2 min mientras la tenga abierta.
    writeCurrentLocationOnce().catch((e) => console.warn("foreground location:", e?.message ?? e));
    const interval = setInterval(() => {
      writeCurrentLocationOnce().catch((e) => console.warn("foreground location:", e?.message ?? e));
    }, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  function checkIn() {
    setCheckInNote("Avisamos a tu familia recién ahora");
    sendAlert({ userId: session?.user?.id, type: "checkin", text: 'Check-in: "Estoy bien"' });
  }

  function sendSos() {
    setSosOpen(false);
    setSosSent(true);
    sendAlert({ userId: session?.user?.id, type: "sos", text: "Pidió ayuda (SOS)" });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {greeting()}, {profile?.name ?? session?.user?.email?.split("@")[0]}
        </Text>
        <Pressable onPress={signOut} style={styles.exitBtn} hitSlop={8}>
          <Text style={styles.exitBtnText}>Salir</Text>
        </Pressable>
      </View>

      <Pressable onPress={checkIn} style={styles.checkinBtn}>
        <View style={styles.check} />
        <Text style={styles.checkinText}>Estoy bien</Text>
      </Pressable>
      <Text style={styles.checkinNote}>{checkInNote}</Text>

      <View style={{ width: "100%", gap: 8 }}>
        {contacts.map((c) => (
          <ContactRow key={c.id} contact={c} />
        ))}
      </View>

      <Pressable style={styles.sosBtn} onPress={() => setSosOpen(true)}>
        <Text style={styles.sosText}>Necesito ayuda</Text>
      </Pressable>

      <Text style={styles.footer}>Tu familia puede ver que estás bien</Text>

      {sosOpen && (
        <Dialog>
          <Text style={styles.dialogTitle}>¿Pedir ayuda?</Text>
          <Text style={styles.dialogBody}>Le avisamos a tu familia ahora mismo con tu ubicación.</Text>
          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
            <Pressable style={styles.dialogBtnSecondary} onPress={() => setSosOpen(false)}>
              <Text style={styles.dialogBtnSecondaryText}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.dialogBtnDanger} onPress={sendSos}>
              <Text style={styles.dialogBtnDangerText}>Sí, avisar</Text>
            </Pressable>
          </View>
        </Dialog>
      )}
      {sosSent && (
        <Dialog>
          <View style={{ alignItems: "center", gap: 12 }}>
            <View style={styles.sosDoneIcon} />
            <Text style={styles.dialogTitle}>Le avisamos a tu familia</Text>
            <Text style={styles.dialogBody}>Ya lo saben.</Text>
            <Pressable style={styles.dialogBtnSecondary} onPress={() => setSosSent(false)}>
              <Text style={styles.dialogBtnSecondaryText}>Cerrar</Text>
            </Pressable>
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
  container: { flexGrow: 1, backgroundColor: C.bg, alignItems: "center", padding: 24, gap: 22 },
  header: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 12 },
  greeting: { fontSize: 22, fontWeight: "500", color: C.text, textAlign: "center", flex: 1 },
  exitBtn: { position: "absolute", right: 0, paddingVertical: 4, paddingHorizontal: 8 },
  exitBtnText: { fontSize: 13, color: C.accent, opacity: 0.7 },
  checkinBtn: {
    width: 220, height: 220, borderRadius: 110,
    borderWidth: 2, borderColor: C.accent,
    alignItems: "center", justifyContent: "center", gap: 10,
  },
  check: { width: 34, height: 18, borderLeftWidth: 3, borderBottomWidth: 3, borderColor: C.accent, transform: [{ rotate: "-45deg" }], marginBottom: 4 },
  checkinText: { color: C.accent, fontWeight: "500", fontSize: 22 },
  checkinNote: { fontSize: 16, color: C.text, opacity: 0.7 },
  contactRow: {
    flexDirection: "row", alignItems: "center", gap: 12, width: "100%",
    backgroundColor: C.surface, borderRadius: radiusLg, padding: 12, paddingHorizontal: 16,
  },
  contactAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.neutral800, alignItems: "center", justifyContent: "center" },
  contactInitial: { color: C.accent, fontSize: 17 },
  contactName: { fontSize: 18, fontWeight: "500", color: C.text },
  contactNote: { fontSize: 14, color: C.text, opacity: 0.65 },
  callBtn: { width: 36, height: 36, borderRadius: radiusMd, borderWidth: 1, borderColor: C.divider, alignItems: "center", justifyContent: "center" },
  callIcon: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.6, borderColor: C.text },
  sosBtn: { width: "100%", height: 52, borderRadius: radiusMd, borderWidth: 1, borderColor: C.danger, alignItems: "center", justifyContent: "center" },
  sosText: { color: C.dangerText, fontWeight: "500", fontSize: 18 },
  footer: { fontSize: 14, color: C.text, opacity: 0.55, textAlign: "center" },
  dialogOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(41,43,49,0.5)", alignItems: "center", justifyContent: "center", padding: 16 },
  dialogCard: { width: "100%", maxWidth: 380, backgroundColor: C.surface, borderRadius: radiusLg, padding: 20, gap: 12 },
  dialogTitle: { fontSize: 20, fontWeight: "500", color: C.text },
  dialogBody: { fontSize: 16, color: C.text, opacity: 0.85 },
  dialogBtnSecondary: { borderWidth: 1, borderColor: C.divider, borderRadius: radiusMd, paddingHorizontal: 12, height: 40, alignItems: "center", justifyContent: "center" },
  dialogBtnSecondaryText: { color: C.text, fontWeight: "500" },
  dialogBtnDanger: { borderWidth: 1, borderColor: C.danger, borderRadius: radiusMd, paddingHorizontal: 12, height: 40, alignItems: "center", justifyContent: "center" },
  dialogBtnDangerText: { color: C.dangerText, fontWeight: "500" },
  sosDoneIcon: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: C.danger },
});
