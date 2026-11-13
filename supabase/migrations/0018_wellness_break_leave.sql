-- SRHC Time - add the Wellness Break leave type, with 5 days for everyone.
-- Run this once in the Supabase SQL editor, after 0017_admin_delete_leave.sql.

-- Starting allocation a new employee gets for each leave type when their
-- account is created (previously always 0). Only Wellness Break uses it.
alter table public.leave_types
  add column initial_days numeric not null default 0;

-- Like Offset, it's just another leave_types row, so it shows up in every
-- picker / balance editor automatically. accrue_monthly_leave() only touches
-- 'Sick' and 'Vacation', so this is NOT auto-accrued monthly - admin adjusts
-- it per person from the employee page or Batch Add Balance.
insert into public.leave_types (name, sort_order, initial_days)
values ('Wellness Break', 4, 5);

-- Give every existing person 5 days.
insert into public.leave_balances (user_id, leave_type_id, allocated_days, used_days)
select p.id, lt.id, 5, 0
from public.profiles p
cross join public.leave_types lt
where lt.name = 'Wellness Break'
on conflict (user_id, leave_type_id) do nothing;
