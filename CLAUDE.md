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

## Current state (as of 2026-09-10, check PROGRESS.md for anything newer)

**Supabase is real and live**, not mock — `supabaseReady` is `true` in
practice for this project. The mock/real split described above still
matters as a *pattern* (any new Supabase-backed hook should still fall
back to `mockData.js`), but don't assume the app is currently running in
mock mode when reasoning about a bug someone reports from their phone.

**Two EAS build profiles, easy to conflate:**
- `development` — needs `npx expo start` (Metro) running on the same wifi
  to load JS. Used for live-iterating during a session.
- `preview` — standalone, JS baked in at build time, no Metro needed. This
  is what's actually installed on Nacho's and mamá's phones for real use.
  **A JS-only code change does NOT appear in an already-installed
  `preview` APK — it needs a brand-new `preview` build.** Don't tell Nacho
  "just reload the app" for a `preview`-build change.
- Both profiles need every `EXPO_PUBLIC_*` var (and `GOOGLE_SERVICES_JSON`)
  pushed as an EAS environment variable (`eas env:create`/`env:set`) — EAS
  Build never reads the local gitignored `app/.env` directly. See
  `INSTALADOR.md` for the full story and the exact commands. When
  `app/.env` changes (e.g. Nacho's login password), mirror it into EAS for
  both `preview` and `development` or the next build silently reverts.

**`useSafeZones`** (plural) is the real hook name in
`useHouseholdData.js` — returns *all* safe-zone rows for the household,
not just one. `OsmMap.js` draws one labeled circle per zone and colors
mamá's marker green/red client-side via the same haversine check
`locationTask.js` uses server-side.

**No safe-area handling anywhere** (`react-native-safe-area-context` isn't
installed, no `SafeAreaView`/insets used). Screens just use a top padding
number tuned by eye against a real device (see `ProfileScreen.js`'s
`paddingTop: 44` for its back button, added after it collided with the
status bar). If another screen's header/back button reports the same
issue, it's this — bump that screen's top padding, don't assume it's an
isolated bug.

**Battery reporting** (`src/lib/battery.js`, `expo-battery`): mamá's app
calls `reportBatteryStatus()` alongside her location pings (on open + every
2 min), writing `battery_level`/`battery_charging` onto her `profiles` row.
`CuidadorDashboard.js`'s `BatteryCard` reads it off `useOtherProfile`. This
was the first native module added since the first dev build — adding a
new native module always means the *next* build (any profile) needs to be
regenerated before it works; Metro alone can't add native code to an
already-installed binary.

**Fall detection** (`src/lib/fallDetection.js`, `expo-sensors`
`Accelerometer`): free-fall (`magnitude < FREE_FALL_G`) followed within
`IMPACT_WINDOW_MS` by a spike (`magnitude >= IMPACT_G`), with a cooldown
so one fall doesn't fire twice. Foreground-only — `expo-sensors` has no
background task support like `expo-location` does, so this only runs
while mamá's app is open. Thresholds were originally tuned for a hard-
floor impact (2.5g) and failed a real test (phone tossed onto a couch —
soft landing, much lower peak g); loosened to `0.55g`/`1.8g` after
calibrating with a temporary `console.log` of the rolling peak magnitude,
read live from the Metro output in the Claude Code terminal while Nacho
reproduced the drop on the dev build. **That calibration method is the
playbook if thresholds ever need retuning again** — don't guess new
numbers blind, add the temporary peak-logger back (see git history around
commit `06cae03` for the exact shape), get one real data point, then
remove the debug log before committing the real fix.

## Working with Nacho — patterns that hold across sessions

- He tests everything live on his own phone against a **dev build**
  (`npx expo start` + a `development`-profile APK already installed) while
  a feature is being iterated on, then asks for a fresh **`preview`**
  build once he's confirmed it works — that's the one that actually ships
  to his phone and his mother's. Don't skip straight to a `preview` build
  for something untested.
- He reports problems by describing what he *did* and what *didn't*
  happen ("tiré el celu al sillón y no detectó nada"), not by reading
  error messages — when something's wrong, the fastest path is usually to
  reproduce it and instrument it (temporary logging, a debug Alert) rather
  than reasoning about it purely from the code.
- Prefers short, direct SQL/commands handed to him to paste into the
  Supabase dashboard himself — he runs them and confirms back, rather
  than being walked through the dashboard UI step by step unless he asks.
- Always wants `PROGRESS.md` (and `APK_ACTUAL.md` when a build link
  changes) updated before a session winds down, even mid-task — treat "go
  guardá el progreso" as a real request to write state to disk, not just
  a conversational aside.
