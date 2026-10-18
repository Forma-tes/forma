-- Add actual amount-paid tracking to debt records without deleting existing data.
alter table public.debts add column if not exists amount_paid numeric(14,2) not null default 0;

-- Backfill existing records using the previous total repayment and remaining balance,
-- where available. This keeps previously tracked progress instead of resetting it.
update public.debts
set amount_paid = greatest(
  0,
  coalesce(total_repayment, original_amount, 0) - coalesce(remaining_amount, 0)
)
where amount_paid is null or amount_paid = 0;
