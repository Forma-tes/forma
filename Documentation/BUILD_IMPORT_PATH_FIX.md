# Build import path fix

Fixed relative imports in the feature modules after they were moved under `src/features/`.

- `src/features/pages/FinancePages.jsx`
- `src/features/modals/FinanceModals.jsx`
- `src/features/admin/AccessAndVehicles.jsx`
- `src/features/auth/AccountAndSettings.jsx`

The imports to `src/lib/domain.js` and `src/components/SharedUI.jsx` now use `../../lib/domain.js` and `../../components/SharedUI.jsx` respectively.

Validation performed: scanned all relative imports in `src` and confirmed each resolves to an existing file. A full Vite build was not run because dependencies (`node_modules`) are not installed in this workspace.
