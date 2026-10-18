-- Create one protected Goals savings account for every Pocket user.
-- Apply in Supabase SQL Editor. Safe to run more than once.

alter table public.financial_accounts
  add column if not exists is_system boolean not null default false;

-- Drop the guard temporarily so this migration remains safe to re-run.
drop trigger if exists protect_goals_system_account_changes on public.financial_accounts;

-- Mark any legacy account matching the reserved name as the system account,
-- then ensure one exists for every current auth user.
update public.financial_accounts
set name = 'Goals', type = 'Savings account', opening_balance = 0, color = '#50b99a'
where is_system = true;

update public.financial_accounts a
set is_system = true, name = 'Goals', type = 'Savings account', opening_balance = 0, color = '#50b99a'
where lower(trim(a.name)) = 'goals'
  and a.is_system = false
  and not exists (
    select 1 from public.financial_accounts existing
    where existing.user_id = a.user_id and existing.is_system = true
  )
  and a.id = (
    select candidate.id from public.financial_accounts candidate
    where candidate.user_id = a.user_id and lower(trim(candidate.name)) = 'goals'
    order by candidate.created_at, candidate.id limit 1
  );

create unique index if not exists financial_accounts_one_system_account_per_user
  on public.financial_accounts(user_id)
  where is_system = true;

create or replace function public.ensure_goals_account(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.financial_accounts(user_id, name, type, opening_balance, color, is_system)
  values (p_user_id, 'Goals', 'Savings account', 0, '#50b99a', true)
  on conflict (user_id) where is_system = true do nothing;
end;
$$;

revoke all on function public.ensure_goals_account(uuid) from public, anon, authenticated;

create or replace function public.create_goals_account_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.ensure_goals_account(new.id);
  return new;
end;
$$;

drop trigger if exists create_goals_account_after_signup on auth.users;
create trigger create_goals_account_after_signup
after insert on auth.users
for each row execute function public.create_goals_account_for_new_user();

revoke all on function public.create_goals_account_for_new_user() from public, anon, authenticated;

-- Backfill accounts for all users created before this migration.
do $$
declare user_row record;
begin
  for user_row in select id from auth.users loop
    perform public.ensure_goals_account(user_row.id);
  end loop;
end;
$$;

-- The Goals account is system-managed and cannot be renamed, edited, or deleted.
create or replace function public.protect_goals_system_account()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.is_system = true and current_user not in ('postgres', 'supabase_admin', 'service_role') then
      raise exception 'System accounts can only be created by Pocket.';
    end if;
    if lower(trim(new.name)) = 'goals' and new.is_system = false then
      raise exception 'The name Goals is reserved for the system savings account.';
    end if;
    return new;
  end if;
  if old.is_system = true then
    raise exception 'The system Goals account cannot be edited or deleted.';
  end if;
  if tg_op = 'UPDATE' and lower(trim(new.name)) = 'goals' and new.is_system = false then
    raise exception 'The name Goals is reserved for the system savings account.';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.protect_goals_system_account() from public, anon, authenticated;

drop trigger if exists protect_goals_system_account_changes on public.financial_accounts;
create trigger protect_goals_system_account_changes
before insert or update or delete on public.financial_accounts
for each row execute function public.protect_goals_system_account();
