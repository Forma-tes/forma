# VehicleOverviewSummary runtime fix

## Issue
The Overview page referenced `VehicleOverviewSummary`, but `FinancePages.jsx` did not import the component. This caused a runtime `ReferenceError` when rendering the Overview page.

## Change
Added a direct named import from `../admin/AccessAndVehicles.jsx` in `src/features/pages/FinancePages.jsx`.

## Validation
Checked that `VehicleOverviewSummary` is exported from `AccessAndVehicles.jsx` and the import path resolves relative to `src/features/pages/FinancePages.jsx`. A full Vite build could not be run because dependency installation timed out in the environment.
