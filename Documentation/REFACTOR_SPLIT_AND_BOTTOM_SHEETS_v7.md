# v7 — Code split, bug fixes, bottom sheets

## Bugs fixed (were crashing / blank screen at runtime; the build did not catch them)
- `ModalShell is not defined` — opening **Settings** or **Profile** gave a blank screen.
- `setPage is not defined` — **Add transaction** with no accounts crashed.
- Removed the dead demo-login code (a `12345678` demo password was shipped inside the bundle).
- Added an `ErrorBoundary`: any future runtime error shows a "Reload" screen, not a blank page.

## New structure (54 files, no circular imports)
- `src/lib/` format, categories, avatars, features, vehicleCatalog, debtNotes, supabase
- `src/components/ui/` shared small components (one per file, single `PasswordInput`)
- `src/components/modals/` `ModalShell`, `ConfirmActionModal`
- `src/features/<area>/` accounts, admin, auth, budgets, debts, goals, insights, overview, recurring, settings, transactions
- `src/hooks/useSheetManager.js`, `src/styles/sheets.css`
- Removed dead code: `ReportsPage`, `InsightsPage`, demo data, 48 unused `useState` lines, barrel file.

## Bottom sheets
- One CSS file (`styles/sheets.css`) replaces ~6 duplicated/conflicting blocks. Settings no longer detected by `title==='Settings'`.
- `useSheetManager` (mounted once in `App`): scroll lock for every sheet, Escape closes the top sheet, tapping the dark area does not close a sheet that has typed data, focus moves in/out, `role="dialog"`/`aria-modal`/`aria-label="Close"` added.
- The popup notification no longer covers the Cancel/Continue buttons while a sheet is open.
- Vehicle + Category sheets now close with Escape and lock page scroll like the others.
- Debt-type picker is a full-width stacked list.

## Verified
ESLint 0 errors, `vite build` OK, 33-step browser walk (desktop + mobile, mocked Supabase) identical to the original for all pages. Not tested: real phone keyboard, real Supabase.
