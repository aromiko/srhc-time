-- SRHC Time - deactivate Personal leave, add monthly SL/VL auto-accrual.
-- Run this once in the Supabase SQL editor, after 0004_indexes.sql.

-- ---------------------------------------------------------------------------
-- Soft-remove "Personal" leave (kept in the DB, just hidden from pickers).
-- No one has ever used it (verified before writing this migration), so
-- hiding it is safe - nothing disappears from anyone's history.
-- ---------------------------------------------------------------------------

alter table public.leave_types
  add column is_active boolean not null default true;

update public.leave_types set is_active = false where name = 'Personal';

-- Every employee already has a seeded 0/0 Personal balance row from account
-- creation. Since it's genuinely empty for everyone, remove those rows so
-- Personal disappears entirely rather than lingering as a 0/0/0 line.
delete from public.leave_balances
where leave_type_id in (select id from public.leave_types where name = 'Personal')
  and allocated_days = 0
  and used_days = 0;

-- ---------------------------------------------------------------------------
-- One-time skip flag: lets an employee be excluded from the *next* monthly
-- accrual run only (auto-resets to false once consumed). Used here to skip
-- Maure Jeal Gaspar Carolina for the September grant, since her Sick/Vacation
-- balance was already set manually. General-purpose for future cases too
-- (e.g. a new hire whose starting balance was just hand-entered).
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column skip_next_accrual boolean not null default false;

update public.profiles
set skip_next_accrual = true
where full_name = 'Maure Jeal Gaspar Carolina';

-- ---------------------------------------------------------------------------
-- Monthly accrual: +1 Sick, +1 Vacation allocated_days for every
-- role='employee' profile, run automatically on the 1st of each month.
-- ---------------------------------------------------------------------------

create or replace function public.accrue_monthly_leave()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sick_id uuid;
  vacation_id uuid;
  emp record;
  bal_id uuid;
  bal_used numeric;
begin
  select id into sick_id from public.leave_types where name = 'Sick';
  select id into vacation_id from public.leave_types where name = 'Vacation';

  for emp in select id, skip_next_accrual from public.profiles where role = 'employee' loop
    if emp.skip_next_accrual then
      update public.profiles set skip_next_accrual = false where id = emp.id;
      continue;
    end if;

    select id, used_days into bal_id, bal_used
      from public.leave_balances where user_id = emp.id and leave_type_id = sick_id;
    if bal_id is null then
      insert into public.leave_balances (user_id, leave_type_id, allocated_days, used_days)
      values (emp.id, sick_id, 1, 0);
    else
      update public.leave_balances set allocated_days = allocated_days + 1 where id = bal_id;
    end if;

    select id, used_days into bal_id, bal_used
      from public.leave_balances where user_id = emp.id and leave_type_id = vacation_id;
    if bal_id is null then
      insert into public.leave_balances (user_id, leave_type_id, allocated_days, used_days)
      values (emp.id, vacation_id, 1, 0);
    else
      update public.leave_balances set allocated_days = allocated_days + 1 where id = bal_id;
    end if;
  end loop;
end;
$$;

-- Requires the pg_cron extension. On most Supabase projects this succeeds
-- directly; if it errors with a permissions message, enable it instead via
-- Dashboard -> Database -> Extensions -> search "pg_cron" -> Enable, then
-- re-run just the `select cron.schedule(...)` statement below.
create extension if not exists pg_cron;

-- Midnight UTC on the 1st of every month (~8am Philippines time on the 1st).
-- Re-running this statement is safe - a job with the same name is replaced.
select cron.schedule(
  'monthly-leave-accrual',
  '0 0 1 * *',
  $$ select public.accrue_monthly_leave(); $$
);
