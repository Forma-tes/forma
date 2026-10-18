-- Private access-request log. The admin email is kept server-side, never sent to the browser.
create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null default '',
  user_name text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','denied')),
  created_at timestamptz not null default now(),
  notified_at timestamptz
);
create index if not exists access_requests_user_created_idx on public.access_requests(user_id, created_at desc);
alter table public.access_requests enable row level security;
drop policy if exists "Users can view own access requests" on public.access_requests;
create policy "Users can view own access requests" on public.access_requests for select to authenticated using (auth.uid() = user_id);
-- Inserts are performed by the Edge Function with the service role after validating the caller.
revoke all on public.access_requests from anon, authenticated;
grant select on public.access_requests to authenticated;
