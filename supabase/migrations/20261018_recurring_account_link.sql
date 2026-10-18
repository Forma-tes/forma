-- Link recurring payments to a Pocket account and record paid items against its balance.
-- Safe to run on an existing project; existing payment records are preserved.
alter table public.recurring_payments
  add column if not exists account_id uuid references public.financial_accounts(id) on delete set null;

drop function if exists public.mark_recurring_payment_paid(uuid, date);
create or replace function public.mark_recurring_payment_paid(p_payment_id uuid, p_paid_date date default current_date, p_account_id uuid default null)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_payment public.recurring_payments%rowtype;
  v_base_date date;
  v_next_due date;
  v_account public.financial_accounts%rowtype;
  v_inflow numeric(14,2);
  v_outflow numeric(14,2);
  v_available numeric(14,2);
begin
  select * into v_payment
  from public.recurring_payments
  where id = p_payment_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Recurring payment not found or access denied';
  end if;

  if v_payment.last_paid_date is not null and v_payment.next_due_date is not null
     and p_paid_date < v_payment.next_due_date then
    raise exception 'This recurring payment has already been recorded for the current cycle';
  end if;

  if p_account_id is null then
    raise exception 'Choose an account or wallet for this recurring payment before marking it paid';
  end if;
  select * into v_account from public.financial_accounts
    where id = p_account_id and user_id = auth.uid() for update;
  if not found then
    raise exception 'Account not found or access denied';
  end if;
  select coalesce(sum(amount),0) into v_inflow from public.transactions
    where user_id = auth.uid() and ((type = 'Income' and account_id = p_account_id) or (type = 'Transfer' and to_account_id = p_account_id));
  select coalesce(sum(amount),0) into v_outflow from public.transactions
    where user_id = auth.uid() and type in ('Expense','Transfer') and account_id = p_account_id;
  v_available := coalesce(v_account.opening_balance,0) + v_inflow - v_outflow;
  if v_payment.amount > v_available then
    raise exception 'Insufficient balance in account. Available balance: %', v_available;
  end if;

  v_base_date := coalesce(v_payment.next_due_date, p_paid_date);
  v_next_due := case v_payment.frequency
    when 'Weekly' then (v_base_date + interval '7 days')::date
    when 'Monthly' then (v_base_date + interval '1 month')::date
    when 'Quarterly' then (v_base_date + interval '3 months')::date
    when 'Yearly' then (v_base_date + interval '1 year')::date
    else (v_base_date + interval '1 month')::date
  end;
  while v_next_due <= p_paid_date loop
    v_next_due := case v_payment.frequency
      when 'Weekly' then (v_next_due + interval '7 days')::date
      when 'Monthly' then (v_next_due + interval '1 month')::date
      when 'Quarterly' then (v_next_due + interval '3 months')::date
      when 'Yearly' then (v_next_due + interval '1 year')::date
      else (v_next_due + interval '1 month')::date
    end;
  end loop;

  insert into public.transactions
    (user_id, transaction_date, type, category, subcategory, description, amount, need_want, fixed_variable, payment_method, account_id, recurring, notes)
  values
    (auth.uid(), p_paid_date, 'Expense', coalesce(v_payment.category, 'Bills'), v_payment.subcategory,
     'Recurring payment: ' || v_payment.name, v_payment.amount, 'Need', 'Fixed', v_account.name, p_account_id, true,
     'Generated from recurring payment ' || v_payment.name);

  update public.recurring_payments
  set next_due_date = v_next_due, last_paid_date = p_paid_date, paid_this_cycle = true
  where id = p_payment_id and user_id = auth.uid();
end;
$$;
revoke all on function public.mark_recurring_payment_paid(uuid, date, uuid) from public;
grant execute on function public.mark_recurring_payment_paid(uuid, date, uuid) to authenticated;

