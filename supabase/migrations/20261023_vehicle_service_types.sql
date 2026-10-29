-- User-owned custom service types for Vehicle Management.
create table if not exists public.vehicle_service_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
alter table public.vehicle_service_types enable row level security;
drop policy if exists "Users can view own vehicle service types" on public.vehicle_service_types;
create policy "Users can view own vehicle service types"
  on public.vehicle_service_types for select to authenticated
  using (auth.uid() = user_id);
drop policy if exists "Users can insert own vehicle service types" on public.vehicle_service_types;
create policy "Users can insert own vehicle service types"
  on public.vehicle_service_types for insert to authenticated
  with check (auth.uid() = user_id);
drop policy if exists "Users can update own vehicle service types" on public.vehicle_service_types;
create policy "Users can update own vehicle service types"
  on public.vehicle_service_types for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
