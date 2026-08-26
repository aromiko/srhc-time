-- SRHC Time - indexes matching the app's actual query patterns.
-- Postgres does not auto-index foreign key columns, so these were missing.
-- Cheap and safe to add now, before the tables grow.

create index if not exists leave_requests_user_id_idx on public.leave_requests (user_id);
create index if not exists leave_requests_status_idx on public.leave_requests (status);
create index if not exists leave_requests_date_range_idx on public.leave_requests (start_date, end_date);
create index if not exists leave_balances_user_id_idx on public.leave_balances (user_id);
