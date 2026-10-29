# Pocket navigation, vehicle fuel, and overview refinements

## Navigation and vehicle pages
- Sidebar order remains My Space, Vehicle Management, Administration, Analyze. Vehicle Management contains My Vehicles, Maintenance, Service History, and Fuel Log. The duplicate vehicle Overview and dedicated Reminders page were removed from its navigation.
- Vehicle pages have page-specific titles, descriptions, and primary actions. The global Refresh and Add Vehicle buttons were removed from all vehicle pages. Add Vehicle appears on My Vehicles only; Add Plan appears on Maintenance; Log Service appears on Service History; Add Fuel Entry appears on Fuel Log.
- Vehicle metric cards and the repeated vehicle quick-actions overview were removed from vehicle subpages. A concise vehicle summary is now shown on the main Pocket Overview.
- Maintenance plan alerts are included in the existing system notification popover instead of a dedicated Reminders page.

## Fuel log
- Fuel Log records vehicle, date, odometer, liters, cost, station, full-tank flag, and notes in Supabase.
- Each successful fill-up updates the vehicle odometer to the greater of its previous reading and the new reading. This keeps maintenance mileage checks connected to the latest recorded distance.
- Fuel economy is estimated from the distance between fill-ups when a previous lower odometer entry exists. The estimate is displayed in liters per 100 odometer units and is approximate, especially for partial fills.
- Apply `supabase/migrations/20261024_vehicle_fuel_logs.sql` before using Fuel Log.

## Main Overview accounts card
- Added total account balance, account count, and up to four individual account balances. The calculations use opening balances, income/expense transactions, and transfers into/out of each account.

## Debts and request inbox
- Removed the three summary metric cards from Debts & Installments while retaining debt-level repayment details.
- Request inbox spacing, filters, and responsive toolbar were refined to use Pocket spacing and full-width controls on smaller screens.

## Compatibility notes
- No existing `schema.sql` was modified. Existing transaction, access, and permission logic was retained.

## Fuel consumption comparison by fuel type
- Fuel consumption is calculated only between consecutive odometer-ordered fuel entries for the same vehicle and same fuel type, when both entries are marked full tank and the odometer increases.
- The estimate uses the current fill's liters divided by the distance since the previous full-tank entry, expressed as liters per 100 odometer units.
- When a prior comparable interval exists, the log shows whether consumption improved or increased versus the preceding interval. Mixed fuel types, partial fills, missing intervals, or non-increasing odometer readings are not compared to avoid presenting misleading results.
