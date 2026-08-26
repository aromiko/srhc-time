-- SRHC Time - initial schema
-- Run this once in the Supabase SQL editor (or via `supabase db push`).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null default 'employee' check (role in ('admin', 'employee')),
  created_at timestamptz not null default now()
);

create table public.leave_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.leave_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  leave_type_id uuid not null references public.leave_types (id) on delete cascade,
  allocated_days numeric not null default 0,
  used_days numeric not null default 0,
  unique (user_id, leave_type_id)
);

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  leave_type_id uuid not null references public.leave_types (id),
  start_date date not null,
  end_date date not null,
  days_requested numeric not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  admin_notes text,
  created_at timestamptz not null default now()
);

-- Seed a simple set of leave types.
insert into public.leave_types (name) values ('Vacation'), ('Sick'), ('Personal');

-- ---------------------------------------------------------------------------
-- Auto-create a profile row whenever a new auth user signs up.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'employee')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.leave_types enable row level security;
alter table public.leave_balances enable row level security;
alter table public.leave_requests enable row level security;

-- profiles
create policy "profiles_select" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin());

-- leave_types: any signed-in user can read; only admin can manage
create policy "leave_types_select" on public.leave_types
  for select using (auth.uid() is not null);

create policy "leave_types_write_admin" on public.leave_types
  for all using (public.is_admin()) with check (public.is_admin());

-- leave_balances
create policy "leave_balances_select" on public.leave_balances
  for select using (user_id = auth.uid() or public.is_admin());

create policy "leave_balances_write_admin" on public.leave_balances
  for all using (public.is_admin()) with check (public.is_admin());

-- leave_requests
create policy "leave_requests_select" on public.leave_requests
  for select using (user_id = auth.uid() or public.is_admin());

create policy "leave_requests_insert_own" on public.leave_requests
  for insert with check (user_id = auth.uid() and status = 'pending');

create policy "leave_requests_update_admin" on public.leave_requests
  for update using (public.is_admin());
