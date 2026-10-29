-- Admins can switch "Request access" on/off for new users (Access requests page).
insert into public.app_settings(key,value) values ('access_requests_enabled','true'::jsonb)
on conflict (key) do nothing;
