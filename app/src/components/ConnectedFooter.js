import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { radiusMd } from "../theme/colors";

// Mamá manda su ubicación cada 4 min (ver locationTask.js/MamaHome.js) —
// si no llegó nada en bastante más que eso, asumimos que cerró la app o
// se le apagó el celular. Margen generoso para no marcar "desconectada"
// por una demora de red puntual.
const STALE_AFTER_MS = 12 * 60 * 1000;

// Cartel de estado de conexión de mamá, con un glow que pulsa despacio —
// también le da aire real al final del scroll para que la última fila de
// actividad no quede pegada al borde de la pantalla.
export default function ConnectedFooter({ lastSeen }) {
  const glow = useRef(new Animated.Value(0)).current;
  const [, forceTick] = useState(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glow]);

  // Recalcula "hace X min" cada 30s aunque no llegue ningún dato nuevo.
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 30 * 1000);
    return () => clearInterval(t);
  }, []);

  const lastSeenDate = lastSeen ? new Date(lastSeen) : null;
  const isFresh = lastSeenDate && Date.now() - lastSeenDate.getTime() <= STALE_AFTER_MS;
  const color = isFresh ? "#f5d949" : "#9aa0b0";
  const label = isFresh ? "Conectado a MamaCheck!" : "No conectados";

  const opacity = glow.interpolate({ inputRange: [0, 1], outputRange: isFresh ? [0.55, 1] : [0.8, 1] });
  const scale = glow.interpolate({ inputRange: [0, 1], outputRange: isFresh ? [0.98, 1.03] : [1, 1] });

  return (
    <Animated.View style={styles.footer}>
      <Animated.Text
        style={[
          styles.text,
          { color, textShadowColor: color, opacity, transform: [{ scale }] },
        ]}
      >
        {label}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  footer: {
    marginTop: 8,
    paddingVertical: 22,
    borderRadius: radiusMd,
    backgroundColor: "#0b0c12",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});
