-- Additive metadata for verified make/model/year coverage.
-- This does not modify or delete any existing make/model/vehicle rows.
create table if not exists public.vehicle_model_years (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  make_id uuid not null references public.vehicle_makes(id) on delete cascade,
  model_id uuid not null references public.vehicle_models(id) on delete cascade,
  model_year integer not null check (model_year between 1886 and 2100),
  market_code text not null check (market_code in ('EG','AE','SA','KW','QA','BH','OM','GCC','GLOBAL','US')),
  vehicle_type text not null default 'car' check (vehicle_type in ('car','suv','pickup','van','ev','hybrid','commercial')),
  source_name text not null,
  source_url text,
  verification_status text not null default 'unverified' check (verification_status in ('verified','candidate','unverified')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  constraint vehicle_model_years_unique unique (user_id, model_id, model_year, market_code, vehicle_type),
  constraint vehicle_model_years_make_model_owner check (make_id is not null and model_id is not null)
);
create index if not exists vehicle_model_years_lookup_idx
  on public.vehicle_model_years(user_id, make_id, model_id, market_code, model_year);
alter table public.vehicle_model_years enable row level security;
drop policy if exists "Users manage own vehicle model years" on public.vehicle_model_years;
create policy "Users manage own vehicle model years" on public.vehicle_model_years
  for all to authenticated
  using (auth.uid() = user_id and exists (select 1 from public.vehicle_makes m where m.id = make_id and m.user_id = auth.uid()) and exists (select 1 from public.vehicle_models mo where mo.id = model_id and mo.user_id = auth.uid() and mo.make_id = make_id))
  with check (auth.uid() = user_id and exists (select 1 from public.vehicle_makes m where m.id = make_id and m.user_id = auth.uid()) and exists (select 1 from public.vehicle_models mo where mo.id = model_id and mo.user_id = auth.uid() and mo.make_id = make_id));
