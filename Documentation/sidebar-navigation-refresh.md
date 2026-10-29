# Sidebar navigation refresh

- Reorganized the sidebar into Money, Plan, Vehicles, and Admin groups to match the approved reference.
- Kept existing page navigation callbacks, access checks, vehicle tabs, request count, transaction count, profile modal, settings modal, and theme state.
- Added a pinned profile/theme footer and a mobile drawer with overlay, close button, and slide-in behavior.
- No database schema or Supabase data behavior changed.

## Manual checks
1. Open and close the mobile drawer using the menu button, close button, and backdrop.
2. Navigate to each visible section and verify the existing page opens.
3. Verify vehicle subpages still select the correct vehicle tab.
4. Verify transaction and pending-request counts.
5. Open profile and settings; toggle light/dark mode from the sidebar.
6. Check desktop, mobile, and dark theme layouts.
