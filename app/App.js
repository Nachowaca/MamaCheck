import "./src/lib/locationTask";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { AuthProvider, useAuth } from "./src/lib/AuthContext";
import { registerForPushToken } from "./src/lib/pushNotifications";
import { C } from "./src/theme/colors";
import LoginGate from "./src/screens/LoginGate";
import MamaHome from "./src/screens/MamaHome";
import CuidadorDashboard from "./src/screens/CuidadorDashboard";

function Root() {
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    if (profile?.role) {
      registerForPushToken()
        .then((result) => Alert.alert("Debug: push token", String(result))) // TEMPORAL, sacar después
        .catch((e) => {
          console.warn("push token:", e?.message ?? e);
          Alert.alert("Debug: push token — excepción", String(e?.message ?? e)); // TEMPORAL, sacar después
        });
    }
  }, [profile?.role]);

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  if (!session || !profile?.role) return <LoginGate />;
  if (profile.role === "mama") return <MamaHome />;
  return <CuidadorDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <Root />
        <StatusBar style="light" />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" },
});
