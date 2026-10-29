# Runtime React and Supabase singleton fix

- Added an explicit Vite React plugin configuration with the automatic JSX runtime to prevent JSX components from depending on a runtime `React` global.
- Updated the four split feature modules to import the single canonical Supabase client from `src/lib/supabase.js` rather than constructing their own clients.
- This removes duplicate GoTrueClient instances sharing the same browser auth storage key.

## Verification

Run `npm install` and `npm run build`. Then smoke-test login, auth session restore, password reset, and one feature action that uses Supabase.
