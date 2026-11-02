-- SMS auto-import: bank SMS forwarded from the phone become transactions.
-- Works with the `sms-ingest` Edge Function (deploy with --no-verify-jwt).

-- Link a Pocket account to the last 4 digits the bank shows in its SMS.
alter table public.financial_accounts add column if not exists sms_account_ref text;
alter table public.financial_accounts drop constraint if exists financial_accounts_sms_ref_check;
alter table public.financial_accounts add constraint financial_accounts_sms_ref_check check (sms_account_ref is null or sms_account_ref ~ '^[0-9]{4}$');

-- Track where a transaction came from, de-duplicate SMS, and flag them for a quick review.
alter table public.transactions add column if not exists external_ref text;
alter table public.transactions add column if not exists source text not null default 'manual';
alter table public.transactions add column if not exists needs_review boolean not null default false;
create unique index if not exists transactions_user_external_ref_uidx on public.transactions(user_id, external_ref) where external_ref is not null;

-- One secret key per user. Only its SHA-256 hash is stored; the plain key is shown once.
create table if not exists public.sms_ingest_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
alter table public.sms_ingest_tokens enable row level security;
drop policy if exists "Users read own sms token status" on public.sms_ingest_tokens;
create policy "Users read own sms token status" on public.sms_ingest_tokens for select using (auth.uid() = user_id);
drop policy if exists "Users delete own sms token" on public.sms_ingest_tokens;
create policy "Users delete own sms token" on public.sms_ingest_tokens for delete using (auth.uid() = user_id);

-- Creates (or replaces) the caller's key and returns it once.
create or replace function public.rotate_sms_ingest_token()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_token text;
begin
  if auth.uid() is null then raise exception 'Sign in is required'; end if;
  new_token := 'pk_sms_' || encode(gen_random_bytes(24), 'hex');
  insert into public.sms_ingest_tokens(user_id, token_hash, created_at, last_used_at)
  values (auth.uid(), encode(digest(new_token, 'sha256'), 'hex'), now(), null)
  on conflict (user_id) do update set token_hash = excluded.token_hash, created_at = now(), last_used_at = null;
  return new_token;
end;
$$;
revoke all on function public.rotate_sms_ingest_token() from public, anon;
grant execute on function public.rotate_sms_ingest_token() to authenticated;

-- Log of every SMS received, so unrecognised messages can be checked.
create table if not exists public.sms_inbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  raw_text text not null,
  status text not null check (status in ('imported','duplicate','unparsed','error')),
  detail text,
  transaction_id uuid references public.transactions(id) on delete set null,
  received_at timestamptz not null default now()
);
create index if not exists sms_inbox_user_received_idx on public.sms_inbox(user_id, received_at desc);
alter table public.sms_inbox enable row level security;
drop policy if exists "Users read own sms inbox" on public.sms_inbox;
create policy "Users read own sms inbox" on public.sms_inbox for select using (auth.uid() = user_id);
drop policy if exists "Users delete own sms inbox" on public.sms_inbox;
create policy "Users delete own sms inbox" on public.sms_inbox for delete using (auth.uid() = user_id);
