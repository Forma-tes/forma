# Pocket Vehicle Catalog — Regional scope and source provenance

## Scope requested
- Markets: Egypt, UAE, Saudi Arabia, Kuwait, Qatar, Bahrain, Oman, and broader GCC where evidence applies.
- Vehicle categories: passenger cars, SUVs, pickups, vans, EVs, and hybrids.
- Years: historic, discontinued, and current models, only when supported by a source.

## Current catalog status
`VEHICLE_CATALOG` in `src/main.jsx` is a broad manually curated starter list. It is useful for coverage but it is **not a complete, independently verified, year-by-year regional catalog**. A model appearing in the starter list does not prove it was sold in each listed market or in a particular year. Do not describe it as exhaustive.

## Source research and limitations
1. NHTSA vPIC official API: https://vpic.nhtsa.dot.gov/api/
   - It is based on manufacturer submissions to the US regulator and is intended primarily for vehicles intended for sale or import into the United States. The official site explicitly warns that non-US-market vehicles may have limited data.
   - Useful as a supplemental reference for global makes/models and certain year/type queries, but not sufficient to validate Egypt/GCC availability.
2. Official manufacturer regional websites and authorized distributor archives should be the primary evidence for regional availability. A current model page only verifies current offering, not all historic years.
3. For discontinued/historic years, use archived manufacturer brochures, official regional distributor catalogs, homologation/registration records where public, and clearly attributable historical catalogues. Preserve source URL and market per verified model-year.

## Supabase provenance storage
Migration `20261024_vehicle_model_years_provenance.sql` adds `vehicle_model_years` with market, year, body/vehicle type, source URL, verification status, and timestamp. It is additive and does not delete or overwrite existing makes, models, vehicles, or user-entered data. Apply it to a staging Supabase project first.

The import template is `supabase/catalog/vehicle_model_years_import_template.csv`. Use `verified` only when a source explicitly supports the exact model-year-market combination. Use `candidate` for a plausible but not yet validated row and `unverified` where evidence is absent. Do not infer all years between a model's launch and discontinuation unless a source supports that range.

## Known gap / honest status
This deliverable adds the data structure and import template for evidence-backed year coverage. It does not pretend that the current seed list has been validated for every year and every GCC market. A full regional historical catalog requires collecting and reconciling source records market-by-market and model-by-model. The app's current Make/Model dropdown still uses the existing catalog seed plus each user's Supabase entries; the new provenance table is not yet wired into the UI as a year-filtered dropdown.
