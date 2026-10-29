# Pocket Runtime Reference Error Fix

## Changes
- Fixed the debt-card rendering crash caused by referencing the debt form's `f` state and `installmentFees` inside the debt list. The list now calculates the displayed extra cost from that debt record's total repayment and principal.
- Removed the My Space rename control and editor. The sidebar section label is now the fixed default name **My Space**.
- Kept the existing Supabase schema and migrations unchanged.

## Validation
- Source changes were reviewed and the project build was attempted. The build could not run in this environment because Vite dependencies are not installed (`vite: not found`). Run `npm install` and `npm run build` before deploying.
