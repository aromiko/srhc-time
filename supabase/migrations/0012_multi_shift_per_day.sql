-- SRHC Time - allow more than one shift per person per day (e.g. Normal
-- Duty in the morning, a Meeting/Seminar in the afternoon), and add a shift
-- type for occasional off-site meetings/seminars.
-- Run this once in the Supabase SQL editor, after 0011_shift_naming_and_color.sql.

-- One row per (person, day, shift type) instead of one per (person, day) -
-- lets the same person hold two different shift types on the same date
-- without either overwriting the other. Re-assigning the SAME shift type
-- for that person/day still cleanly overwrites (for corrections).
alter table public.schedules drop constraint if exists schedules_user_id_date_key;
alter table public.schedules add constraint schedules_user_id_date_shift_type_id_key
  unique (user_id, date, shift_type_id);

-- New shift type for occasional off-site meetings/seminars. Sort order 6
-- (after the others) since it doesn't have a fixed daily time slot like the
-- rest - specifics go in the Notes field when assigning it.
insert into public.shift_types (name, color, sort_order)
values ('Meeting / Seminar', 'slate', 6);
