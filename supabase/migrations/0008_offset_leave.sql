-- SRHC Time - add the Offset leave type.
-- Run this once in the Supabase SQL editor, after 0007_schedule_visibility.sql.

-- Purely additive: it's just another row in leave_types, so it automatically
-- shows up in the File Leave dropdown, the per-employee balance editor, and
-- new-employee seeding (all already filter on is_active, which defaults to
-- true). accrue_monthly_leave() only looks up 'Sick' and 'Vacation' by name,
-- so Offset is naturally excluded from the automatic monthly grant - admin
-- assigns it manually to whoever qualifies.
insert into public.leave_types (name) values ('Offset');
