-- Additive: keep profiles.email in step when a user adds / confirms a real email. Nothing is dropped or removed.
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

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_email_updated' and tgrelid = 'auth.users'::regclass) then
    create trigger on_auth_user_email_updated after update of email on auth.users
      for each row execute procedure public.sync_profile_email();
  end if;
end $$;
