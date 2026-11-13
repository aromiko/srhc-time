-- SRHC Time - Sick leave no longer accumulates. Everyone gets 1 SL per month
-- and any unused SL from the previous month does NOT carry over.
-- Run this once in the Supabase SQL editor, after 0018_wellness_break_leave.sql.
--
-- Model: on the 1st, each employee's Sick balance is reset to
--   allocated_days = 1
--   used_days      = approved Sick days whose start_date is in that month
-- (usually 0, but counts any SL already filed + approved ahead of time).
-- The app uses the same "count this month's approved SL" rule whenever a
-- Sick request is approved/edited/deleted, so past-month SL never touches
-- the current month's balance.

create or replace function public.reset_monthly_sick_leave(for_month date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sick_id uuid;
  month_start date := date_trunc('month', for_month)::date;
  month_end date := (date_trunc('month', for_month) + interval '1 month')::date;
begin
  select id into sick_id from public.leave_types where name = 'Sick';

  insert into public.leave_balances (user_id, leave_type_id, allocated_days, used_days)
  select
    p.id,
    sick_id,
    1,
    coalesce((
      select sum(r.days_requested)
      from public.leave_requests r
      where r.user_id = p.id
        and r.leave_type_id = sick_id
        and r.status = 'approved'
        and r.start_date >= month_start
        and r.start_date < month_end
    ), 0)
  from public.profiles p
  where p.role = 'employee'
    and not p.skip_next_accrual
  on conflict (user_id, leave_type_id) do update
    set allocated_days = excluded.allocated_days,
        used_days = excluded.used_days;
end;
$$;

-- Monthly job (same cron schedule as before): Sick resets to 1, Vacation
-- still accrues +1 and carries over as it always has.
create or replace function public.accrue_monthly_leave()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  vacation_id uuid;
  emp record;
begin
  select id into vacation_id from public.leave_types where name = 'Vacation';

  perform public.reset_monthly_sick_leave((now() at time zone 'Asia/Manila')::date);

  for emp in select id, skip_next_accrual from public.profiles where role = 'employee' loop
    if emp.skip_next_accrual then
      update public.profiles set skip_next_accrual = false where id = emp.id;
      continue;
    end if;

    insert into public.leave_balances (user_id, leave_type_id, allocated_days, used_days)
    values (emp.id, vacation_id, 1, 0)
    on conflict (user_id, leave_type_id) do update
      set allocated_days = public.leave_balances.allocated_days + 1;
  end loop;
end;
$$;

-- Apply the new rule right now for the current month: wipes any SL that
-- accumulated from previous months, leaving 1 SL for this month minus any
-- SL already approved this month.
select public.reset_monthly_sick_leave((now() at time zone 'Asia/Manila')::date);
