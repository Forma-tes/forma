-- Pocket: support username-based accounts created by Owner / Super Admin.
-- Run this migration in Supabase SQL Editor before deploying the app/function.

alter table public.profiles add column if not exists username text;
update public.profiles
set username = 'user_' || left(id::text, 8)
where username is null or btrim(username) = '';
create unique index if not exists profiles_username_lower_unique on public.profiles (lower(username));

-- Update profile creation trigger to persist usernames for both normal signups and managed accounts.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare v_role text;
begin
  v_role := case when lower(coalesce(new.email,'')) = 'mahmoudadel240@gmail.com' then 'owner' else 'user' end;
  insert into public.profiles (id,email,username,full_name,role,enabled_features,created_at,updated_at)
  values (
    new.id,
    case when coalesce(new.raw_user_meta_data ->> 'username','') <> '' and coalesce(new.email,'') like '%@users.pocket.local' then '' else coalesce(new.email,'') end,
    nullif(new.raw_user_meta_data ->> 'username',''),
    coalesce(new.raw_user_meta_data ->> 'full_name',''),
    v_role, '{}'::text[], now(), now()
  )
  on conflict (id) do update set
    email = case when excluded.email <> '' then excluded.email else public.profiles.email end,
    username = coalesce(excluded.username, public.profiles.username),
    full_name = case when excluded.full_name <> '' then excluded.full_name else public.profiles.full_name end,
    role = case when lower(excluded.email)='mahmoudadel240@gmail.com' then 'owner' else public.profiles.role end,
    updated_at=now();
  return new;
end;
$$;

-- Include username in the admin user list. Drop first because PostgreSQL cannot change a table-returning function's output type in place.
drop function if exists public.admin_list_users();
create function public.admin_list_users()
returns table (
  user_id uuid,
  email text,
  username text,
  full_name text,
  role text,
  enabled_features text[],
  created_at timestamptz
)
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_forma_admin() then raise exception 'Admin access required'; end if;
  return query
    select p.id, p.email, p.username, p.full_name, p.role, p.enabled_features, p.created_at
    from public.profiles p
    order by p.created_at desc nulls last, p.username asc nulls last, p.email asc;
end;
$$;
revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;
