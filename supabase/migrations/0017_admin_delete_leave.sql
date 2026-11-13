-- SRHC Time - lets admin permanently delete any leave request (e.g. one filed
-- by mistake). The app refunds used_days first if the request was approved.
-- Run this once in the Supabase SQL editor, after 0016_calendar_events.sql.

create policy "leave_requests_delete_admin" on public.leave_requests
  for delete using (public.is_admin());
