-- Adds loan term details and installment tracking without deleting existing debt data.
alter table public.debts add column if not exists start_date date;
alter table public.debts add column if not exists term_months integer;
alter table public.debts add column if not exists total_repayment numeric(14,2);
alter table public.debts add column if not exists interest_rate numeric(8,4);
alter table public.debts add column if not exists paid_installments integer not null default 0;
update public.debts
set total_repayment = coalesce(total_repayment, original_amount, 0),
    interest_rate = coalesce(interest_rate, 0),
    paid_installments = coalesce(paid_installments, 0);
