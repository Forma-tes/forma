-- Forma Personal Finance System — Supabase schema
-- Run this in Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_date date not null default current_date,
  type text not null check (type in ('Income','Expense','Transfer')),
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

-- Accounts and wallets. The account_id on a transaction is optional for backwards compatibility.
create table if not exists public.financial_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'Bank account',
  opening_balance numeric(14,2) not null default 0,
  color text not null default '#6c7cf5',
  created_at timestamptz not null default now()
);
alter table public.transactions add column if not exists account_id uuid references public.financial_accounts(id) on delete set null;
alter table public.transactions add column if not exists to_account_id uuid references public.financial_accounts(id) on delete set null;
alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions add constraint transactions_type_check check (type in ('Income','Expense','Transfer'));
create index if not exists financial_accounts_user_idx on public.financial_accounts(user_id, created_at);

-- Debt and installment tracking (manual tracker; no lender/payment integrations).
create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  lender text not null default '',
  original_amount numeric(14,2) not null default 0 check (original_amount >= 0),
  remaining_amount numeric(14,2) not null default 0 check (remaining_amount >= 0),
  monthly_payment numeric(14,2) not null default 0 check (monthly_payment >= 0),
  due_date date,
  frequency text not null default 'Monthly' check (frequency in ('Weekly','Monthly','Quarterly','Yearly')),
  notes text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists debts_user_due_idx on public.debts(user_id, due_date);


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
alter table public.financial_accounts enable row level security;
alter table public.debts enable row level security;

do $$ declare t text; begin
  foreach t in array array['transactions','budgets','savings_goals','recurring_payments','financial_accounts','debts'] loop
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

-- ---------------------------------------------------------------------------
-- Role-based access control and per-user feature visibility.
-- The owner is fixed by email; browser metadata never grants a role.
-- New users start as ordinary users with no optional features enabled.
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists email text not null default '';
alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists enabled_features text[] not null default '{}'::text[];
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('owner','super_admin','user'));

-- Backfill emails for existing profiles, and reserve the owner role for the configured owner.
update public.profiles p
set email = coalesce(u.email, p.email, ''),
    full_name = coalesce(nullif(p.full_name,''), u.raw_user_meta_data ->> 'full_name', ''),
    role = case when lower(coalesce(u.email,p.email,'')) = 'mahmoudadel240@gmail.com' then 'owner' else p.role end,
    updated_at = now()
from auth.users u
where u.id = p.id;

-- Ensure the owner profile exists if the owner already registered before this migration.
insert into public.profiles (id,email,full_name,role,enabled_features)
select u.id, u.email, coalesce(u.raw_user_meta_data ->> 'full_name',''), 'owner', '{}'::text[]
from auth.users u
where lower(u.email) = 'mahmoudadel240@gmail.com'
on conflict (id) do update set email=excluded.email, role='owner', updated_at=now();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  v_role := case when lower(coalesce(new.email,'')) = 'mahmoudadel240@gmail.com' then 'owner' else 'user' end;
  insert into public.profiles (id,email,full_name,role,enabled_features,created_at,updated_at)
  values (new.id, coalesce(new.email,''), coalesce(new.raw_user_meta_data ->> 'full_name',''), v_role, '{}'::text[], now(), now())
  on conflict (id) do update
    set email=excluded.email,
        full_name=case when excluded.full_name<>'' then excluded.full_name else public.profiles.full_name end,
        role=case when lower(excluded.email)='mahmoudadel240@gmail.com' then 'owner' else public.profiles.role end,
        updated_at=now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_forma_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('owner','super_admin')
  );
$$;

-- Global UI permissions/settings. Regular users may read settings, but only admins may change them.
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
drop policy if exists "Authenticated users can read app settings" on public.app_settings;
create policy "Authenticated users can read app settings" on public.app_settings
  for select to authenticated using (true);
drop policy if exists "Admins can insert app settings" on public.app_settings;
create policy "Admins can insert app settings" on public.app_settings
  for insert to authenticated with check (public.is_forma_admin());
drop policy if exists "Admins can update app settings" on public.app_settings;
create policy "Admins can update app settings" on public.app_settings
  for update to authenticated using (public.is_forma_admin()) with check (public.is_forma_admin());
grant select, insert, update on public.app_settings to authenticated;
insert into public.app_settings(key,value) values ('backup_restore_for_users','false'::jsonb)
on conflict (key) do nothing;


alter table public.profiles enable row level security;
drop policy if exists "Users manage own profile" on public.profiles;
drop policy if exists "Profiles readable by self or admins" on public.profiles;
drop policy if exists "Users update own profile name" on public.profiles;
create policy "Profiles readable by self or admins" on public.profiles
for select to authenticated using (id = auth.uid() or public.is_forma_admin());
create policy "Users update own profile name" on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Prevent users from editing their own role, email, or feature grants via the table API.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, updated_at) on public.profiles to authenticated;

create or replace function public.admin_list_users()
returns table (
  user_id uuid,
  email text,
  full_name text,
  role text,
  enabled_features text[],
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_forma_admin() then
    raise exception 'Admin access required';
  end if;
  return query
    select p.id, p.email, p.full_name, p.role, p.enabled_features, p.created_at
    from public.profiles p
    order by p.created_at desc nulls last, p.email asc;
end;
$$;

create or replace function public.admin_update_user_access(
  p_target_user_id uuid,
  p_enabled_features text[] default null,
  p_role text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_role text;
  v_target_role text;
  v_allowed_features constant text[] := array[
    'overview','transactions','accounts','calendar','budgets','goals',
    'subscriptions','debts','insights','reports'
  ];
begin
  select p.role into v_actor_role from public.profiles p where p.id = auth.uid();
  if coalesce(v_actor_role,'') not in ('owner','super_admin') then
    raise exception 'Admin access required';
  end if;

  select p.role into v_target_role from public.profiles p where p.id = p_target_user_id for update;
  if not found then raise exception 'User profile not found'; end if;
  if v_target_role = 'owner' then raise exception 'The owner account cannot be modified here'; end if;

  if p_enabled_features is not null then
    if exists (select 1 from unnest(p_enabled_features) f where not (f = any(v_allowed_features))) then
      raise exception 'Unknown feature key';
    end if;
    update public.profiles
      set enabled_features = array(select distinct f from unnest(p_enabled_features) f where f = any(v_allowed_features)),
          updated_at = now()
      where id = p_target_user_id;
  end if;

  if p_role is not null then
    if v_actor_role <> 'owner' then raise exception 'Only the owner can change account roles'; end if;
    if p_role not in ('user','super_admin') then raise exception 'Invalid role'; end if;
    update public.profiles set role=p_role, updated_at=now() where id=p_target_user_id;
  end if;
end;
$$;

revoke all on function public.is_forma_admin() from public;
revoke all on function public.admin_list_users() from public;
revoke all on function public.admin_update_user_access(uuid,text[],text) from public;
grant execute on function public.is_forma_admin() to authenticated;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_update_user_access(uuid,text[],text) to authenticated;
