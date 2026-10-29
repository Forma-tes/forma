# Add Vehicle Wizard

- Reworked Add Vehicle to follow Pocket's existing multi-step wizard patterns and shared modal/step/action styles.
- Step 1 captures vehicle name, make, model, year and optional plate. Step 2 captures current odometer and unit and shows a review summary.
- Make and model are dependent dropdowns. Selecting a different make clears the selected model.
- The built-in starter catalog includes common manufacturers and models across mainstream, luxury, Chinese, Japanese, Korean, American and European makes. It is a useful starter list, not an exhaustive or authoritative global vehicle database.
- `+ Add make` and `+ Add model` open Pocket-styled in-app modals. A model is added under the currently selected make.
- Custom makes and models are saved to Supabase and loaded from the user's cloud data.
- Vehicle storage still uses the existing `vehicles` table and `saveVehicle` handler. No schema or migration changes were made for the catalog.
