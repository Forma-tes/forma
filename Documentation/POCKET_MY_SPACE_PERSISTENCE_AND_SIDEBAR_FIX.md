# Pocket My Space Persistence and Sidebar Fix

## Changes

- My Space section name is loaded from the signed-in user's `user_settings.settings.workspaceSectionName` value in Supabase.
- Renaming My Space writes the updated name directly to Supabase and reports success/failure in the app toast. It no longer relies on browser storage.
- Sidebar section dropdowns (My Space, Vehicle Management, Administration, Analyze) close any other open sidebar dropdown when opened, so only one top-level section is expanded at a time.
- Removed the nested “Access management” dropdown under Administration. “Requests” and “Users” now appear directly under Administration; Expense categories remains there as well.

## Validation notes

- The patch preserves the existing Supabase `user_settings` table and stores the name inside the existing JSON `settings` object; no schema migration is required.
- A full production build and live Supabase test were not run in this environment. Verify renaming My Space, refreshing, and signing in on another browser after deployment.
