-- Access requests storage + admin dashboard RPCs. Safe to re-run.
create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null default '',
  user_name text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','denied')),
  created_at timestamptz not null default now(),
  notified_at timestamptz
);
create index if not exists access_requests_user_created_idx
  on public.access_requests(user_id, created_at desc);
alter table public.access_requests enable row level security;
drop policy if exists "Users can view own access requests" on public.access_requests;
create policy "Users can view own access requests" on public.access_requests
  for select to authenticated using (auth.uid() = user_id);
revoke all on public.access_requests from anon, authenticated;
grant select on public.access_requests to authenticated;

create or replace function public.admin_list_access_requests()
returns table (
  id uuid,
  user_id uuid,
  user_email text,
  user_name text,
  status text,
  created_at timestamptz,
  notified_at timestamptz
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
    select ar.id, ar.user_id, ar.user_email, ar.user_name, ar.status, ar.created_at, ar.notified_at
    from public.access_requests ar
    order by case when ar.status = 'pending' then 0 else 1 end, ar.created_at desc;
end;
$$;

create or replace function public.admin_update_access_request(p_request_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_forma_admin() then
    raise exception 'Admin access required';
  end if;
  if p_status not in ('pending','approved','denied') then
    raise exception 'Invalid access request status';
  end if;
  if p_status = 'approved' then
    -- Grant every workspace feature as part of the same transaction as approval.
    update public.profiles
      set enabled_features = array[
        'overview','transactions','accounts','calendar','budgets',
        'goals','subscriptions','debts','insights','expense_categories'
      ]::text[],
      updated_at = now()
      where id = (select ar.user_id from public.access_requests ar where ar.id = p_request_id);
    if not found then
      raise exception 'User profile not found for this access request';
    end if;
  end if;

  update public.access_requests set status = p_status where id = p_request_id;
  if not found then raise exception 'Access request not found'; end if;
end;
$$;

revoke all on function public.admin_list_access_requests() from public, anon;
revoke all on function public.admin_update_access_request(uuid, text) from public, anon;
grant execute on function public.admin_list_access_requests() to authenticated;
grant execute on function public.admin_update_access_request(uuid, text) to authenticated;
