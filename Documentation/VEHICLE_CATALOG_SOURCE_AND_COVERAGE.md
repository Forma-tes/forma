# Vehicle Catalog: sources, coverage, and limitations

## Current implementation

The Add Vehicle wizard seeds the signed-in user's `vehicle_makes` and `vehicle_models` tables from `VEHICLE_CATALOG` in `src/main.jsx` using upserts with `ignoreDuplicates: true`. Existing user-added makes and models are retained; this change does not delete or overwrite them.

The catalog now includes additional commercial truck and bus manufacturers/models relevant to fleets in Egypt and GCC markets, alongside the existing passenger vehicle catalog. These commercial additions are discovery options, not a verified complete list of trims or model-year variants.

## External reference source

- NHTSA vPIC API: https://vpic.nhtsa.dot.gov/api/
- vPIC overview and scope: https://vpic.nhtsa.dot.gov/About
- NHTSA dataset documentation: https://www.nhtsa.gov/nhtsa-datasets-and-apis

NHTSA vPIC is manufacturer-reported data and includes cars, trucks, buses, trailers, incomplete vehicles and motorcycles. However, it is designed primarily for vehicles intended for sale or import into the United States and is generally intended for model years 1981 onward. Its own documentation warns that vehicles not intended for the US market may have limited results. Therefore, it cannot alone establish a complete Egypt/UAE/GCC historical catalog.

## Important data-quality boundary

- This is an expanded catalog, not a claim that every make/model ever sold in Egypt or GCC is present.
- Model-year start/end ranges are not inferred or fabricated. The current `vehicle_models` schema stores names only, so exact model-year history needs a separately sourced year-variant dataset and schema extension.
- Commercial model naming can vary by country, body configuration, chassis, and fleet importer. Confirm local-market availability and model years against OEM/importer catalogs before presenting entries as authoritative.
- This update only adds options to the seed catalog. Existing Supabase records are preserved through insert-if-missing behavior.

## Recommended production path

Maintain a canonical global catalog with source attribution and fields for make, model, vehicle type, market, year start, year end, source URL, and verification date. Import manufacturer-reported vPIC records for standardized broad coverage, then enrich and validate Egypt/GCC entries against official regional OEM/importer catalogs. Keep user-created entries separate from canonical records and never delete user data during catalog refreshes.
