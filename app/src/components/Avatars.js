import Svg, { Circle, Path } from "react-native-svg";
import { C } from "../theme/colors";

// Avatares simples, línea monoline (mismo lenguaje visual que el resto de
// la app: sin relleno, trazos finos, un solo color de acento — salvo el
// pelo castaño de mamá, único acento de color permitido acá).

export function NachoAvatar({ size = 24 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8.5" r="3.5" stroke={C.accent} strokeWidth={1.6} />
      <Path
        d="M5 20c0-3.6 3.13-6.5 7-6.5s7 2.9 7 6.5"
        stroke={C.accent}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function MamaAvatar({ size = 24 }) {
  const brown = "#a9764f";
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* pelo castaño, como un gorro sobre la cabeza */}
      <Path d="M7.3 9.5a4.7 4.7 0 0 1 9.4 0v1.4c-.9-.7-1.9-1.5-2.2-2.4-1 .9-3.2 1.6-5.1 1.6-.9 0-1.6-.2-2.1-.4v-.2Z" fill={brown} />
      {/* cabeza */}
      <Circle cx="12" cy="9" r="3.7" stroke={C.accent} strokeWidth={1.5} />
      {/* sonrisa */}
      <Path d="M10.2 9.7c.5.7 1.1 1 1.8 1s1.3-.3 1.8-1" stroke={C.accent} strokeWidth={1.3} strokeLinecap="round" />
      {/* hombros */}
      <Path
        d="M5 20c0-3.6 3.13-6.5 7-6.5s7 2.9 7 6.5"
        stroke={C.accent}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}
