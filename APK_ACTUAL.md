# APK actual - MamaCheck

Build: 2026-09-10, perfil "preview" (standalone, no necesita Metro/terminal
corriendo). Incluye todo lo de la sesión del 10/09: batería de mamá
(expo-battery, reemplaza la tarjeta de Análisis de IA), cuadro de estado
verde/rojo con glow sobre el mapa, mensajes rápidos nuevos, footer animado
"Conectado a MamaCheck!", zoom +/- y mapa más grande, login de Nacho con su
contraseña real (permanente, igual que mamá).

## Descarga

https://expo.dev/accounts/nacowakas-team/projects/mamacheck/builds/5c2b4e53-2e2c-4b74-95d0-6e8850278eb0

## Instalar

1. Abrir el link en el navegador del celular Android (o escanear el QR).
2. Descargar, instalar (permitir "fuentes desconocidas" si lo pide,
   pisa la instalación anterior — mismo paquete y firma).
3. Abrir la app directamente, sin depender de la compu.

## Pendiente para que la batería funcione de verdad

Correr en Supabase (SQL Editor) si todavía no se corrió:
```sql
alter table profiles add column if not exists battery_level integer;
alter table profiles add column if not exists battery_charging boolean;
```
