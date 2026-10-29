-- When an admin approves an access request, grant all regular workspace features.
-- Safe to re-run. Approval and feature grant happen in one database transaction.
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

  if not exists (select 1 from public.access_requests ar where ar.id = p_request_id) then
    raise exception 'Access request not found';
  end if;

  if p_status = 'approved' then
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
end;
$$;

revoke all on function public.admin_update_access_request(uuid, text) from public, anon;
grant execute on function public.admin_update_access_request(uuid, text) to authenticated;
