-- Add an explicit date for when each account's opening balance applies.
-- Existing accounts use their original creation date as requested.
alter table public.financial_accounts add column if not exists opening_balance_date date;
update public.financial_accounts
set opening_balance_date = coalesce(created_at::date, current_date)
where opening_balance_date is null;
alter table public.financial_accounts alter column opening_balance_date set default current_date;
alter table public.financial_accounts alter column opening_balance_date set not null;
