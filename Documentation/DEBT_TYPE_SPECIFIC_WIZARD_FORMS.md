# Debt Type-Specific Wizard Forms

- Reworked the debt wizard's Details step to show different fields for Credit Card, Installment, Other, Buy Now Pay Later, Personal Loan, and Bank Loan.
- Preserved the existing three-step Debt Type → Details → Review flow and account selection.
- Added date, seller/provider, payment mode, term, installment, fee and reminder fields where relevant.
- Type-specific supplemental fields are serialized into a `[POCKET_DEBT_DETAILS]` marker in the existing `debts.notes` column to avoid a schema migration. The regular note text remains before the marker.
- The existing `debts` schema remains unchanged. Before production, test each debt type, edit existing records, and record/delete installments in a staging Supabase project.
- Full Vite build was not run in this environment.

## Personal Loan Interest / Fees
- The Personal Loan form now calculates Interest / Fees automatically using monthly installment × duration − amount borrowed, matching the Installment form behavior. The field is read-only and recalculates as amount, duration, or installment changes.

## BNPL calculation update
- The Buy Now, Pay Later form now supports a custom number of payments when Other is selected.
- Interest / fees is calculated read-only as payment amount × number of payments − purchase amount and saved to the existing fees field.
