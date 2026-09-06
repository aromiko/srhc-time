-- SRHC Time - rename Municipal Shift to CHO Shift, and fix Skeletal - AM /
-- Skeletal - PM using purple and fuchsia, two shades too close to tell apart
-- at a glance. Swaps Skeletal - PM to rose instead.
-- Run this once in the Supabase SQL editor, after 0010_shift_sort_order.sql.

update public.shift_types set name = 'CHO Shift' where name = 'Municipal Shift';
update public.shift_types set color = 'rose' where name = 'Skeletal - PM';
