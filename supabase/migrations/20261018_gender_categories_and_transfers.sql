-- Pocket: support transfers between accounts/wallets.
-- Run in Supabase SQL Editor before deploying the updated app.
alter table public.transactions add column if not exists to_account_id uuid references public.financial_accounts(id) on delete set null;
alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions add constraint transactions_type_check check (type in ('Income','Expense','Transfer'));
