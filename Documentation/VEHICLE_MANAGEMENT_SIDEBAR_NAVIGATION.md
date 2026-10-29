# Vehicle Management Sidebar Navigation

## Changes
- Moved the Vehicle Management page navigation into the sidebar.
- Added sidebar destinations for Overview, My vehicles, Maintenance, Service history, and Reminders.
- Removed the duplicate in-page tab strip so navigation is not shown twice.
- The active sidebar item selects the corresponding Vehicle Management view and keeps the existing view content and data handlers.
- Kept the module under the existing `vehicle_management` feature permission.

## Notes
- No database schema or migration changes are required for this navigation update.
- The build was not run as part of this edit; install project dependencies and test all five sidebar destinations in the app.
