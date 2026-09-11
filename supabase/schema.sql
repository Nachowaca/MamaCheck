-- MamaCheck — schema inicial
-- Correr esto entero en Supabase → SQL Editor → New query → Run

create extension if not exists "pgcrypto";

-- Un "household" agrupa a Nacho (cuidador) y a mamá
create table households (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

-- Un perfil por usuario autenticado (se crea automático al primer login, ver trigger abajo)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid references households(id) on delete set null,
  role text check (role is null or role in ('cuidador', 'mama')), -- null hasta elegir rol (ver claimRole)
  name text,
  email text,
  phone text,
  push_token text,
  battery_level integer,
  battery_charging boolean,
  created_at timestamptz not null default now()
);

create table safe_zones (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null default 'Casa',
  lat double precision not null,
  lng double precision not null,
  radius_m integer not null default 150,
  created_at timestamptz not null default now()
);

create table locations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  recorded_at timestamptz not null default now()
);
create index locations_household_recorded_idx on locations (household_id, recorded_at desc);

-- Auto-limpieza: al guardar una ubicación nueva, borra las de esa misma
-- household con más de 10 días. Sin mantenimiento, sin extensiones extra
-- (pg_cron) — la tabla se auto-poda sola con el uso normal.
create or replace function cleanup_old_locations()
returns trigger
language plpgsql
as $$
begin
  delete from locations
  where household_id = new.household_id
    and recorded_at < now() - interval '10 days';
  return new;
end;
$$;

create trigger trg_cleanup_old_locations
  after insert on locations
  for each row execute function cleanup_old_locations();

create table contacts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  phone text not null,
  initial text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table alerts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('checkin', 'sos', 'zone_exit', 'zone_enter', 'message')),
  text text not null,
  created_at timestamptz not null default now()
);
create index alerts_household_created_idx on alerts (household_id, created_at desc);

-- Realtime: publicar las tablas que el dashboard del cuidador escucha en vivo
alter publication supabase_realtime add table locations, alerts, profiles;

-- ---------- RLS ----------
alter table households enable row level security;
alter table profiles enable row level security;
alter table safe_zones enable row level security;
alter table locations enable row level security;
alter table contacts enable row level security;
alter table alerts enable row level security;

create or replace function my_household_id()
returns uuid
language sql stable security definer
as $$
  select household_id from profiles where id = auth.uid();
$$;

create policy "own profile select" on profiles
  for select using (id = auth.uid() or household_id = my_household_id());
create policy "own profile update" on profiles
  for update using (id = auth.uid());
create policy "own profile insert" on profiles
  for insert with check (id = auth.uid());

-- Sin datos sensibles (solo id/fecha): cualquier usuario logueado puede verlas,
-- necesario para que el segundo perfil se una a la household existente al elegir rol.
create policy "authenticated select households" on households
  for select using (auth.uid() is not null);
create policy "authenticated insert households" on households
  for insert with check (auth.uid() is not null);

create policy "household select safe_zones" on safe_zones
  for select using (household_id = my_household_id());
create policy "household write safe_zones" on safe_zones
  for all using (household_id = my_household_id());

create policy "household select locations" on locations
  for select using (household_id = my_household_id());
create policy "self insert locations" on locations
  for insert with check (household_id = my_household_id() and user_id = auth.uid());

create policy "household select contacts" on contacts
  for select using (household_id = my_household_id());
create policy "household write contacts" on contacts
  for all using (household_id = my_household_id());

create policy "household select alerts" on alerts
  for select using (household_id = my_household_id());
create policy "household insert alerts" on alerts
  for insert with check (household_id = my_household_id() and user_id = auth.uid());

-- Al loguearse por primera vez, crear el profile automáticamente.
-- Nunca debe poder tumbar el signup si algo sale mal acá (por eso el
-- exception handler) — la app también asegura su propio profile con un
-- upsert al loguearse, como red de seguridad.
create or replace function handle_new_user()
returns trigger
language plpgsql security definer
as $$
begin
  insert into profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
exception when others then
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
