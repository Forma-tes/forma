-- Link each debt to the account used to pay its installments.
alter table public.debts
  add column if not exists account_id uuid references public.financial_accounts(id) on delete set null;

create index if not exists debts_user_account_idx on public.debts(user_id, account_id);

-- Existing debts remain editable; assign an account to each existing debt in the app before recording a new installment.
