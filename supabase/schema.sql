-- Forma Personal Finance System — Supabase schema
-- Run this in Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_date date not null default current_date,
  type text not null check (type in ('Income','Expense')),
  category text not null,
  description text not null default '',
  amount numeric(14,2) not null check (amount >= 0),
  need_want text check (need_want in ('Need','Want')),
  fixed_variable text check (fixed_variable in ('Fixed','Variable')),
  payment_method text not null default 'Cash',
  recurring boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists transactions_user_date_idx on public.transactions(user_id, transaction_date desc);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  month date not null,
  amount numeric(14,2) not null default 0 check (amount >= 0),
  created_at timestamptz not null default now(),
  unique(user_id, category, month)
);

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(14,2) not null default 0 check (target_amount >= 0),
  saved_amount numeric(14,2) not null default 0 check (saved_amount >= 0),
  target_date date,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.recurring_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null default 'Bills',
  amount numeric(14,2) not null default 0 check (amount >= 0),
  frequency text not null default 'Monthly' check (frequency in ('Weekly','Monthly','Quarterly','Yearly')),
  next_due_date date,
  auto_pay boolean not null default false,
  paid_this_cycle boolean not null default false,
  last_paid_date date,
  essential boolean not null default true,
  notes text not null default '',
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.savings_goals enable row level security;
alter table public.recurring_payments enable row level security;

do $$ declare t text; begin
  foreach t in array array['transactions','budgets','savings_goals','recurring_payments'] loop
    execute format('drop policy if exists "Users manage own %s" on public.%I', t, t);
    execute format('create policy "Users manage own %s" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t, t);
  end loop;
end $$;


-- Optional profile table for account display name.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Create/update a profile when a new auth account is registered.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do update set full_name = excluded.full_name;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Safe migration for existing projects that created recurring_payments before last_paid_date was added.
alter table public.recurring_payments add column if not exists last_paid_date date;

-- Atomically record a recurring payment and advance its next due date.
-- This function only records the payment in Forma; it does not transfer money.
create or replace function public.mark_recurring_payment_paid(p_payment_id uuid, p_paid_date date default current_date)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_payment public.recurring_payments%rowtype;
  v_base_date date;
  v_next_due date;
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
    (user_id, transaction_date, type, category, description, amount, need_want, fixed_variable, payment_method, recurring, notes)
  values
    (auth.uid(), p_paid_date, 'Expense', coalesce(v_payment.category, 'Bills'),
     'Recurring payment: ' || v_payment.name, v_payment.amount, 'Need', 'Fixed', 'Other', true,
     'Generated from recurring payment ' || v_payment.name);

  update public.recurring_payments
  set next_due_date = v_next_due, last_paid_date = p_paid_date, paid_this_cycle = true
  where id = p_payment_id and user_id = auth.uid();
end;
$$;
revoke all on function public.mark_recurring_payment_paid(uuid, date) from public;
grant execute on function public.mark_recurring_payment_paid(uuid, date) to authenticated;
