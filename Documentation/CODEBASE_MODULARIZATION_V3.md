# Pocket codebase modularization — v3

## What changed
- Split the former large `src/features/FeatureComponents.jsx` into feature-focused modules:
  - `src/features/admin/AccessAndVehicles.jsx` — vehicle management and administration/access UI.
  - `src/features/pages/FinancePages.jsx` — overview, transactions, budgets, goals, recurring items, reports, accounts, calendar and debt pages.
  - `src/features/modals/FinanceModals.jsx` — transaction/account/budget/debt/goal/recurring and confirmation modal components.
  - `src/features/auth/AccountAndSettings.jsx` — authentication, profile, avatar, expense categories and settings UI.
- Kept `src/features/FeatureComponents.jsx` as a re-export barrel so existing imports remain stable.
- No intended UI, route, database, or business-rule changes.

## Validation
- Run `npm install` and `npm run build` in an environment with package registry access.
- Smoke test login, overview, transactions, accounts, budgets, debts, goals, reports, vehicles, admin, profile and settings.
