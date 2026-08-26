-- SRHC Time - visibility changes to support the shared team leave calendar.
-- Run this once in the Supabase SQL editor, after 0001_init.sql.

-- Any signed-in staff member can see everyone's name (needed to label whose
-- leave is on the calendar). Full name isn't sensitive for this internal tool.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (auth.uid() is not null);

-- Any signed-in staff member can see APPROVED leave requests belonging to
-- anyone (for calendar coverage visibility). Pending/declined requests
-- remain visible only to their owner or an admin, via the existing
-- "leave_requests_select" policy.
create policy "leave_requests_select_approved" on public.leave_requests
  for select using (status = 'approved');
