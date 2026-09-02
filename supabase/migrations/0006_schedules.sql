-- SRHC Time - work schedule calendar (separate from leave).
-- Run this once in the Supabase SQL editor, after 0005_leave_accrual.sql.

-- ---------------------------------------------------------------------------
-- Shift types - a small fixed, admin-defined list (no in-app management UI,
-- same precedent as leave_types). `color` is a fixed key looked up in app
-- code against a static Tailwind class map, not built from arbitrary text.
-- ---------------------------------------------------------------------------

create table public.shift_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.shift_types (name, color) values
  ('7AM Duty', 'blue'),
  ('Skeletal - AM', 'purple'),
  ('Skeletal - PM', 'fuchsia'),
  ('Normal Duty', 'green'),
  ('Municipal Shift', 'orange');

-- ---------------------------------------------------------------------------
-- Schedules - one row per employee per day. Admin-assigned only (no
-- request/approval flow, unlike leave). A date-range assignment form expands
-- into one row per day here; re-assigning a day overwrites it (upsert).
-- ---------------------------------------------------------------------------

create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  shift_type_id uuid not null references public.shift_types (id),
  date date not null,
  notes text,
  assigned_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create index schedules_date_idx on public.schedules (date);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.shift_types enable row level security;
alter table public.schedules enable row level security;

create policy "shift_types_select" on public.shift_types
  for select using (auth.uid() is not null);

create policy "shift_types_write_admin" on public.shift_types
  for all using (public.is_admin()) with check (public.is_admin());

-- Visible to every signed-in employee (the whole point of a shared schedule).
create policy "schedules_select" on public.schedules
  for select using (auth.uid() is not null);

create policy "schedules_write_admin" on public.schedules
  for all using (public.is_admin()) with check (public.is_admin());
