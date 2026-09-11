import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { radiusMd } from "../theme/colors";

function isToday(date) {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

// Cartel de estado de conexión de mamá, con un glow que pulsa despacio —
// también le da aire real al final del scroll para que la última fila de
// actividad no quede pegada al borde de la pantalla.
//
// "Conectado" no exige un ping reciente (su celu puede estar con la
// pantalla apagada, sigue contando) — alcanza con que haya escrito algo
// HOY y que la batería no esté en 0. Solo se marca "No conectados" si
// parece que el celular está apagado (sin actividad hoy) o sin batería.
export default function ConnectedFooter({ lastSeen, batteryLevel }) {
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

  // Recalcula al pasar la medianoche (o cualquier cambio de día) aunque
  // no llegue ningún dato nuevo.
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const lastSeenDate = lastSeen ? new Date(lastSeen) : null;
  const batteryDead = batteryLevel === 0;
  const isConnected = !batteryDead && lastSeenDate && isToday(lastSeenDate);
  const color = isConnected ? "#f5d949" : "#9aa0b0";
  const label = isConnected ? "Conectado a MamaCheck!" : "No conectados";

  const opacity = glow.interpolate({ inputRange: [0, 1], outputRange: isConnected ? [0.55, 1] : [0.8, 1] });
  const scale = glow.interpolate({ inputRange: [0, 1], outputRange: isConnected ? [0.98, 1.03] : [1, 1] });

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
