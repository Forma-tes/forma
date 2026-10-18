-- Allow each user to choose which expense categories appear in transaction forms.
-- Run once in Supabase SQL Editor after the expense_categories table exists.
alter table public.expense_categories
  add column if not exists is_enabled boolean not null default true;
