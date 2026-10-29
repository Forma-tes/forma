-- Store each user's vehicle makes and models in Supabase instead of browser localStorage.
create table if not exists public.vehicle_makes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  created_at timestamptz not null default now(),
  constraint vehicle_makes_user_name_unique unique (user_id, name)
);

create table if not exists public.vehicle_models (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  make_id uuid not null references public.vehicle_makes(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  created_at timestamptz not null default now(),
  constraint vehicle_models_user_make_name_unique unique (user_id, make_id, name)
);

create index if not exists vehicle_makes_user_idx on public.vehicle_makes(user_id);
create index if not exists vehicle_models_user_make_idx on public.vehicle_models(user_id, make_id);

alter table public.vehicle_makes enable row level security;
alter table public.vehicle_models enable row level security;

drop policy if exists "Users manage own vehicle makes" on public.vehicle_makes;
create policy "Users manage own vehicle makes" on public.vehicle_makes
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own vehicle models" on public.vehicle_models;
create policy "Users manage own vehicle models" on public.vehicle_models
  for all to authenticated using (
    auth.uid() = user_id and exists (
      select 1 from public.vehicle_makes m where m.id = make_id and m.user_id = auth.uid()
    )
  ) with check (
    auth.uid() = user_id and exists (
      select 1 from public.vehicle_makes m where m.id = make_id and m.user_id = auth.uid()
    )
  );
