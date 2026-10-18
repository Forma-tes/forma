-- Pocket: replace legacy category labels with the new category system.
-- Run once in Supabase SQL Editor. Existing transaction amounts/dates are preserved.

-- Transactions: keep old leaf labels as subcategories under the new parent categories.
update public.transactions set category = 'Housing', subcategory = coalesce(nullif(subcategory, ''), 'Rent') where type = 'Expense' and category = 'Rent';
update public.transactions set category = 'Food & Groceries', subcategory = coalesce(nullif(subcategory, ''), 'Groceries') where type = 'Expense' and category = 'Food';
update public.transactions set category = 'Bills & Utilities', subcategory = coalesce(nullif(subcategory, ''), 'Other bill') where type = 'Expense' and category = 'Bills';
update public.transactions set category = 'Bills & Utilities', subcategory = coalesce(nullif(subcategory, ''), 'Mobile bill') where type = 'Expense' and category = 'Mobile Bill';
update public.transactions set category = 'Education', subcategory = coalesce(nullif(subcategory, ''), 'Courses') where type = 'Expense' and category = 'Training';
update public.transactions set category = 'Other', subcategory = coalesce(nullif(subcategory, ''), 'Other expense') where type = 'Expense' and category = 'Personal Care';

-- Budgets: remove a legacy budget if the same new category/month already exists, then rename.
delete from public.budgets old
using public.budgets newer
where old.user_id = newer.user_id
  and old.month = newer.month
  and ((old.category = 'Rent' and newer.category = 'Housing')
    or (old.category = 'Food' and newer.category = 'Food & Groceries')
    or (old.category = 'Bills' and newer.category = 'Bills & Utilities')
    or (old.category = 'Mobile Bill' and newer.category = 'Bills & Utilities')
    or (old.category = 'Training' and newer.category = 'Education')
    or (old.category = 'Personal Care' and newer.category = 'Other'));
update public.budgets set category = 'Housing' where category = 'Rent';
update public.budgets set category = 'Food & Groceries' where category = 'Food';
update public.budgets set category = 'Bills & Utilities' where category in ('Bills','Mobile Bill');
update public.budgets set category = 'Education' where category = 'Training';
update public.budgets set category = 'Other' where category = 'Personal Care';

-- Recurring payments: rename old categories to the new parent category system.
update public.recurring_payments set category = 'Housing' where category = 'Rent';
update public.recurring_payments set category = 'Food & Groceries' where category = 'Food';
update public.recurring_payments set category = 'Bills & Utilities' where category in ('Bills','Mobile Bill');
update public.recurring_payments set category = 'Education' where category = 'Training';
update public.recurring_payments set category = 'Other' where category = 'Personal Care';
