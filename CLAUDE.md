# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

MamaCheck: a two-role remote elder-care app (Nacho as cuidador, his mother as
mamá) sharing one Expo/React Native codebase. Design intent, product
decisions, and pending work are tracked in markdown docs at the repo root —
read them before making product or architecture calls:

- `PROGRESS.md` — what's built vs. pending, in priority order. Update this
  when you finish or add a pending item.
- `SETUP.md` — the two external steps only Nacho can do (create the Supabase
  project + run `supabase/schema.sql`; create the Google OAuth client). Check
  whether these are done before assuming Supabase/Google are live.
- `design.md` / `schema.md` — design and schema notes exported from a
  separate Claude Design session. **They diverge from what's actually
  implemented** (see Known discrepancies below) — treat them as intent/
  history, not as the source of truth for current code.
- `save-mama.jsx` — a single-file React reference mock of the visual/
  interaction spec (web `<div>`/inline-style, not RN). Useful for copy,
  layout intent, and the mono-violet color tokens; not runnable RN code.

The actual app lives in `app/` (a separate git repo from the project root —
`app/.git` exists independently; the root itself is not a git repo).

## Commands

Run from `app/`:

```bash
npx expo start            # dev server; scan the QR with Expo Go
npx expo start --web      # or: npm run web — browser preview (see caveats below)
npx expo export --platform ios --output-dir /tmp/x && rm -rf /tmp/x
                           # fastest way to catch syntax/import errors without
                           # a device — bundles all platforms' JS via Metro
```

There is no lint config, test runner, or TypeScript setup in this project —
don't assume `npm test`/`npm run lint` exist.

A `.claude/launch.json` at the repo root runs the web preview via
`run-web.bat` (works around Windows path-with-spaces issues calling `npm
--prefix` directly) on port 8090, since 8081 is commonly already taken by a
manually-run `expo start`.

## Architecture

**Screens are switched by hand in `App.js`**, not a router —
`src/navigation/` is an empty placeholder, no `react-navigation` or
`expo-router` is installed. `App.js`'s `Root` component reads
`{session, profile, loading}` from `AuthContext` and renders `LoginGate`,
`MamaHome`, or `CuidadorDashboard` based on `profile.role`. Within
`CuidadorDashboard`, the profile screen is local `useState`, not a route.

**Mock mode vs. real Supabase** — `src/lib/supabase.js` exports
`supabaseReady = Boolean(url && anonKey)` from `EXPO_PUBLIC_SUPABASE_*` env
vars. Until `app/.env` has real values, the whole app runs off in-memory mock
data:
- `AuthContext.claimRole()` has a branch for `!supabaseReady` that fabricates
  a session/profile locally instead of touching Supabase — this is how login
  works today.
- `src/hooks/useHouseholdData.js`'s hooks (`useContacts`, `useAlerts`,
  `useLatestLocation`, `useSafeZone`, `useOtherProfile`) each fall back to
  static fixtures in `src/lib/mockData.js` when `!supabaseReady`.
- When adding a new piece of Supabase-backed data, follow this same
  mock/real split rather than making the screen assume a live backend.

**Role values are `"cuidador"` and `"mama"`** (matches the
`profiles.role` check constraint in `supabase/schema.sql`) — not `"nacho"`/
`"laura"`, which were a copy-paste leftover from `save-mama.jsx` naming and
caused a real bug once (role fell through to the wrong dashboard). Grep for
`role ===` / `setRole(` before introducing a third role value.

**Data model is household-based**, not the `linked_profile_id` model
described in `schema.md`. The implemented schema
(`supabase/schema.sql`) has a `households` table; both profiles (cuidador +
mama) share one `household_id`, and every other table (`locations`,
`safe_zones`, `contacts`, `alerts`) is scoped by `household_id` with RLS
via a `my_household_id()` helper function. `AuthContext.claimRole()` joins
the single existing household or creates one on first role pick — this
only works correctly for exactly the 2-person household this app is scoped
to; don't generalize it without revisiting the RLS policies.

**Known discrepancies between `schema.md`/`design.md` and the real code**
(reconcile deliberately, don't silently pick one): `schema.md` proposes
`check_ins` and `quick_messages` as separate tables and a `linked_profile_id`
join model; the implemented schema instead folds check-ins and quick
messages into the single `alerts` table (`type` discriminates
`checkin`/`sos`/`zone_exit`/`zone_enter`/`message`) under the household
model above. If asked to "match schema.md", flag this conflict rather than
migrating silently.

**Map is OpenStreetMap via Leaflet in a WebView** (`src/components/OsmMap.js`),
not `react-native-maps` — chosen to avoid any Google Maps billing and to get
pixel control over the safe-zone circle/pulsing dot styling. `react-native-webview`
has no web-platform support, so `OsmMap` branches on `Platform.OS === "web"`
to render a plain `<iframe srcDoc={...}>` with the same Leaflet HTML instead —
that branch exists solely for the browser preview described above, not for
production use.

**Background location** (`src/lib/locationTask.js`, `expo-location` +
`expo-task-manager`) does not run inside Expo Go — Expo dropped background
location support there. It needs an EAS dev build before it can be tested
for real; see `PROGRESS.md` for where that sits in the plan.
