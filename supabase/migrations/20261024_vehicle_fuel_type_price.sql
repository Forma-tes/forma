-- Add fuel type and unit price to fuel records. Safe additive migration.
alter table public.vehicle_fuel_logs
  add column if not exists fuel_type text not null default '95 Octane',
  add column if not exists price_per_liter numeric(10,2) not null default 0;
