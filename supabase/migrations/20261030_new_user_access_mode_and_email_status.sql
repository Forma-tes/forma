-- 1) When "Require access requests" is OFF, brand-new users get full workspace access automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_role text;
  v_requests_on boolean;
  v_features text[];
begin
  v_role := case when lower(coalesce(new.email,'')) = 'mahmoudadel240@gmail.com' then 'owner' else 'user' end;
  select coalesce((value)::text <> 'false', true) into v_requests_on from public.app_settings where key = 'access_requests_enabled';
  v_requests_on := coalesce(v_requests_on, true);
  v_features := case when v_role = 'user' and not v_requests_on
    then array['overview','transactions','accounts','calendar','budgets','goals','subscriptions','debts','insights','expense_categories','vehicle_management']
    else '{}'::text[] end;
  insert into public.profiles (id,email,username,first_name,last_name,gender,full_name,role,enabled_features,created_at,updated_at)
  values (
    new.id,
    case when coalesce(new.raw_user_meta_data ->> 'username','') <> '' and coalesce(new.email,'') like '%@users.pocket.local' then '' else coalesce(new.email,'') end,
    nullif(new.raw_user_meta_data ->> 'username',''),
    nullif(new.raw_user_meta_data ->> 'first_name',''),
    nullif(new.raw_user_meta_data ->> 'last_name',''),
    coalesce(new.raw_user_meta_data ->> 'gender','prefer_not_to_say'),
    coalesce(new.raw_user_meta_data ->> 'full_name',''),
    v_role, v_features, now(), now()
  )
  on conflict (id) do update set
    email = case when excluded.email <> '' then excluded.email else public.profiles.email end,
    username = coalesce(excluded.username, public.profiles.username),
    first_name = coalesce(nullif(excluded.first_name,''), public.profiles.first_name),
    last_name = coalesce(nullif(excluded.last_name,''), public.profiles.last_name),
    gender = coalesce(nullif(excluded.gender,''), public.profiles.gender),
    full_name = case when excluded.full_name <> '' then excluded.full_name else public.profiles.full_name end,
    role = case when lower(excluded.email)='mahmoudadel240@gmail.com' then 'owner' else public.profiles.role end,
    updated_at=now();
  return new;
end;
$$;

-- 2) Admin user list also reports whether the email is verified.
drop function if exists public.admin_list_users();
create function public.admin_list_users()
returns table(user_id uuid, email text, username text, full_name text, first_name text, last_name text, gender text, role text, enabled_features text[], created_at timestamptz, email_verified boolean)
language plpgsql
security definer
set search_path to ''
as $$
begin
  if not public.is_forma_admin() then raise exception 'Admin access required'; end if;
  return query
    select p.id, p.email, p.username, p.full_name, p.first_name, p.last_name, p.gender, p.role, p.enabled_features, p.created_at,
           (u.email_confirmed_at is not null) as email_verified
    from public.profiles p
    left join auth.users u on u.id = p.id
    order by p.created_at desc nulls last, p.username asc nulls last, p.email asc;
end;
$$;
revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;

-- 3) Keep profiles.email in step when a user adds / changes a real email later.
create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if new.email is distinct from old.email and coalesce(new.email,'') not like '%@users.pocket.local' then
    update public.profiles set email = coalesce(new.email,''), updated_at = now() where id = new.id;
  end if;
  return new;
end;
$$;
revoke all on function public.sync_profile_email() from public, anon, authenticated;
drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated after update of email on auth.users
  for each row execute procedure public.sync_profile_email();
