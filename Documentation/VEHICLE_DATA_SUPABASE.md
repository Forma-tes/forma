# Vehicle data stored in Supabase

## What changed
- Custom vehicle makes and models are now stored in `public.vehicle_makes` and `public.vehicle_models`, scoped to the signed-in user.
- The app loads the catalog from Supabase and writes `Add make` / `Add model` directly to Supabase. The catalog and custom additions use Supabase; browser storage is not used for this catalog.
- The built-in make/model list in `src/main.jsx` is used as a starter catalog and is seeded into the signed-in user's Supabase catalog on first load. This allows the starter catalog to be stored and subsequently loaded from Supabase.
- Vehicle profiles, maintenance plans and service records continue to use the existing Supabase tables (`vehicles`, `maintenance_plans`, `vehicle_service_records`).

## Required migration
Apply `supabase/migrations/20261023_vehicle_catalog_supabase.sql` to the same Supabase project before testing the UI. It creates both catalog tables, indexes, and owner-only RLS policies. No changes to `schema.sql` are required.

## Notes
- Catalog entries are per user, not shared globally across all accounts.
- The seed list is a curated starter list and is not an exhaustive worldwide vehicle database. New makes and models entered by a user persist in Supabase and are available on that user's other devices.
- If the migration has not been applied, catalog reads/writes will show an error rather than silently saving to local storage.
\n\n## Build syntax fix\n\nThe vehicle catalog modal JSX in `src/main.jsx` was rewritten into a multiline conditional block to avoid the reported Vite/JSX parser error. Supabase catalog operations and form behavior are preserved.\n