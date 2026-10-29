# Pocket navigation, typography, mobile sheets, and session timeout

## Changes
- The Pocket brand row in the sidebar is now a button that navigates to Overview and closes the mobile drawer.
- On narrow screens the sidebar is layered above the app header and spans the full viewport height so the Pocket mark and name remain visible when the drawer opens.
- UI typography uses Manrope consistently, matching the Transactions page's UI font.
- Mobile modal action rows use sticky positioning and safe-area-aware spacing while their content areas remain scrollable.
- Sign-in includes a **Stay logged in** checkbox. When it is unchecked, an authenticated session is signed out after 15 minutes without detected user activity. When checked, the inactivity timeout is disabled and the normal Supabase session behavior is retained.

## Validation notes
- The project build was not verified in this environment because `npm install` timed out and Vite was unavailable.
- Manually verify on mobile: opening the sidebar shows Pocket branding; clicking the brand returns to Overview; long modal forms scroll while actions remain reachable above the keyboard; and an unchecked Stay logged in session signs out after 15 minutes idle.
- The timeout is client-side inactivity handling. A browser that is fully closed or suspended may delay execution until the app resumes; server-side token/session policy remains governed by Supabase configuration.
