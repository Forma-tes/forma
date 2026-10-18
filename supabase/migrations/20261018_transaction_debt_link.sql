-- Link debt installment transactions to the debt they repay.
-- Safe to run on existing projects; preserves existing transaction data.
alter table public.transactions add column if not exists debt_id uuid null references public.debts(id) on delete set null;
create index if not exists transactions_debt_id_idx on public.transactions(debt_id);
