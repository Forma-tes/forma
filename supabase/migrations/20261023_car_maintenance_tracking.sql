-- Pocket Car Maintenance Tracking
-- Additive migration only. Does not modify schema.sql or existing finance tables.
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  make text not null default '',
  model text not null default '',
  year integer check (year is null or year between 1886 and 2200),
  plate text,
  current_odometer numeric(12,1) not null default 0 check (current_odometer >= 0),
  odometer_unit text not null default 'km' check (odometer_unit in ('km','mi')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists vehicles_user_created_idx on public.vehicles(user_id, created_at desc);

create table if not exists public.maintenance_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  title text not null,
  interval_km numeric(12,1) check (interval_km is null or interval_km > 0),
  interval_months integer check (interval_months is null or interval_months > 0),
  last_service_date date,
  last_service_odometer numeric(12,1) check (last_service_odometer is null or last_service_odometer >= 0),
  next_due_date date,
  next_due_odometer numeric(12,1) check (next_due_odometer is null or next_due_odometer >= 0),
  status text not null default 'active' check (status in ('active','completed','paused')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint maintenance_plans_interval_required check (interval_km is not null or interval_months is not null)
);
create index if not exists maintenance_plans_user_due_idx on public.maintenance_plans(user_id, next_due_date);
create index if not exists maintenance_plans_vehicle_idx on public.maintenance_plans(vehicle_id);

create table if not exists public.vehicle_service_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  service_type text not null default 'Routine maintenance',
  title text not null,
  service_date date not null default current_date,
  odometer numeric(12,1) check (odometer is null or odometer >= 0),
  cost numeric(14,2) not null default 0 check (cost >= 0),
  provider text,
  notes text not null default '',
  transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicle_service_records_transaction_unique unique(transaction_id)
);
create index if not exists vehicle_services_user_date_idx on public.vehicle_service_records(user_id, service_date desc);
create index if not exists vehicle_services_vehicle_idx on public.vehicle_service_records(vehicle_id);

-- Ensure child rows and any linked financial transaction belong to the same authenticated owner.
create or replace function public.pocket_validate_vehicle_ownership()
returns trigger language plpgsql security invoker set search_path = public
as $$
declare v_owner uuid;
declare tx_owner uuid;
begin
  select user_id into v_owner from public.vehicles where id = new.vehicle_id;
  if v_owner is null or v_owner <> new.user_id then
    raise exception 'Vehicle does not belong to this user';
  end if;
  if tg_table_name = 'vehicle_service_records' and new.transaction_id is not null then
    select user_id into tx_owner from public.transactions where id = new.transaction_id;
    if tx_owner is null or tx_owner <> new.user_id then
      raise exception 'Linked transaction does not belong to this user';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists vehicles_validate_owner_plan on public.maintenance_plans;
create trigger vehicles_validate_owner_plan before insert or update on public.maintenance_plans
for each row execute function public.pocket_validate_vehicle_ownership();
drop trigger if exists vehicles_validate_owner_service on public.vehicle_service_records;
create trigger vehicles_validate_owner_service before insert or update on public.vehicle_service_records
for each row execute function public.pocket_validate_vehicle_ownership();

alter table public.vehicles enable row level security;
alter table public.maintenance_plans enable row level security;
alter table public.vehicle_service_records enable row level security;

drop policy if exists "Users manage own vehicles" on public.vehicles;
create policy "Users manage own vehicles" on public.vehicles for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "Users manage own maintenance plans" on public.maintenance_plans;
create policy "Users manage own maintenance plans" on public.maintenance_plans for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "Users manage own vehicle service records" on public.vehicle_service_records;
create policy "Users manage own vehicle service records" on public.vehicle_service_records for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

-- No writes are made to profiles, financial_accounts, protected Goals system accounts, or schema.sql.

-- Register the new module as a permissionable feature while preserving existing role checks.
create or replace function public.admin_update_user_access(
  p_target_user_id uuid,
  p_enabled_features text[] default null,
  p_role text default null
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_actor_role text;
  v_target_role text;
  v_allowed_features constant text[] := array[
    'overview','transactions','accounts','calendar','budgets','goals',
    'subscriptions','debts','insights','reports','expense_categories','vehicle_management'
  ];
begin
  select p.role into v_actor_role from public.profiles p where p.id = auth.uid();
  if coalesce(v_actor_role,'') not in ('owner','super_admin') then raise exception 'Admin access required'; end if;
  select p.role into v_target_role from public.profiles p where p.id = p_target_user_id for update;
  if not found then raise exception 'User profile not found'; end if;
  if v_target_role = 'owner' then raise exception 'The owner account cannot be modified here'; end if;
  if p_enabled_features is not null then
    if exists (select 1 from unnest(p_enabled_features) f where not (f = any(v_allowed_features))) then raise exception 'Unknown feature key'; end if;
    update public.profiles set enabled_features = array(select distinct f from unnest(p_enabled_features) f where f = any(v_allowed_features)), updated_at = now() where id = p_target_user_id;
  end if;
  if p_role is not null then
    if v_actor_role <> 'owner' then raise exception 'Only the owner can change account roles'; end if;
    if p_role not in ('user','super_admin') then raise exception 'Invalid role'; end if;
    update public.profiles set role = p_role, updated_at = now() where id = p_target_user_id;
  end if;
end $$;
revoke all on function public.admin_update_user_access(uuid,text[],text) from public, anon;
grant execute on function public.admin_update_user_access(uuid,text[],text) to authenticated;

create or replace function public.admin_update_access_request(p_request_id uuid, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
declare target_user_id uuid;
begin
  if not public.is_forma_admin() then raise exception 'Admin access required'; end if;
  if p_status not in ('pending','approved','denied') then raise exception 'Invalid access request status'; end if;
  select ar.user_id into target_user_id from public.access_requests ar where ar.id = p_request_id for update;
  if target_user_id is null then raise exception 'Access request not found'; end if;
  if p_status = 'approved' then
    update public.profiles set enabled_features = array[
      'overview','transactions','accounts','calendar','budgets','goals','subscriptions','debts','insights','expense_categories','vehicle_management'
    ]::text[], updated_at = now() where id = target_user_id;
    if not found then raise exception 'User profile not found for this access request'; end if;
  end if;
  update public.access_requests set status = p_status where id = p_request_id;
end $$;
revoke all on function public.admin_update_access_request(uuid,text) from public, anon;
grant execute on function public.admin_update_access_request(uuid,text) to authenticated;

revoke all on public.vehicles, public.maintenance_plans, public.vehicle_service_records from anon;
grant select, insert, update, delete on public.vehicles, public.maintenance_plans, public.vehicle_service_records to authenticated;
