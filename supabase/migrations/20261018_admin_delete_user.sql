-- Allows the owner/super admins to delete a user's Auth account and cascade their personal data.
-- The owner cannot be deleted. Super admins cannot delete themselves or other super admins.
create or replace function public.admin_delete_user(p_target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_role text;
  v_target_role text;
begin
  select p.role into v_actor_role from public.profiles p where p.id = auth.uid();
  if coalesce(v_actor_role,'') not in ('owner','super_admin') then
    raise exception 'Admin access required';
  end if;
  if p_target_user_id = auth.uid() then raise exception 'You cannot delete your own account here'; end if;
  select p.role into v_target_role from public.profiles p where p.id = p_target_user_id for update;
  if not found then raise exception 'User not found'; end if;
  if v_target_role = 'owner' then raise exception 'The owner account cannot be deleted'; end if;
  if v_actor_role <> 'owner' and v_target_role = 'super_admin' then
    raise exception 'Only the owner can delete a super admin';
  end if;
  delete from auth.users where id = p_target_user_id;
  if not found then raise exception 'Auth user not found'; end if;
end;
$$;
revoke all on function public.admin_delete_user(uuid) from public;
grant execute on function public.admin_delete_user(uuid) to authenticated;
