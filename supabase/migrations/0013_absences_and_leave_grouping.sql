-- SRHC Time - unauthorized absences (separate from leave, no approval flow,
-- no balance impact), plus explicit display order for leave types so the
-- Leave calendar can group by category the same way the Schedule calendar
-- already does (VL / SL / OL / ABSENCES instead of insertion order).
-- Run this once in the Supabase SQL editor, after 0012_multi_shift_per_day.sql.

-- ---------------------------------------------------------------------------
-- Absences - mirrors schedules' shape: admin-assigned, one row per person
-- per day, no request/approval flow, does not touch leave_balances.
-- ---------------------------------------------------------------------------

create table public.absences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  reason text,
  recorded_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create index absences_date_idx on public.absences (date);

alter table public.absences enable row level security;

-- Visible to every signed-in user (it needs to appear on the shared
-- "Leave and Absences" calendar the same way approved leave does).
create policy "absences_select" on public.absences
  for select using (auth.uid() is not null);

create policy "absences_write_admin" on public.absences
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Explicit leave type order (was insertion order) - lets the Leave calendar
-- group consistently as VL -> SL -> OL, same idea as shift_types.sort_order.
-- ---------------------------------------------------------------------------

alter table public.leave_types
  add column sort_order integer not null default 0;

update public.leave_types set sort_order = 1 where name = 'Vacation';
update public.leave_types set sort_order = 2 where name = 'Sick';
update public.leave_types set sort_order = 3 where name = 'Offset';
