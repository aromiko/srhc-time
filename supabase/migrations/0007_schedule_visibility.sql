-- SRHC Time - restrict schedule visibility to own shifts only (admin sees all).
-- Run this once in the Supabase SQL editor, after 0006_schedules.sql.

drop policy if exists "schedules_select" on public.schedules;

create policy "schedules_select" on public.schedules
  for select using (user_id = auth.uid() or public.is_admin());
