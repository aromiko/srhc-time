-- SRHC Time - lets admin file a leave request directly on an employee's
-- behalf (e.g. they called in sick and can't file it themselves). The
-- existing insert policy only allows a user to insert their own pending
-- row; this adds a second, admin-only insert path for any user/status.
-- Run this once in the Supabase SQL editor, after 0013_absences_and_leave_grouping.sql.

create policy "leave_requests_insert_admin" on public.leave_requests
  for insert with check (public.is_admin());
