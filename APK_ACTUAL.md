# APK actual - MamaCheck

Build: 2026-09-11, perfil "preview" (standalone, no necesita Metro/terminal
corriendo). Build final para instalar en el celular de mamá el sábado.
Incluye todo: batería en tiempo real, detección de caída (accelerómetro,
solo con la app abierta), botón "Resuelto" para limpiar emergencias,
cartel de conexión real, mensajes según hora del día, SOS más chico y
centrado, cruz de flechas + zoom en el mapa, login permanente de Nacho.

## Descarga

https://expo.dev/accounts/nacowakas-team/projects/mamacheck/builds/39900129-c0e0-444c-b6ca-4c3d16f0a3e5

## Instalar

1. Abrir el link en el navegador del celular Android (o escanear el QR).
2. Descargar, instalar (permitir "fuentes desconocidas" si lo pide,
   pisa la instalación anterior — mismo paquete y firma).
3. Abrir la app directamente, sin depender de la compu.

## Ya hecho (no repetir)

Las columnas `battery_level`/`battery_charging` en `profiles`, el tipo de
alerta `fall`, la publicación de Realtime con `profiles`, y el trigger de
limpieza de `locations` ya están corridos en Supabase.
