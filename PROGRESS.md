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

## ✅ Push notifications — cerrado del lado de Nacho (2026-09-08)

Causa raíz del `OK: undefined`: bug de código, no de Firebase/EAS —
`registerForPushToken()` en `app/src/lib/pushNotifications.js` hacía
`const { data: tokenData } = await Notifications.getExpoPushTokenAsync(...)`
(ya destructura `data` en `tokenData`) y después volvía a leer `tokenData.data`
(undefined, porque `tokenData` ya era el string del token). Fix commiteado
(`7a245e3`) — cambio solo JS, no hizo falta rebuild nativo. **Confirmado con
notificación push real recibida en el celular de Nacho, app cerrada.** Debug
Alert temporal sacado (`d97ff9c`).

**🔴 Pendiente para cerrar del todo (retomar acá):**
- Instalar el mismo APK (link en `APK_ACTUAL.md`) en el celular de mamá y
  loguearla, para que su perfil tenga su propio `push_token`. Nacho no tiene
  su celu a mano todavía — **queda para otro día**, no bloqueante.
- Con ambos tokens guardados: probar un SOS/check-in desde el celu de mamá
  con la app de Nacho completamente cerrada, confirmar que le llega la
  notificación real también en ese sentido (ya confirmado en el sentido
  Nacho→sí-mismo; falta el otro lado con mamá real).

## ✅ Sesión 2026-09-08 (tarde) — puntos seguros, recordatorio y pulido de mapa

- **Recordatorio automático para mamá**: notificación local (no pasa por
  server) cada 6hs recordándole que avise que está bien si no lo hizo. Se
  re-programa al abrir la app y después de cada check-in manual, así el
  conteo de 6hs siempre arranca de nuevo. Código: `scheduleCheckinReminder`
  en `app/src/lib/pushNotifications.js`, llamado desde `MamaHome.js`.
- **Puntos seguros (varias zonas)**: `safe_zones` ya soportaba varias filas
  por household y `locationTask.js` ya chequeaba "¿dentro de CUALQUIERA?" —
  solo faltaba que el mapa y el hook las mostraran todas.
  `useSafeZone` → `useSafeZones` (trae todas), `OsmMap` dibuja un círculo
  con nombre por zona. Cargadas por SQL (mismo patrón que contactos, no hay
  UI todavía): **Casa** (la de mamá, ya existía), **Casa de Andrea**
  (Belgrano 2984) y **Casa de Nacho** (Francisco de Medina 1424), 200m cada
  una, geocodeadas con Nominatim.
- **Color del punto de mamá en el mapa**: verde si está dentro de alguna
  zona segura, rojo si está afuera de todas — mismo cálculo haversine que
  el chequeo real del server, corrido en el propio HTML del mapa así se
  actualiza en vivo sin round-trip. En `OsmMap.js`.
- **Actividad reciente**: bajada de 6 a 4 avisos en el dashboard de Nacho
  (pedido de UI, sin lógica nueva).

**Pendiente sigue siendo lo de la sección de arriba** (instalar en el celu
de mamá + probar SOS de punta a punta desde su lado) — no bloqueante, es
la próxima vez que Nacho tenga su celular a mano.

## ✅ Sesión 2026-09-08 (noche) — build standalone + tiles + limpieza de zonas

- **Build "preview" (standalone)**: se armó un APK que no necesita Metro
  corriendo (`eas.json` → perfil `preview`, distinto del `development`
  que usábamos hasta ahora). Historia completa y gotcha de env vars en
  `INSTALADOR.md` — resumen: los builds en la nube de EAS no ven
  `app/.env` (gitignored), hubo que subir todas las `EXPO_PUBLIC_*` como
  EAS environment variables para `preview` y `development`.
- **Mapa: CartoDB → OpenStreetMap estándar**. CartoDB mostraba un
  watermark "API_KEY_REQUIRED" — están retirando los tiles PNG gratuitos
  del todo (con o sin key; su reemplazo es MapLibre GL vectorial, cambio
  mucho más grande). Se volvió a tiles OSM estándar en `OsmMap.js`, sin
  key, gratis siempre. Se pierde el estilo "clarito" — si en algún
  momento importa mucho la estética, evaluar migrar a MapLibre GL.
- **Zonas duplicadas limpiadas**: el SQL de alta de zonas se había
  corrido más de una vez sin querer, dejando varias filas repetidas
  (algunas todavía con el nombre viejo "Casa de Andrea"). Se corrió un
  SQL de limpieza (borra por nombre viejo + dedup por nombre+lat+lng) y
  quedaron las 3 zonas correctas: **Casa**, **Andrea**, **Casa de
  Nacho**. Confirmado visualmente en el mapa, sin duplicados.
- Link vigente del build standalone en `APK_ACTUAL.md` (se regeneró
  después del fix de tiles).

**Pendiente sigue siendo lo mismo de siempre**: instalar en el celu de
mamá + probar SOS de punta a punta — ver `PLAN_OFICIAL.md` sección 1.

Historia completa de la vuelta anterior de debugging (ya resuelta, dejar
para contexto):

1. Firebase creado (proyecto "MamaCheck", package `com.mamacheck.app`),
   `google-services.json` descargado a `app/google-services.json`
   (gitignored — no está en el repo, solo en esta compu, Nacho lo tiene).
2. Cuenta de servicio de Firebase (`app/*firebase-adminsdk*.json`, también
   gitignored) subida a EAS vía `eas credentials` → Android → Push
   Notifications → "Upload an FCM API Key". **Ya hecho, no repetir.**
3. `app.json` → convertido a `app.config.js` (ya en el repo) porque EAS
   Build solo sube archivos versionados en git, y `google-services.json`
   no lo está a propósito. `app.config.js` lee
   `process.env.GOOGLE_SERVICES_JSON` y cae al archivo local si no existe.
