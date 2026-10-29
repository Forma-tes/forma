# Vehicle Management data refinement

- Vehicle-specific records now appear in their dedicated sidebar pages rather than repeating all records under Overview.
- Overview keeps the top-level vehicle metrics and empty/loading state.
- Maintenance plans, service history, reminders, and vehicle cards remain on their dedicated tabs.
- Log Service / Repair uses the Pocket wizard modal styling.
- Service type includes a wider set of common categories and `+ Add service type`.
- Custom service types are stored in Supabase in `vehicle_service_types`, scoped to the signed-in user with RLS.
- Sidebar order is My Space, Vehicle Management, Administration, Analyze.
- Apply `supabase/migrations/20261023_vehicle_service_types.sql` before using custom service types.

## Runtime fix: missing Layers import

Added the missing `Layers` named import from `lucide-react`, which caused a runtime `ReferenceError` in the sidebar section icon. No application logic changed.
