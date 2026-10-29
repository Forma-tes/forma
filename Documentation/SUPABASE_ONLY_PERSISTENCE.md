# Supabase-only persistence

## Policy
- Financial records and app settings must be persisted in Supabase; browser local storage is not used as an application data store or cache.
- The Supabase client may still use browser storage internally for its authentication session token. This is authentication state, not the Pocket database.
- When Supabase environment variables are missing, the app displays a configuration message and does not fall back to a local demo workspace.
- Transactions, budgets, savings goals, recurring payments, financial accounts, debts, vehicles, fuel logs, maintenance plans, and service history continue to use their Supabase tables.
- User preferences and workspace settings are loaded/saved through `user_settings`; categories and subcategories use the existing Supabase tables and settings payload.

## Deployment requirements
Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the deployment environment. Apply the SQL migrations under `supabase/migrations/` to the matching Supabase project before deploying. Ensure Row Level Security policies permit authenticated users to access only their own records.

## Important
This code change disables browser-based application-data fallback. It does not automatically migrate records that exist only in a previous browser's local storage into Supabase. Export/import or a one-time migration would be required for any such existing local-only records.
