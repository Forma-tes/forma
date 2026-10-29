-- Credit cards and installment apps (Valu, Aman, Halan, ...) become real accounts.
-- Additive and safe to run more than once.

-- A credit card / installment app is a financial_accounts row (type 'Credit card' or 'Installment app').
alter table public.financial_accounts add column if not exists credit_limit numeric(14,2);
alter table public.financial_accounts add column if not exists statement_day integer;
alter table public.financial_accounts add column if not exists grace_days integer;
alter table public.financial_accounts add column if not exists pay_from_account_id uuid references public.financial_accounts(id) on delete set null;

alter table public.financial_accounts drop constraint if exists financial_accounts_statement_day_check;
alter table public.financial_accounts add constraint financial_accounts_statement_day_check
  check (statement_day is null or statement_day between 1 and 28);
alter table public.financial_accounts drop constraint if exists financial_accounts_grace_days_check;
alter table public.financial_accounts add constraint financial_accounts_grace_days_check
  check (grace_days is null or grace_days between 0 and 90);
alter table public.financial_accounts drop constraint if exists financial_accounts_credit_limit_check;
alter table public.financial_accounts add constraint financial_accounts_credit_limit_check
  check (credit_limit is null or credit_limit >= 0);

-- An installment plan can belong to an installment app account.
alter table public.debts add column if not exists provider_account_id uuid references public.financial_accounts(id) on delete set null;
create index if not exists debts_user_provider_idx on public.debts(user_id, provider_account_id);
