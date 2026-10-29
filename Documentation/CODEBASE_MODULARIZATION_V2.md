# Pocket codebase modularization — v2

## What changed
- `src/main.jsx` is now the small application entry point and only mounts React.
- `src/App.jsx` contains the application shell, route/page state, data orchestration, and shared application workflows.
- `src/features/FeatureComponents.jsx` contains the exported feature/page/modal components extracted from the former monolithic file.
- Existing shared UI and domain helpers remain in `src/components/SharedUI.jsx` and `src/lib/domain.js`.

## Important scope note
This is a safe extraction boundary, not the final per-page decomposition yet: `App.jsx` still owns the central app state and `FeatureComponents.jsx` still groups multiple components. The next refactor should split that feature module into `pages/` and `components/modals/` modules while preserving prop contracts and Supabase behavior.

## Validation
`npm install --ignore-scripts --no-audit --no-fund` timed out in the working environment, so `npm run build` could not be executed. Treat this ZIP as a refactor candidate until dependencies are installed and build/runtime flows are tested.
