-- SRHC Time - admin-managed calendar events (conventions, holidays, etc.).
-- Company-wide, not tied to any employee, and visible to everyone on the
-- Leave and Absences calendar. Multi-day events are one row with a range.
-- Run this once in the Supabase SQL editor, after 0015_employee_leave_self_service.sql.

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_date date not null,
  end_date date not null,
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index calendar_events_dates_idx on public.calendar_events (start_date, end_date);

alter table public.calendar_events enable row level security;

create policy "calendar_events_select" on public.calendar_events
  for select using (auth.uid() is not null);

create policy "calendar_events_write_admin" on public.calendar_events
  for all using (public.is_admin()) with check (public.is_admin());
