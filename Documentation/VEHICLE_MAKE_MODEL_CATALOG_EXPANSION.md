# Vehicle Make & Model Catalog Expansion

## What changed
- Reviewed the existing `VEHICLE_CATALOG` in `src/main.jsx` and expanded it with additional common makes and models, prioritizing Egypt/Middle East availability while including widely used international brands.
- Expanded existing entries (including Toyota, Nissan, Hyundai, Kia, Chevrolet, Ford, Renault, Chinese brands, and luxury/EV brands) and added further manufacturers such as Chrysler, Lincoln, Acura, Alfa Romeo, Jaguar, Maserati, Ferrari, Lamborghini, Bentley, Rolls-Royce, Aston Martin, Mini, RAM, Rivian, Lucid, Polestar, XPeng, NIO, Zeekr, Leapmotor, Li Auto, BAIC, JAC, Dongfeng, FAW, Foton, Mahindra, Tata, Maruti Suzuki, and VinFast.
- Kept the `Other` make with `Other / not listed` model so users can still record vehicles missing from the catalog.
- Updated `loadCatalog()` so each signed-in user's Supabase catalog is additively synced with newly added built-in makes and models on load. Existing custom makes/models are preserved; no existing rows are deleted.

## Data behavior
- Catalog records remain in `vehicle_makes` and `vehicle_models` in Supabase, scoped to the signed-in user and protected by the existing RLS policies.
- Uses upsert with `ignoreDuplicates` for safe additive seeding; no schema migration is required because the existing tables and unique constraints support this.

## Validation note
The catalog/source changes were reviewed and the ZIP was packaged. A full Vite production build and live Supabase integration test were not run in this environment. Model availability varies by country and model year; users can add a missing make or model from the existing UI.
