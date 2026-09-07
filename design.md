# MamaCheck — Diseño del proyecto

Prototipo de referencia visual/interacción: `save-mama.jsx` (React, single-file). Usar como spec, no como código final de producción.

## Qué es

Una sola app con dos perfiles: **Nacho** (cuidador) y **mamá**. Cada uno entra con su propio mail de Google y cae a su experiencia.

## Origen

Nace de FamilIA (prototipo teal/glassmorphism) → nueva dirección visual y de marca a partir de un handoff de Claude Design ("Nocturne Cuidado", paleta mono-violeta) → renombrada a **MamaCheck**.

## Identidad

- **Nombre**: MamaCheck ("Mama" en blanco, "Check" en acento violeta)
- **Logo**: ícono check monoline dentro de un círculo con glow suave — mismo lenguaje visual que el botón "Estoy bien" de mamá (coherencia entre pantallas, sin huella dactilar ni íconos genéricos)
- **Tono**: cálido, sin apuro, cuidado a distancia — nunca clínico ni alarmista de más

## Paleta (tokens)

```
--bg: #161826
--surface: #232532
--text: #e9e9ed
--accent: #9184d9
--accent-100: #f5f4ff
--accent-800: #423a6a
--neutral-800: #3f424d
--neutral-900: #292b31
--divider: rgba(233,233,237,0.16)
--danger: #e0716b
--danger-text: #f0a29d
```

Radios: 8px (md), 14px (lg). Tipografía: Inter / system-ui.

## Flujo de login (único, con selección de rol)

1. Pantalla con logo + wordmark MamaCheck
2. "¿Quién entra?" (título grande) → dos tarjetas con glow violeta suave:
   **"Soy Nacho"** (avatar propio, línea monoline neutra, subtítulo "Ves
   ubicación, estado y alertas") y **"Soy mamá"** (avatar propio, pelo
   castaño + sonrisa, subtítulo "Avisar que estoy bien y pedir ayuda") —
   confirmado con Nacho 2026-09-06, implementado en
   `app/src/components/Avatars.js`
3. Al elegir rol → mail + contraseña real contra Supabase (Google real queda
   armado pero pausado, ver `progress.md`); mamá entra sin que se le pida
   nada (cuenta fija)
4. Cae a la vista correspondiente con sesión activa (mail real, no hardcodeado)
5. "Cerrar sesión" vuelve siempre al selector de rol (no hay logout separado por app)

## Vista Nacho (cuidador)

- Header: saludo + nombre, tag "En zona segura", avatar (inicial real) → perfil
- Banner de emergencia (oculto por default, se activa cuando mamá manda SOS)
- Mapa (mock actual, simula movimiento con un punto animado dentro de un radio de zona segura) — **a reemplazar por ubicación real** (ver sección Backend)
- 3 tarjetas de vitales: ritmo cardíaco, sueño, último movimiento (simulados con jitter random)
- Card "Análisis de IA": resumen generado en lenguaje natural sobre el estado del día
- Botones: "Mensaje rápido" (dialog con 3 frases predefinidas) y "Llamar"
- Feed de actividad reciente (alertas, check-ins)
- Perfil: cuenta conectada, mail, cuenta de mamá vinculada, toggles de notificaciones, cerrar sesión

## Vista mamá

- Saludo con su nombre (derivado del mail)
- Botón circular grande "Estoy bien" (check-in manual, actualiza nota de "último aviso hace X")
- Lista de contactos rápidos (avatar, nombre, botón de llamar simulado con estado "Llamando…")
- Botón "Necesito ayuda" (rojo/danger) → confirmación → dispara SOS → pantalla de confirmación "Le avisamos a tu familia"

## Lo que falta para ser real (próximo paso: Claude Code)

Confirmado con Nacho: **ubicación en segundo plano real**, gratis, sin Google Maps de pago.

- **App nativa** (React Native / Expo) — necesario porque ni web ni PWA sostienen geolocalización confiable en background (sobre todo iPhone)
- **Mapa**: OpenStreetMap (gratis, sin billing) — mantener el mismo estilo visual que ya está
- **Backend**: Supabase (Postgres + realtime, tier gratuito) — guarda última ubicación de mamá, contactos, eventos/alertas
- **En el celu de mamá**: permiso de ubicación "siempre" + envío periódico en background (cada 1-2 min, cuidando batería)
- **En la app de Nacho**: lee esa ubicación en tiempo real y reemplaza el punto simulado del mapa
- Todo lo demás (vitales, análisis de IA, SOS, contactos) sigue simulado por ahora — se define backend real más adelante si hace falta

## Responsive (diseño final)

El diseño final tiene que adaptarse bien a distintos tamaños, no solo a un celular tipo:

- Varios modelos de celular (chico tipo iPhone SE hasta los grandes tipo Pro Max / Android grandes)
- Tablets (iPad y Android) — layout no puede quedar estirado o vacío, aprovechar el ancho extra
- Definir breakpoints claros y probar que las tarjetas, el mapa y los botones grandes (como "Estoy bien") escalen bien en cada tamaño

## Compilar e instalar para probar con mamá

No hace falta subir a las tiendas para probarlo entre los dos:

- **Build interno con Expo** (`eas build --profile development` o `preview`) genera un instalable
- **Android**: instala directo el `.apk` (QR o link) — gratis, más simple para empezar
- **iPhone**: necesita cuenta Apple Developer ($99/año) o TestFlight — un poco más de fricción
- **Para algo más permanente/estable**: Play Store interno ($25 único pago) o TestFlight — se actualiza solo, no hay que reinstalar a mano cada cambio

## Botón de emergencia — qué falta para que sea real

**Importante**: en el prototipo actual "Necesito ayuda" es simulado, no llama ni avisa a nadie de verdad. Para que funcione en serio necesita como mínimo:

- **Notificaciones push reales** que lleguen a Nacho aunque tenga la app cerrada (no alcanza con "app abierta")
- **Llamada real** con el dialer nativo del teléfono al tocar "Llamar" (no decorativo)
- **Respaldo por SMS** por si no hay internet en el momento
- Probarlo en serio varias veces antes de confiar en él (con wifi, con datos, con batería baja)

**Aclaración clave**: esta app puede avisar a la familia, pero **no reemplaza una emergencia médica real** — el número de emergencias local siempre va primero; la app es un complemento, no el sistema de seguridad principal.

## Notas de uso de créditos en Claude Code

Trabajar en sesiones chicas y puntuales (no pedir "armá toda la app" en un comando gigante). Para tareas mecánicas/repetitivas, usar un modelo más económico si el comando lo permite.