4. Esa env var (`GOOGLE_SERVICES_JSON`, tipo file, visibilidad sensitive,
   environment "development") ya está creada en EAS — confirmado con
   `eas env:list` (sale `GOOGLE_SERVICES_JSON=***** (sensitive)`).
   **Ya hecho, no repetir.**
5. Primer build después de la conversión de app.config.js salió con
   `push_token` igual `null` y sin tirar error — se agregó un debug
   temporal (`app/App.js` + `app/src/lib/pushNotifications.js`, buscar
   comentarios "TEMPORAL") que muestra un Alert con el resultado exacto de
   `registerForPushToken()`. Con eso se vio `"OK: undefined"` — o sea, el
   guardado corrió pero `getExpoPushTokenAsync` devolvió `data: undefined`,
   consistente con que ESE build específico se había generado con código
   viejo (antes de que `app.config.js` estuviera commiteado — commit hash
   del build no coincidía con el HEAD real; parece un problema de timing,
   no repetible si se espera a que el build arranque después del push).
6. Se relanzó el build; EAS avisó "No environment variables ... found for
   the development environment" — pero `eas env:list` mostró que SÍ
   existe. Probablemente un problema de indexado/caché del lado de EAS,
   no de nuestra config. Nacho canceló ese build y lanzó uno nuevo.

**Al retomar:** chequear `eas build:list --limit 1 --json` (o pedirle a
Nacho) si ese último build terminó. Si terminó:
- Que instale el APK nuevo, abra la app, entre con un rol.
- Va a aparecer un **Alert de debug** ("Debug: push token: ...") — leer qué
  dice. Si dice `OK: ExponentPushToken[...]` (con un valor real, no
  `undefined`), el token se guardó bien → confirmar con
  `select push_token from profiles` que ya no es null → probar un SOS con
  la app de mamá cerrada del todo y ver si llega la notificación real.
- Si sigue diciendo `OK: undefined` o algún otro mensaje, ese texto exacto
  dice dónde se corta (revisar `registerForPushToken` en
  `app/src/lib/pushNotifications.js`, cada `return "..."` es un punto de
  fallo distinto).
- **Una vez que push funcione de punta a punta**: sacar el código de debug
  temporal (buscar "TEMPORAL" en `App.js` y `pushNotifications.js`) y
  commitear la limpieza.

**Si Nacho reinstala en una compu nueva**: necesita recrear a mano (no
están en git): `app/.env`, `app/google-services.json`, el JSON de la
cuenta de servicio de Firebase (solo hace falta si hay que rehacer
`eas credentials`, no para uso normal), y la env var `GOOGLE_SERVICES_JSON`
en EAS ya queda del lado del servidor, no depende de la compu.

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
- Login de Nacho también automático — **decisión permanente (2026-09-10),
  ya no temporal**: mismo mecanismo que mamá (`EXPO_PUBLIC_NACHO_EMAIL`/
  `EXPO_PUBLIC_NACHO_PASSWORD` en `app/.env`), entra directo tocando "Soy
  Nacho" y la sesión queda guardada para siempre (solo se pierde si toca
  "Salir").
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
- **Fix de mapa (2026-09-07):** el círculo de zona segura se dibujaba
  siempre sobre el punto de mamá en vez de sobre su casa — si se alejaba, el
  mapa lo escondía en vez de mostrarlo (justo lo contrario de para qué sirve
  el mapa). Ahora `OsmMap` recibe el centro de la zona por separado
  (`zoneLat`/`zoneLng`) y hace `fitBounds` para que se vean los dos puntos
  (mamá + su casa) y la distancia real entre ambos.
- **Notificaciones push:** armadas (`app/src/lib/pushNotifications.js`,
  columna `push_token` en `profiles`, se manda al pasar cualquier alerta —
  SOS, check-in, salida/vuelta de zona). Confirmado: Expo sacó las push
  remotas de Expo Go en el SDK 53 (tira error apenas se importa el módulo,
  no solo al usarlo) — el código ya lo esquiva con un `require` condicional
  para no romper nada mientras seguimos en Expo Go, pero **no se puede
  probar de verdad hasta el dev build**.
- Nombres reales corregidos en los profiles (quedaban como "ignacional26" /
  "lisboaser", el prefijo del mail, en vez de "Nacho" / "Laura").
- Proyecto EAS creado (`nacowakas-team` / projectId ya en `app/app.json`) —
  primer paso para el dev build.
- **Dev build (APK) generado y probado en el celu real (2026-09-07/08)** —
  ya no depende de Expo Go. Ubicación real confirmada en el mapa de Nacho.
- Botón "Salir" rediseñado (2026-09-08): antes era un texto chico perdido
  abajo de todo en la home de mamá — ahora es un botón tipo pill con ícono
  (`app/src/components/ExitButton.js`), visible arriba en las dos pantallas.

**Próximo: pasada de diseño visual (pedido 2026-09-08).** Nacho quiere
probar algo menos "todo oscuro" — el mono-violeta sobre `#161826` está
cerrado como identidad, pero conviene explorar variantes antes de tocar
código (fondo menos negro, más superficies claras, etc.). Cuando se
retome: confirmar paleta con Nacho antes de maquetar nada (ver
`nacho-fijo`/`equilibrium-chat`), no asumir.

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
2. **Dev build con EAS** — el paso que más desbloquea: ubicación real en
   background (hoy depende de que ella tenga la app abierta) y notificaciones
   push (código ya armado, ver abajo, pero Expo Go no las deja correr).
   Proyecto EAS ya creado (`nacowakas-team`) y projectId ya en `app.json` —
   falta correr el build en sí (`eas build --profile development`).
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
