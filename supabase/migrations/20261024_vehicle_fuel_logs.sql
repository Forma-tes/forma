-- Vehicle fuel fill-up history. Additive migration; does not modify schema.sql.
create table if not exists public.vehicle_fuel_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  fill_date date not null default current_date,
  odometer numeric(12,1) not null check (odometer >= 0),
  liters numeric(10,2) not null check (liters > 0),
  cost numeric(12,2) not null default 0 check (cost >= 0),
  station text,
  transaction_id uuid references public.transactions(id) on delete set null,
  full_tank boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists vehicle_fuel_logs_user_date_idx on public.vehicle_fuel_logs(user_id,fill_date desc);
create index if not exists vehicle_fuel_logs_vehicle_odometer_idx on public.vehicle_fuel_logs(vehicle_id,odometer desc);
alter table public.vehicle_fuel_logs enable row level security;
drop policy if exists vehicle_fuel_logs_select_own on public.vehicle_fuel_logs;
create policy vehicle_fuel_logs_select_own on public.vehicle_fuel_logs for select to authenticated using (auth.uid() = user_id);
drop policy if exists vehicle_fuel_logs_insert_own on public.vehicle_fuel_logs;
create policy vehicle_fuel_logs_insert_own on public.vehicle_fuel_logs for insert to authenticated with check (auth.uid() = user_id and exists(select 1 from public.vehicles v where v.id=vehicle_id and v.user_id=auth.uid()));
drop policy if exists vehicle_fuel_logs_update_own on public.vehicle_fuel_logs;
create policy vehicle_fuel_logs_update_own on public.vehicle_fuel_logs for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id and exists(select 1 from public.vehicles v where v.id=vehicle_id and v.user_id=auth.uid()));
drop policy if exists vehicle_fuel_logs_delete_own on public.vehicle_fuel_logs;
create policy vehicle_fuel_logs_delete_own on public.vehicle_fuel_logs for delete to authenticated using (auth.uid() = user_id);
