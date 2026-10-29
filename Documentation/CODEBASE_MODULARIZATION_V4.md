# Codebase modularization — v4

## Changes in this pass
- Moved Supabase client creation and environment readiness checks into `src/lib/supabase.js`.
- Moved `WorkspaceSkeleton` and `PasswordInput` out of `App.jsx` into `src/components/AppShared.jsx`.
- Updated `App.jsx` to import these modules rather than defining them inline.
- Kept existing feature exports and behavior intact; no schema, route, or UI copy changes were intended.

## Current structure
- `src/main.jsx`: app entry point and stylesheet import.
- `src/App.jsx`: application orchestration and remaining shared state/handlers.
- `src/lib/supabase.js`: Supabase client setup and auth redirect URL helper.
- `src/lib/domain.js`: domain helpers and defaults.
- `src/components/SharedUI.jsx`: reusable visual components.
- `src/components/AppShared.jsx`: app-level skeleton and password input.
- `src/features/pages/FinancePages.jsx`: existing finance page components (still grouped; further extraction remains).
- `src/features/modals/FinanceModals.jsx`: existing finance modal components (still grouped; further extraction remains).
- `src/features/admin/AccessAndVehicles.jsx`: existing admin and vehicle components (still grouped; further extraction remains).
- `src/features/auth/AccountAndSettings.jsx`: existing auth/profile/settings components (still grouped; further extraction remains).

## Validation
`npm install --ignore-scripts --no-audit --no-fund` timed out in this environment, so `npm run build` could not be run. Do not treat this pass as build-verified. Next step: extract individual pages and modal components with their dependencies, then run a build in an environment with dependencies available.
