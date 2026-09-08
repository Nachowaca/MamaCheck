// Híbrido (2026-09-08, confirmado con Nacho): el shell general de la app
// sigue oscuro, pero las tarjetas/contenido pasan a ser claras — mejor
// contraste, más fácil de leer para mamá. El violeta de acento se mantiene
// en los dos contextos.
export const C = {
  // Shell (fondo general, headers, elementos flotando directo sobre el fondo)
  bg: "#161826",
  text: "#e9e9ed",
  shellChip: "#292b31", // avatar/botón redondo flotando sobre el shell oscuro
  shellDivider: "rgba(233,233,237,0.16)",

  // Tarjetas / contenido (claro)
  surface: "#f6f4fd",
  surfaceAlt: "#ece7fa", // chip/avatar dentro de una tarjeta clara
  textCard: "#221f36",
  textCardMuted: "#5b5770",
  cardDivider: "rgba(34,31,54,0.10)",

  // Acento violeta — igual en los dos contextos
  accent: "#9184d9",
  accentText: "#5b4bc4", // texto/ícono violeta con más contraste sobre superficie clara
  accent100: "#f5f4ff",
  accent800: "#423a6a",

  // Estados
  danger: "#e0716b",
  dangerText: "#f0a29d", // sobre shell oscuro
  dangerTextOnLight: "#b23b33", // sobre tarjeta clara
};

export const radiusMd = 8;
export const radiusLg = 14;
