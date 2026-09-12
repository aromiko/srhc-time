-- SRHC Time - lets an employee edit or cancel their OWN leave request while
-- it's still pending (not yet reviewed). Once approved/declined it's locked -
-- only admin can change it from there via the existing admin-only policy.
-- Run this once in the Supabase SQL editor, after 0014_admin_file_leave.sql.

create policy "leave_requests_update_own_pending" on public.leave_requests
  for update
  using (user_id = auth.uid() and status = 'pending')
  with check (user_id = auth.uid() and status = 'pending');

create policy "leave_requests_delete_own_pending" on public.leave_requests
  for delete
  using (user_id = auth.uid() and status = 'pending');
