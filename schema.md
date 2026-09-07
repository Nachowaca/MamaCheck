# MamaCheck — Esquema Supabase

Pensado para llevarlo directo a Claude Code y correr las migraciones ahí. Usa Supabase Auth (Google) + Postgres + Realtime.

## Resumen de tablas

| Tabla | Para qué |
|---|---|
| `profiles` | Datos de cada perfil (Nacho / mamá) y el vínculo entre ambos |
| `locations` | Historial de ubicaciones de mamá (última = más reciente) |
| `safe_zones` | Zonas seguras marcadas (ej. "Casa") con radio de aviso |
| `contacts` | Contactos rápidos del botón de pánico de mamá |
| `alerts` | Eventos: SOS, salida de zona segura, resumen de IA a revisar |
| `check_ins` | Registro de "Estoy bien" |
| `quick_messages` | Mensajes rápidos que Nacho le manda a mamá |

## SQL

```sql
-- ============ profiles ============
-- Extiende auth.users (Supabase Auth con Google)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('cuidador', 'mama')),
  full_name text,
  email text not null,
  avatar_initial text,
  linked_profile_id uuid references profiles(id),
  created_at timestamptz default now()
);
-- linked_profile_id: en el perfil de Nacho apunta al id de mamá, y viceversa

-- ============ locations ============
create table locations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade, -- siempre el de mamá
  lat double precision not null,
  lng double precision not null,
  accuracy_m numeric,
  recorded_at timestamptz default now()
);
create index on locations (profile_id, recorded_at desc);
-- la última ubicación = SELECT ... ORDER BY recorded_at DESC LIMIT 1

-- ============ safe_zones ============
create table safe_zones (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade, -- de mamá
  name text default 'Casa',
  lat double precision not null,
  lng double precision not null,
  radius_m integer default 200,
  created_at timestamptz default now()
);

-- ============ contacts ============
create table contacts (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references profiles(id) on delete cascade, -- de mamá
  name text not null,
  phone text not null,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- ============ alerts ============
create table alerts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade, -- de mamá
  type text not null check (type in ('sos', 'zona_segura', 'ia_revisar', 'ia_ok')),
  message text,
  status text default 'pendiente' check (status in ('pendiente', 'visto')),
  created_at timestamptz default now()
);
create index on alerts (profile_id, created_at desc);

-- ============ check_ins ============
create table check_ins (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade, -- de mamá
  note text default 'Estoy bien',
  created_at timestamptz default now()
);

-- ============ quick_messages ============
create table quick_messages (
  id uuid primary key default gen_random_uuid(),
  from_profile_id uuid not null references profiles(id),
  to_profile_id uuid not null references profiles(id),
  text text not null,
  created_at timestamptz default now()
);
```

## Row Level Security (RLS) — reglas base

Activar RLS en todas las tablas. Idea general: cada uno lee/escribe lo suyo, y el cuidador puede leer (no escribir) los datos de mamá si está vinculado.

```sql
alter table profiles enable row level security;
alter table locations enable row level security;
alter table safe_zones enable row level security;
alter table contacts enable row level security;
alter table alerts enable row level security;
alter table check_ins enable row level security;
alter table quick_messages enable row level security;

-- Ejemplo con locations (mismo patrón para safe_zones, alerts, check_ins, contacts):
create policy "mama lee y escribe su propia ubicación"
  on locations for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "cuidador vinculado puede leer ubicación de mamá"
  on locations for select
  using (
    profile_id in (
      select linked_profile_id from profiles where id = auth.uid()
    )
  );
```

Repetir la misma lógica (dueño = todo, vinculado = solo lectura) para `safe_zones`, `alerts`, `check_ins`, `contacts`. Para `quick_messages`, ambos lados (from/to) necesitan poder leer los mensajes entre sí.

## Realtime

Habilitar Realtime en Supabase para estas tablas, así el dashboard de Nacho se actualiza solo sin refrescar:

- `locations` (el mapa se mueve solo)
- `alerts` (el banner de emergencia aparece al instante)
- `check_ins` (el "todo bien" se refleja en vivo)

## Notas de implementación

- La "última ubicación" no necesita tabla aparte — se resuelve con un `SELECT` ordenado por `recorded_at DESC LIMIT 1`. Si más adelante pesa mucho el historial, se puede pasar a una tabla `current_location` (upsert) + `location_history` aparte, pero no hace falta para el MVP.
- `alerts` de tipo `ia_revisar` / `ia_ok` son las que hoy genera el análisis de IA simulado del dashboard — quedan listas para cuando ese análisis se conecte a datos reales.
- Vitales (ritmo cardíaco, sueño, pasos) **no están en este esquema todavía** — siguen sin definir si vienen de un reloj/podómetro real o quedan fuera del alcance inicial (ver `progress.md`, sección Pendiente).
