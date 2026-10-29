# Approve Access Request — All Features

This update changes the admin approval RPC so clicking **Approve** on an access request grants the user all 10 workspace features in `public.profiles.enabled_features` in the same transaction as marking the request approved.

## Apply to Supabase
1. Open Supabase Dashboard → SQL Editor for the Pocket project.
2. Run the contents of `supabase/migrations/20261020_approve_access_grants_all_features.sql`.
3. Refresh the app and approve a pending access request.
4. Verify `public.access_requests.status = 'approved'` and that the matching `public.profiles.enabled_features` contains: `overview`, `transactions`, `accounts`, `calendar`, `budgets`, `goals`, `subscriptions`, `debts`, `insights`, `expense_categories`.

No Edge Function redeploy is required for this approval behavior; it is implemented in the database RPC called by the dashboard.
