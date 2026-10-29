# Debt Payment Button and Notes Display Fix

- Enabled `Record installment paid` for debt records without a linked account. The user can choose the no-transaction option; the transaction option still requires selecting a valid account.
- The debt edit form now parses supplemental `[POCKET_DEBT_DETAILS]` metadata from existing notes into the corresponding type-specific fields.
- The internal metadata marker is stripped from the human-readable Notes field so it is not shown as raw JSON when editing and saving a debt. The metadata continues to be stored in Supabase notes for backward compatibility; no migration or data deletion is performed.
- Existing debts and stored data are preserved.
