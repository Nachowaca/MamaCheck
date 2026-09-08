# Instalador (build "preview") — MamaCheck

Registro aparte de `PROGRESS.md`, específico del build standalone que se
puede instalar y usar sin tener `npx expo start` corriendo.

## Qué es y por qué existe

Había dos tipos de APK hasta ahora:
- **development** (`eas.json` → perfil `development`): necesita Metro
  (`npx expo start`) corriendo en la compu, mismo wifi que el celu. Sirve
  para iterar rápido durante el desarrollo.
- **preview** (`eas.json` → perfil `preview`): standalone, el JS queda
  empaquetado adentro del APK. Se instala y anda solo, sin depender de
  nada — este es el que sirve para uso real (Nacho probándola suelto, o
  instalarla en el celu de mamá).

## Bug encontrado y resuelto (2026-09-08)

Primer build de "preview" (`90c7995e-...`) terminó OK pero la app abría en
**modo mock**: pedía mail+contraseña en vez de auto-login, y la ubicación/
zonas seguras eran datos falsos fijos, no los reales de Supabase.

**Causa:** todas las variables `EXPO_PUBLIC_*` (Supabase URL/key, cuentas
de auto-login de mamá y Nacho) viven en `app/.env`, que está gitignored.
Los builds de development funcionaban porque Metro corre en la compu y lee
`.env` directo del disco al armar el bundle. Pero un build de EAS corre en
una máquina remota en la nube — **nunca tuvo acceso a `.env`**, solo a lo
que esté cargado como variable de entorno del lado de EAS (mismo problema
que ya habíamos resuelto para `google-services.json`, pero esta vez con
todas las demás variables).

**Fix:** se subieron como EAS environment variables (para los entornos
`preview` y `development`, por las dudas):
- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (plaintext)
- `EXPO_PUBLIC_USE_GOOGLE_AUTH` (plaintext)
- `EXPO_PUBLIC_MAMA_EMAIL`, `EXPO_PUBLIC_NACHO_EMAIL` (plaintext)
- `EXPO_PUBLIC_MAMA_PASSWORD`, `EXPO_PUBLIC_NACHO_PASSWORD` (sensitive)

Con eso, el segundo build (`4dbf610b-...`) salió con datos reales. **Ese es
el build vigente** — ver el link actual en `APK_ACTUAL.md`.

## Si hace falta un build nuevo más adelante

No hace falta repetir la carga de variables — ya están guardadas del lado
de EAS para "preview" y "development" (se puede confirmar con
`npx eas-cli env:list preview --include-sensitive` desde `app/`). Alcanza
con:

```bash
npx eas-cli build --platform android --profile preview --non-interactive
```

Si en el futuro cambian el mail/contraseña de auto-login o las keys de
Supabase, hay que actualizar `app/.env` (para desarrollo local) **y**
volver a subir esas mismas variables a EAS con `eas env:set` (o el equipo
puede pedirle a Claude que lo haga), sino un build nuevo va a volver a
salir en modo mock aunque `.env` esté actualizado localmente.
