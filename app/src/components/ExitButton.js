import { Pressable, Text, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { C } from "../theme/colors";

function ExitIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={C.text} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 17l5-5-5-5" stroke={C.text} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 12H9" stroke={C.text} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function ExitButton({ onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed, style]}
    >
      <ExitIcon />
      <Text style={styles.text}>Salir</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.shellDivider,
    backgroundColor: C.shellChip,
  },
  pressed: { opacity: 0.7 },
  text: { color: C.text, fontSize: 14, fontWeight: "500" },
});
