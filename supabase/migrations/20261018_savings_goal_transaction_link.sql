-- Link a transfer to a savings goal without classifying the transfer as income or expense.
alter table public.transactions add column if not exists goal_id uuid null references public.savings_goals(id) on delete set null;
create index if not exists transactions_goal_id_idx on public.transactions(goal_id) where goal_id is not null;
