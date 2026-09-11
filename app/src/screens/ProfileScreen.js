import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { C, radiusMd } from "../theme/colors";
import { useAuth } from "../lib/AuthContext";
import { Card, Tag, Button } from "../components/common";

const NOTIFICATIONS = [
  "Alertas de caída o inactividad",
  "Salida de zona segura",
  "Resumen diario con IA",
];

export default function ProfileScreen({ onBack, mama }) {
  const { profile, session, signOut } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.backRow}>
        <Pressable onPress={onBack} hitSlop={8} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
          <Text style={styles.back}>← Volver</Text>
        </Pressable>
      </View>

      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>{(profile?.name ?? "N")[0]}</Text>
        </View>
        <View>
          <Text style={styles.name}>{profile?.name ?? "Nacho"}</Text>
          <Text style={styles.email}>{profile?.email ?? session?.user?.email}</Text>
        </View>
      </View>

      <View>
        <Text style={styles.sectionTitle}>Conectado con</Text>
        <Card style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14 }}>
          <View style={styles.miniAvatar}>
            <Text style={{ color: C.accentText }}>{(mama?.name ?? "M")[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{mama?.name ?? "Sin vincular todavía"}</Text>
            <Text style={styles.rowNote}>
              {mama ? "Cuenta separada · vinculada" : "Se vincula cuando ella elige su rol"}
            </Text>
          </View>
          {mama && <Tag variant="accent">Activo</Tag>}
        </Card>
      </View>

      <View>
        <Text style={styles.sectionTitle}>Notificaciones</Text>
        <View style={{ gap: 8 }}>
          {NOTIFICATIONS.map((t) => (
            <Card key={t} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 }}>
              <Text style={{ color: C.textCard, fontSize: 13 }}>{t}</Text>
              <Tag variant="outline">Activas</Tag>
            </Card>
          ))}
        </View>
      </View>

      <Button variant="secondary" onDark onPress={signOut}>
        Cerrar sesión
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: C.bg, padding: 16, paddingTop: 44, gap: 18 },
  backRow: { flexDirection: "row", justifyContent: "flex-end" },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.shellDivider,
    backgroundColor: C.shellChip,
  },
  back: { color: C.accent, fontSize: 14, fontWeight: "500" },
  identity: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.shellChip, alignItems: "center", justifyContent: "center" },
  avatarInitial: { color: C.accent, fontSize: 20 },
  name: { fontSize: 17, fontWeight: "500", color: C.text },
  email: { fontSize: 13, color: C.text, opacity: 0.65 },
  sectionTitle: { fontSize: 13, color: C.text, opacity: 0.7, marginBottom: 8 },
  miniAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surfaceAlt, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontSize: 14, fontWeight: "500", color: C.textCard },
  rowNote: { fontSize: 12, color: C.textCardMuted },
});
