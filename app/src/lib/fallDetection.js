import { Accelerometer } from "expo-sensors";

// Detección de caída simple, en primer plano (mientras mamá tiene la app
// abierta): patrón "caída libre corta" (el celu queda casi sin peso un
// instante, al caer) seguido de un "impacto" fuerte (golpe contra el
// piso/mueble). No es infalible, pero es el mismo principio que usan los
// relojes inteligentes.
//
// Limitación real: expo-sensors no soporta correr en background — a
// diferencia de la ubicación (que sí tiene expo-task-manager), esto solo
// funciona con la app abierta en el celu. Documentado en PROGRESS.md.
const FREE_FALL_G = 0.55; // casi sin peso (antes 0.4 — muy estricto)
const IMPACT_G = 1.8; // golpe (antes 2.5 — pensado para piso duro, no un sillón)
const IMPACT_WINDOW_MS = 1200; // el golpe tiene que venir poco después de la caída libre
const COOLDOWN_MS = 30 * 1000; // no repetir avisos por el mismo golpe

export function startFallDetection(onFallDetected) {
  let freeFallAt = null;
  let lastTriggeredAt = 0;
  Accelerometer.setUpdateInterval(100);

  const sub = Accelerometer.addListener(({ x, y, z }) => {
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    const now = Date.now();

    if (magnitude < FREE_FALL_G) {
      freeFallAt = now;
      return;
    }

    if (
      freeFallAt &&
      now - freeFallAt <= IMPACT_WINDOW_MS &&
      magnitude >= IMPACT_G &&
      now - lastTriggeredAt >= COOLDOWN_MS
    ) {
      lastTriggeredAt = now;
      freeFallAt = null;
      onFallDetected();
    }
  });

  return () => sub.remove();
}
