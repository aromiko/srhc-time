-- SRHC Time - optional nickname, shown on calendar views instead of the
-- full legal name (which truncates badly in narrow calendar cells).
-- Run this once in the Supabase SQL editor, after 0008_offset_leave.sql.

alter table public.profiles
  add column nickname text;
