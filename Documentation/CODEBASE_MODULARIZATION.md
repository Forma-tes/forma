# Codebase modularization — 2026-10-27

## Purpose
Begin breaking the original large `src/main.jsx` into focused ES modules without changing product behavior or routes.

## New modules
- `src/lib/domain.js`: finance-domain constants, category data, date/format helpers, feature mappings, and starter data.
- `src/components/SharedUI.jsx`: reusable UI building blocks (`ProfileAvatar`, `PageHeading`, `MonthPicker`, `MetricCard`, `EmptyState`, `WizardProgress`, `ChoiceCards`, `Field`, and `CategoryGlyph`).

## Entry point
`src/main.jsx` continues to own application orchestration and page-specific logic. It imports domain helpers and shared UI components from the new modules. This is the first extraction step; further page-level extraction should be done in small batches so shared dependencies and behavior can be tested after each batch.

## Validation
`npm install --ignore-scripts --no-audit --no-fund` did not finish within the available execution window, so `npm run build` could not be run. Please run `npm install` and `npm run build` in the project environment before deploying.
