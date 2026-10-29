# Pocket Fuel Log, Payment Account, and Sidebar Refinements

## Changes
- Added a required Payment account / wallet selector to Add Fuel Entry, populated from the user's Pocket accounts in Supabase.
- Fuel expenses are saved as transactions linked to the selected `account_id`; the account name is also written to `payment_method`.
- Added `Gas` to Fuel Type and removed `Other`.
- Added Edit and Delete actions to each Fuel Log record. Editing updates the fuel record and its linked expense transaction; deleting removes the linked expense transaction and fuel record.
- Retained Supabase as the data source for fuel records, transactions, and saved fuel price settings.
- Applied the same nested sidebar item styling to Administration and Analyze dropdown entries as the My Space / Vehicle Management submenu.
- Updated the Notes textarea to use theme-aware Pocket surface, text, border, and focus colors in dark mode.

## Notes
- Fuel payment requires an existing account or wallet, excluding the system Goals account.
- The account selector uses the existing `accounts` data and does not create a separate payment-method list.
- Fuel log edit/delete behavior requires the existing vehicle fuel log migration and its RLS policies to be applied in Supabase.
