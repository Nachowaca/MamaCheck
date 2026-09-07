# Cómo probar MamaCheck en tu celular

## 1. Prender el servidor

En la compu, en una terminal (PowerShell):

```powershell
cd "C:\AI Cosas 26\Cuidado Mama\app"
```

```powershell
npx expo start
```

Esperá a que aparezca un código QR en la terminal.

- Si tu celu está en la **misma wifi** que la compu: alcanza con eso.
- Si están en **redes distintas**: usá `npx expo start --tunnel` en su lugar
  (tarda un poco más en levantar, pero funciona desde cualquier lado).

## 2. Abrir la app en el celu

1. Instalá **Expo Go** (Play Store en Android / App Store en iPhone) si no la tenés.
2. Abrí Expo Go y escaneá el QR de la terminal (en iPhone, podés escanearlo
   directo con la cámara nativa).
3. Esperá a que cargue — la primera vez tarda un poco más.

## 3. Qué probar

- **Login**: tocá "Soy Nacho" o "Soy mamá" — por ahora los dos entran
  directo, sin pedir nada (es temporal, para probar rápido).
- **Como mamá**: botón "Estoy bien", lista de contactos (llamar de verdad a
  Nacho/Andrea/Ceci), botón "Necesito ayuda".
- **Como Nacho**: mapa (debería mostrar la última ubicación real de mamá),
  tarjeta de Análisis de IA, "Mensaje rápido", "Llamar", actividad reciente,
  y tu perfil (tocando el avatar arriba a la derecha).
- **Permisos**: la primera vez que entrás como mamá te va a pedir permiso de
  ubicación — aceptalo, así se ve su punto real en el mapa de Nacho.

## Lo que todavía no es 100% real

- El tracking de ubicación en segundo plano (con la app cerrada) no anda
  todavía en Expo Go — necesita un paso más (dev build). Por ahora, la
  ubicación se manda mientras mamá tiene la app abierta.
- El botón "Necesito ayuda" avisa de verdad (queda guardado y Nacho lo ve en
  su actividad reciente), pero todavía no manda notificación push si Nacho
  tiene la app cerrada.
- El análisis con IA está construido pero pausado (falta un paso de
  configuración en Supabase).

Más detalle de qué está hecho y qué falta: [PROGRESS.md](PROGRESS.md).
