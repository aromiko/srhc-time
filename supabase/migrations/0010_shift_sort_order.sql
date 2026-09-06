-- SRHC Time - explicit display order for shift types (was alphabetical,
-- which jumbled 7AM Duty away from the top of the day).
-- Run this once in the Supabase SQL editor, after 0009_nickname.sql.

alter table public.shift_types
  add column sort_order integer not null default 0;

update public.shift_types set sort_order = 1 where name = '7AM Duty';
update public.shift_types set sort_order = 2 where name = 'Skeletal - AM';
update public.shift_types set sort_order = 3 where name = 'Normal Duty';
update public.shift_types set sort_order = 4 where name = 'Skeletal - PM';
update public.shift_types set sort_order = 5 where name = 'Municipal Shift';
