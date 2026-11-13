-- SRHC Time - half-day leave records whether it's the morning (AM) or
-- afternoon (PM). Null for full-day leave (days_requested = 0.5 means half day).
-- Run this once in the Supabase SQL editor, after 0019_monthly_sick_leave_reset.sql.

alter table public.leave_requests
  add column half_day_period text check (half_day_period in ('am', 'pm'));
