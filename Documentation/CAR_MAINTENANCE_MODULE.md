# Pocket Vehicle Management / Car Maintenance

## Included
- Sidebar module gated by the new `vehicle_management` feature permission.
- Multiple vehicle profiles with manual odometer entry.
- Maintenance plans based on mileage and/or calendar intervals.
- Service and repair history with optional transaction linking.
- Option to create an expense transaction from a service record, so it contributes to Pocket's general expenses and can be reported separately in Vehicle Management.
- In-app reminder view based on due dates and odometer readings.
- Custom in-app delete confirmation for vehicles; no browser-native `confirm()` is used for this delete flow.
- Dark-mode styling for module forms and native select dropdowns.

## Database
Apply `supabase/migrations/20261023_car_maintenance_tracking.sql` to the existing Supabase project after reviewing it. It is additive and does not edit `supabase/schema.sql`. It creates `vehicles`, `maintenance_plans`, and `vehicle_service_records`, with RLS policies and ownership validation for child records and linked transactions. It also extends the admin feature allow-list and access-request approval grant to include `vehicle_management`.

The migration does not disable or modify the protected Goals account trigger. It does not alter `financial_accounts` or delete existing transactions. A service record can be saved without a financial transaction, linked to an existing expense, or create a new expense transaction.

## Validation notes
- JSX syntax was parsed successfully using the installed TypeScript parser.
- A full Vite build could not be run in this environment because project dependencies are not installed and the package registry was unavailable in offline mode.
- Test the migration in a staging Supabase project before production. Verify the `vehicle_management` permission in Admin > Users, RLS isolation between users, add/edit/delete vehicle flows, reminder calculations, and transaction creation/linking.
