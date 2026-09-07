# MamaCheck — Progress

Registro de decisiones tomadas, en orden. Usar junto a `design.md` (spec de diseño) y `save-mama.jsx` (referencia visual/interacción) al retomar el proyecto en Claude Code.

## Origen
- Proyecto arranca a partir de un handoff de Claude Design ("Nocturne Cuidado") + el prototipo previo FamilIA (teal/glassmorphism)
- Se decide: nueva dirección visual mono-violeta, para probar con la madre de Nacho → renombrado **MamaCheck**

## Decisiones de producto
- Es **una sola app**, no dos apps separadas — un login único donde se elige el rol (Nacho / mamá)
- Cada perfil entra con su propio mail de Google (no cuentas fijas hardcodeadas)
- "Cerrar sesión" vuelve siempre al selector de rol

## Decisiones de diseño
- Logo: se descarta la huella dactilar inicial → se usa el mismo ícono check monoline del botón "Estoy bien" (coherencia visual)
- Nombre final: **MamaCheck**
- Botones de rol pasan de texto plano a tarjetas con ícono + título + subtítulo
- "Soy cuidador/a" → renombrado a **"Soy Nacho"** (más cercano, es siempre la misma persona la que se conecta con ese rol)
- Requisito agregado: diseño final debe ser **responsive** — varios modelos de celular y tablets, no solo un tamaño

## Decisión de arquitectura (para pasar a real)
Pregunta clave resuelta: ¿cómo se obtiene la ubicación real de mamá?
- Se descarta web/PWA — no sostiene geolocalización en background de forma confiable (sobre todo iPhone)
- Se define: **app nativa (React Native / Expo)**
- Mapa: **OpenStreetMap** (gratis) en vez de Google Maps (evita costos de billing)
- Backend: **Supabase** (Postgres + realtime, tier gratuito)
- Orden de trabajo sugerido: backend primero (tablas: ubicaciones, contactos, alertas, usuarios) → después pantallas conectadas → ubicación en background al final

## Pendiente / advertencias abiertas
- **Botón de emergencia**: hoy es 100% simulado. Para ser real necesita push notifications reales (con app cerrada), llamada con dialer nativo, respaldo por SMS, y pruebas en distintas condiciones (wifi/datos/batería baja). No reemplaza el número de emergencias local — es un complemento.
- **Compilación/instalación**: para probar con mamá sin pasar por tiendas, usar build interno de Expo (EAS). Android es más simple y gratis (APK directo); iPhone requiere cuenta Apple Developer o TestFlight.
- Vitales, análisis de IA, y demás datos del dashboard de Nacho siguen simulados — no se definió aún si se conectan a un dispositivo real (reloj, podómetro) o quedan fuera del alcance inicial.

## Notas de trabajo
- En Claude Code: sesiones chicas y puntuales, no pedir "armar todo" en un comando gigante. Modelo más económico para tareas mecánicas si el comando lo permite.

## Estado técnico (actualizado 2026-09-06, desde Claude Code)

La app real vive en `app/` (Expo). Este bloque es el que se actualiza a medida
que se construye — el resto de este archivo es historial de decisiones de
diseño/producto, no lo pises.

**Hecho:**
- Login real con mail + contraseña contra Supabase (`app/src/lib/AuthContext.js`).
  Se crea la cuenta sola la primera vez. Google real quedó armado pero pausado
  (`EXPO_PUBLIC_USE_GOOGLE_AUTH=false` en `app/.env` — poner en `true` para
  retomarlo cuando se resuelva el tema de red probando desde el celu).
- Backend real corriendo: proyecto Supabase creado, `supabase/schema.sql`
  aplicado (households/profiles/safe_zones/locations/contacts/alerts, RLS
  por household).
- Pantallas: login con selector de rol, home de mamá (check-in, contactos,
  SOS), dashboard de Nacho (mapa, análisis de IA con texto fijo, mensajes
  rápidos, feed de actividad), perfil de Nacho (datos + cerrar sesión).
- Mapa: OpenStreetMap vía WebView+Leaflet (gratis, sin Google Maps), con
  fallback a `<iframe>` para poder previsualizar en navegador.
- Login de mamá sin fricción: botón "Soy mamá" entra directo con una cuenta
  fija (`EXPO_PUBLIC_MAMA_EMAIL`/`EXPO_PUBLIC_MAMA_PASSWORD` en `app/.env`),
  sin pedirle mail ni contraseña. Trade-off aceptado: esa contraseña queda en
  el bundle de la app, no es un secreto real — razonable para este uso
  (su celu, app familiar de 2 personas). Esto es permanente, para siempre.
