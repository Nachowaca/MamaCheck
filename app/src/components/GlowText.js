import { useEffect, useRef } from "react";
import { Animated } from "react-native";

// Texto con un glow que pulsa despacio — mismo patrón de animación que
// ConnectedFooter, pero reusable para cualquier texto suelto.
export default function GlowText({ children, style, color = "#ffffff" }) {
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

  const opacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const scale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.02] });

  return (
    <Animated.Text
      style={[
        style,
        {
          opacity,
          transform: [{ scale }],
          textShadowColor: color,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 10,
        },
      ]}
    >
      {children}
    </Animated.Text>
  );
}
