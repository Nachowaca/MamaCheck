# Plan: MamaCheck oficial, instalada en los dos celulares (sin Play Store)

Objetivo: la app funcionando de punta a punta, instalada de forma
definitiva en tu celular y el de mamá, sin depender de que Claude Code o
la compu estén prendidos. No pasa por Play Store (queda como instalación
directa del APK).

## 1. Cerrar lo que ya está en curso (bloqueante)

- [ ] Instalar el build "preview" actual (`APK_ACTUAL.md`) en **tu**
  celular definitivamente, confirmar login real + ubicación + zonas.
- [ ] Instalar el mismo APK en el **celular de mamá**, loguearla con su
  cuenta — hoy entra con auto-login fijo, no hace falta que ella escriba
  nada.
- [ ] Confirmar `push_token` guardado en Supabase para las dos cuentas.
- [ ] Probar un SOS real desde el celu de mamá con tu app cerrada del
  todo → confirmar que el push te llega en la barra de notificaciones,
  no solo en la app abierta.
- [ ] Probar ubicación en background real: dejar su celu quieto 10-15 min
  sin abrir la app y ver si igual se actualiza el punto en tu mapa.

## 2. Para que quede "instalación definitiva" y no un preview de prueba

- [ ] **Permisos de Android en el celu de mamá**: revisar manualmente que
  ubicación quede en "Permitir todo el tiempo" (no "solo mientras se usa
  la app") y que no tenga optimización de batería agresiva matando la
  app en segundo plano (esto varía por marca — Xiaomi/Samsung suelen
  necesitar un ajuste extra de "sin restricciones" en batería).
- [ ] Sacar la pantalla de rol si no hace falta más: hoy arranca en
  "¿Quién entra?" cada vez que cierra sesión — layo mamá nunca debería
  tener que tocar nada dos veces. Confirmar que con sesión persistida no
  vuelve a pedir esa pantalla salvo que ella misma toque "Salir".
- [ ] Ícono y nombre de la app en el launcher del celu — ya están
  configurados (`MamaCheck`, ícono propio), solo confirmar que se ven
  bien una vez instalada (no el ícono genérico de Expo).
- [ ] Revisar tamaño de fuente/botones en el celu real de mamá (no en
  el preview del navegador) — capaz hace falta agrandar algo para que
  le resulte cómodo sin que se lo tengas que explicar de nuevo.

## 3. Para poder actualizar la app sin reinstalar cada vez

Hoy, cada cambio de código nuevo requiere generar un build y volver a
instalar el APK a mano en los dos celulares. Alternativa:

- [ ] Evaluar `expo-updates` (OTA/"over the air"): permite que cambios de
  JS (no nativos) se bajen solos la próxima vez que abren la app, sin
  reinstalar. Requiere configurarlo una vez (channel de EAS Update) —
  lo dejamos para después de que las dos instalaciones estén estables,
  no es urgente ahora.

## 4. Funcionalidad pendiente (mejoras, no bloqueante)

- [ ] Pantalla simple para gestionar contactos y zonas seguras desde la
  app (hoy se cargan a mano por SQL) — así el día de mañana podés sumar
  o sacar un contacto vos mismo sin pedirme que corra un SQL.
- [ ] Análisis de IA con Claude: falta cargar `ANTHROPIC_API_KEY` en la
  Edge Function `analyze-mama` — quedó pausado la última vez por no
  tener claro el paso a paso, retomar cuando quieras.
- [ ] Ideas a futuro sin empezar: recordatorio de medicación, detección
  de caída, aviso de batería baja del celu de mamá, modo "no molestar"
  en ciertos horarios, botón de SOS con llamada directa a emergencias
  (no solo push).

## Orden sugerido

1. Sección 1 completa (esto es lo único que realmente falta para decir
   "la app funciona de punta a punta con datos reales").
2. Sección 2 (ajustes de batería/permisos en el celu de mamá — es lo que
   más rompe apps de ubicación en background si se salta).
3. Sección 4 según ganas/tiempo — no bloquea el uso real.
4. Sección 3 (OTA) más adelante, cuando ya esté estable y probada.
