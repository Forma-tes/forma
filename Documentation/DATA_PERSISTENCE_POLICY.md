# Pocket data persistence policy

- Financial records (transactions, budgets, savings goals, recurring payments, accounts, and debts) are read from and written to Supabase.
- Vehicle records, maintenance plans, service records, fuel logs, and vehicle catalog additions are stored in Supabase.
- Per-user preferences and configurable workspace settings are stored in the `user_settings` table in Supabase.
- Authentication and user access profiles are handled through Supabase Auth and Supabase tables/functions.
- Pocket does not use browser `localStorage` or `sessionStorage` as a data store or offline cache. If Supabase credentials are missing, the app displays a configuration screen instead of falling back to local/demo data.
- Importing transactions writes the imported rows to Supabase. Export/backup files are user-initiated files, not a second live database.
- Browser state is limited to transient UI state for the current page session.
