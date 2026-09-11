import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { radiusMd } from "../theme/colors";

const GREEN = "#2f9e58";
const RED = "#e0716b";

// Estado general arriba del mapa: verde tranquilo cuando no hay nada, rojo
// con glow pulsante apenas hay una emergencia activa.
export default function StatusBanner({ alert }) {
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!alert) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 700, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [alert, glow]);

  if (!alert) {
    return (
      <View style={[styles.banner, { borderColor: GREEN, backgroundColor: "#eaf6ee" }]}>
        <Text style={[styles.title, { color: "#1f7a3f" }]}>Todo en orden</Text>
        <Text style={styles.subtitle}>Sin emergencias activas</Text>
      </View>
    );
  }

  const shadowRadius = glow.interpolate({ inputRange: [0, 1], outputRange: [4, 20] });

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          borderColor: RED,
          backgroundColor: "#fceceb",
          shadowColor: RED,
          shadowOpacity: 0.9,
          shadowRadius,
          shadowOffset: { width: 0, height: 0 },
          elevation: 10,
        },
      ]}
    >
      <Text style={[styles.title, { color: "#b23b33" }]}>Emergencia activada</Text>
      <Text style={styles.subtitle}>Pidió ayuda hace un momento</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: { borderWidth: 1.5, borderRadius: radiusMd, padding: 12 },
  title: { fontWeight: "600", fontSize: 13 },
  subtitle: { color: "#4a4a52", fontSize: 11, marginTop: 2 },
});
