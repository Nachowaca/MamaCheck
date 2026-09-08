import { View, Text, Pressable, StyleSheet } from "react-native";
import { C, radiusMd } from "../theme/colors";

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// Tag siempre vive adentro de una Card (superficie clara) — texto oscuro.
export function Tag({ children, variant = "outline" }) {
  return (
    <View style={[styles.tag, tagVariants[variant]]}>
      <Text style={[styles.tagText, tagTextVariants[variant]]}>{children}</Text>
    </View>
  );
}

// onDark: true cuando el botón flota directo sobre el fondo oscuro del
// shell (no adentro de una Card) — cambia a texto claro para que se lea.
export function Button({ children, onPress, variant = "primary", onDark = false, style, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        onDark ? btnVariantsDark[variant] : btnVariants[variant],
        disabled && styles.btnDisabled,
        pressed && !disabled && styles.btnPressed,
        style,
      ]}
    >
      <Text style={[styles.btnText, onDark ? btnTextVariantsDark[variant] : btnTextVariants[variant]]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: radiusMd,
    backgroundColor: C.surface,
    gap: 6,
  },
  tag: {
    alignSelf: "flex-start",
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  tagText: { fontSize: 11, letterSpacing: 0.2 },
  btn: {
    height: 44,
    borderRadius: radiusMd,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  btnPressed: { opacity: 0.75 },
  btnDisabled: { opacity: 0.45 },
  btnText: { fontSize: 14, fontWeight: "500" },
});

const tagVariants = StyleSheet.create({
  accent: { backgroundColor: C.accent100 },
  outline: { borderWidth: 1, borderColor: C.accent, backgroundColor: "transparent" },
  neutral: { backgroundColor: C.surfaceAlt },
});
const tagTextVariants = StyleSheet.create({
  accent: { color: C.accent800 },
  outline: { color: C.accentText },
  neutral: { color: C.textCard },
});

// Botones adentro de una Card / superficie clara (default)
const btnVariants = StyleSheet.create({
  primary: { borderWidth: 1, borderColor: C.accent, backgroundColor: "transparent" },
  secondary: { borderWidth: 1, borderColor: C.cardDivider, backgroundColor: "transparent" },
  ghost: { backgroundColor: "transparent" },
  ghostDanger: { borderWidth: 1, borderColor: C.danger, backgroundColor: "transparent" },
});
const btnTextVariants = StyleSheet.create({
  primary: { color: C.accentText },
  secondary: { color: C.textCard },
  ghost: { color: C.accentText },
  ghostDanger: { color: C.dangerTextOnLight },
});

// Botones flotando directo sobre el fondo oscuro del shell
const btnVariantsDark = StyleSheet.create({
  primary: { borderWidth: 1, borderColor: C.accent, backgroundColor: "transparent" },
  secondary: { borderWidth: 1, borderColor: C.shellDivider, backgroundColor: "transparent" },
  ghost: { backgroundColor: "transparent" },
  ghostDanger: { borderWidth: 1, borderColor: C.danger, backgroundColor: "transparent" },
});
const btnTextVariantsDark = StyleSheet.create({
  primary: { color: C.accent },
  secondary: { color: C.text },
  ghost: { color: C.accent },
  ghostDanger: { color: C.dangerText },
});
