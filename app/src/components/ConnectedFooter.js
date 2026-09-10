import { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import { radiusMd } from "../theme/colors";

// Cartel de "conectado" con un glow que pulsa despacio — también le da
// aire real al final del scroll para que la última fila de actividad no
// quede pegada al borde de la pantalla.
export default function ConnectedFooter() {
  const glow = useRef(new Animated.Value(0)).current;

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

  const opacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
  const scale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.03] });

  return (
    <Animated.View style={styles.footer}>
      <Animated.Text style={[styles.text, { opacity, transform: [{ scale }] }]}>
        Conectado a MamaCheck!
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
    color: "#f5d949",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    textShadowColor: "#f5d949",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});
