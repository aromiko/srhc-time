-- SRHC Time - add contact/HR reference fields to profiles.
-- Run this once in the Supabase SQL editor, after 0002_calendar_visibility.sql.

alter table public.profiles
  add column mobile_number text,
  add column birthday date;
