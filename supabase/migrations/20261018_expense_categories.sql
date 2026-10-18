-- Per-user Expense Categories for Pocket. Run in Supabase SQL Editor.
create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 50),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
create index if not exists expense_categories_user_idx on public.expense_categories(user_id, name);
alter table public.expense_categories enable row level security;
drop policy if exists "Users can view own expense categories" on public.expense_categories;
create policy "Users can view own expense categories" on public.expense_categories for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can add own expense categories" on public.expense_categories;
create policy "Users can add own expense categories" on public.expense_categories for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update own expense categories" on public.expense_categories;
create policy "Users can update own expense categories" on public.expense_categories for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete own expense categories" on public.expense_categories;
create policy "Users can delete own expense categories" on public.expense_categories for delete to authenticated using (auth.uid() = user_id);
-- Seed each existing user with the current built-in expense categories. Safe to run more than once.
insert into public.expense_categories (user_id, name)
select u.id, c.name
from auth.users u
cross join (values
 ('Housing'),('Food & Groceries'),('Transportation'),('Bills & Utilities'),('Health'),('Shopping'),('Entertainment'),('Education'),('Travel'),('Savings & Debt'),('Family & Giving'),('Other'),('Beauty & Skincare'),('Hair & Nails'),('Personal & Period Care'),('Fashion & Styling'),('Grooming & Personal Care'),('Fitness & Sports'),('Style & Accessories'),('Car & Gear')
) as c(name)
on conflict (user_id, name) do nothing;
