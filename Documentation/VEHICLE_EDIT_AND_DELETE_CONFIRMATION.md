# Vehicle Editing & Delete Confirmation

## Vehicle editing
- Added an Edit action to each vehicle card.
- The edit wizard opens with the selected vehicle's saved name, make, model, year, plate number, odometer, and odometer unit prefilled.
- The same Pocket-style two-step wizard is reused for editing and adding vehicles.
- Saving edits updates the selected `vehicles` row scoped to the signed-in user's ID; it does not create a duplicate vehicle.
- The existing maintenance plans and service records are not changed by editing vehicle details.

## Delete confirmation
- The vehicle delete confirmation now uses Pocket's shared `category-wizard-card` / `category-delete-confirm` modal styling.
- It identifies the selected vehicle, explains that its maintenance plans and service history are affected, and provides Cancel and Delete actions.
- The destructive action shows a loading state while the delete request is in progress.

## Validation notes
- ZIP archive integrity checked after packaging.
- A full application build was not run in this environment; install project dependencies and test Add, Edit, and Delete against the target Supabase project before deployment.