- Login de Nacho también automático **por ahora, temporal** (mismo mecanismo,
  `EXPO_PUBLIC_NACHO_EMAIL`/`EXPO_PUBLIC_NACHO_PASSWORD`) — solo para probar
  más rápido durante esta etapa. Sacar esas dos líneas de `app/.env` (o vaciar
  su valor) cuando se quiera que vuelva a pedir mail+contraseña o Google.
- Detalles de diseño en el login (2026-09-06): avatar propio para cada rol
  (`app/src/components/Avatars.js`, con `react-native-svg`) — uno neutro para
  Nacho, uno con pelo castaño y sonrisa para mamá; glow violeta suave en las
  tarjetas de "¿Quién entra?"; ese título más grande.
- Contactos reales cargados (Nacho, Andrea, Ceci) y teléfono real de mamá en
  su profile.
- Ubicación real llegando al mapa: mientras el background no ande, la app de
  mamá manda su ubicación real una vez al abrir y cada 2 min mientras la
  tiene abierta (`writeCurrentLocationOnce` en `app/src/lib/locationTask.js`).
  Verificado 2026-09-06: el mapa de Nacho ya mostró su punto real.

**Para qué es el mapa (confirmado con Nacho, 2026-09-06):** el objetivo no es
solo "ver un punto" — es que Nacho sepa que mamá está bien, y en particular
que se dé cuenta si se aleja mucho de su casa (para saber que no se perdió,
o que está bien si se alejó). Esto es exactamente lo que resuelve la "zona
segura" (`safe_zones` + alerta `zone_exit`, ya en el schema) — hoy no hay
ninguna fila de zona segura cargada todavía, así que el aviso de salida de
zona no dispara. Subir de prioridad: cargar la zona segura real de su casa
es lo que le da sentido práctico al mapa, más que el punto solo.

**Pendiente inmediato:**
1. ~~Cargar la zona segura real~~ — hecho 2026-09-06: "Casa" (Juan Ramón
   Gómez 2792, Montevideo), radio 200m. La alerta real de salida/entrada de
   zona ya está programada (`recordLocationAndCheckZone` en
   `app/src/lib/locationTask.js`) — avisa una sola vez en cada transición,
   no repite mientras se mantiene el mismo estado.
2. Dev build con EAS para probar ubicación real en background (no funciona
   en Expo Go; hoy depende de que ella tenga la app abierta).
3. **Análisis de IA con Claude — en pausa, a mitad de camino (2026-09-06).**
   Qué es y por qué hace falta esto en particular (para retomar con más
   contexto): la API key de Anthropic es un secreto real (a diferencia de la
   contraseña de mamá) — si viajara dentro de la app cualquiera podría
   extraerla del bundle y usarla a tu costo. Por eso no puede vivir en el
   celu: tiene que vivir en un servidor que vos controlás, y la app le pide
   el resumen a ese servidor en vez de hablarle a Claude directo. Supabase
   ofrece justamente eso listo para usar ("Edge Functions" — funciones
   chiquitas que corren en su servidor).
   - Ya escrito: `supabase/functions/analyze-mama/index.ts` — junta
     ubicaciones/alertas/zona segura de las últimas 24h del household y le
     pide a Claude (Sonnet) un resumen de 3-4 líneas.
   - Ya escrito: botón "Generar"/"Actualizar" en el card de Análisis de IA
     del dashboard (`app/src/screens/CuidadorDashboard.js`), llama a
     `supabase.functions.invoke("analyze-mama")`.
   - Falta: pegar el código de esa función en Supabase → Edge Functions →
     Deploy, y cargar el secret `ANTHROPIC_API_KEY` (Nacho ya tiene la key,
     falta cargarla — quiere entender mejor qué es antes de hacerlo, tiene
     sentido no apurarlo).
   - Cuando se retome: solo falta desplegar + cargar el secret y probar el
     botón — el resto (código app y función) ya está.

**Ideas a futuro (sin priorizar, criterio: innovadora pero no compleja):**
- Recordatorio de medicación (horarios + checklist diario).
- Detección de caída automática vía acelerómetro del celu.
- Alerta de batería baja del celu de mamá al cuidador.
- Multi-cuidador — hoy el modelo asume exactamente 2 personas por household.
- Accesibilidad para mamá — texto más grande, alto contraste, botones simples.
- Botón SOS con opción de llamar directo a emergencias.
- Modo "no molestar" — silenciar notificaciones de noche salvo SOS.
