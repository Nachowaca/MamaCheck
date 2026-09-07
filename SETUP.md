# MamaCheck — setup que tenés que hacer vos

Dos cosas bloquean el arranque real: crear el proyecto de Supabase y crear el
cliente OAuth de Google. Las dos son gratis. Cuando tengas las claves, me las
pasás y las pongo en `app/.env`.

## 1. Supabase

1. Andá a [supabase.com](https://supabase.com) → **New project** (tier free).
2. Cuando esté listo: **SQL Editor** → **New query** → pegá todo el contenido
   de [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
3. **Project Settings → Data API** → copiá:
   - `Project URL`
   - `anon public` key
4. Pasámelas y las pongo en `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

Con eso el esquema ya está: households, profiles, safe_zones, locations,
contacts, alerts — con RLS para que Nacho y mamá solo vean datos del mismo
household.

## 2. Google Sign-In

Usamos el proveedor de Google que trae Supabase Auth (más simple que armar
`expo-auth-session` a mano: Supabase hace el intercambio OAuth, la app solo
abre un browser y vuelve).

1. [Google Cloud Console](https://console.cloud.google.com/) → creá un proyecto
   (o usá uno existente) → **APIs & Services → OAuth consent screen**:
   - User type: External
   - App name: MamaCheck, tu mail de soporte, listo (no hace falta publicarla,
     alcanza con modo "Testing" + agregar tu mail y el de mamá como test users)
2. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs: pegá la que te da Supabase en el paso 4
3. En **Supabase → Authentication → Providers → Google**:
   - Activalo, pegá el `Client ID` y `Client Secret` del paso 2
   - Copiá la **Callback URL** que Supabase te muestra ahí y volvé a pegarla
     en el redirect URI del paso 2 (se referencian entre sí)
4. Pasame el `Client ID` de confirmación de que quedó activo (no hace falta
   que me pases el secret, ese vive solo en Supabase).

Con eso el botón "Continuar con Google" abre el flow real y vuelve a la app
logueado — sin tocar nada más del código.

## Mientras tanto

Ya podés avisarme cuando tengas el punto 1 (Supabase) resuelto aunque el
punto 2 (Google) tarde más — con la URL/anon key sola ya puedo dejar andando
el resto de la app (mapa, contactos, alertas) contra datos reales, y dejamos
el login con un mock hasta que Google esté listo.
