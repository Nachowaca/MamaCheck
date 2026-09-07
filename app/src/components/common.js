import { View, Text, Pressable, StyleSheet } from "react-native";
import { C, radiusMd } from "../theme/colors";

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Tag({ children, variant = "outline" }) {
  return (
    <View style={[styles.tag, tagVariants[variant]]}>
      <Text style={[styles.tagText, tagTextVariants[variant]]}>{children}</Text>
    </View>
  );
}

export function Button({ children, onPress, variant = "primary", style, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        btnVariants[variant],
        disabled && styles.btnDisabled,
        pressed && !disabled && styles.btnPressed,
        style,
      ]}
    >
      <Text style={[styles.btnText, btnTextVariants[variant]]}>{children}</Text>
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
  accent: { backgroundColor: C.accent800 },
  outline: { borderWidth: 1, borderColor: C.accent, backgroundColor: "transparent" },
  neutral: { backgroundColor: C.neutral800 },
});
const tagTextVariants = StyleSheet.create({
  accent: { color: C.accent100 },
  outline: { color: C.accent },
  neutral: { color: "#f3f5fe" },
});

const btnVariants = StyleSheet.create({
  primary: { borderWidth: 1, borderColor: C.accent, backgroundColor: "transparent" },
  secondary: { borderWidth: 1, borderColor: C.divider, backgroundColor: "transparent" },
  ghost: { backgroundColor: "transparent" },
  ghostDanger: { borderWidth: 1, borderColor: C.danger, backgroundColor: "transparent" },
});
const btnTextVariants = StyleSheet.create({
  primary: { color: C.accent },
  secondary: { color: C.text },
  ghost: { color: C.accent },
  ghostDanger: { color: C.dangerText },
});
