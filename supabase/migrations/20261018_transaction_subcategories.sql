-- Pocket: persist transaction subcategories. Run in Supabase SQL Editor before deploying.
alter table public.transactions add column if not exists subcategory text;
