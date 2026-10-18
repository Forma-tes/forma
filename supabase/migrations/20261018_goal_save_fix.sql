-- Pocket: fix goal creation/editing for the current Goals wizard.
-- The UI submits goal_type; older schemas did not include this column.
-- Safe to run more than once.
alter table public.savings_goals
  add column if not exists goal_type text not null default 'Other';

-- Keep recurring payment schema aligned with the Add Payment wizard.
alter table public.recurring_payments
  add column if not exists subcategory text;
