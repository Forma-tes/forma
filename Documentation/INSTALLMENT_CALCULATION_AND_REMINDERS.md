# Installment Calculation and Reminders

- For `Installment`, Interest / fees is now calculated as `monthly installment × duration − (item price − down payment)` and is read-only in the form.
- The calculated value is saved in the existing debt record's `fees` field. The existing database schema is unchanged.
- Choosing `Other` under Installment duration reveals a numeric custom duration field (1–600 months).
- Debt notification items now read the reminder preference stored in the existing `[POCKET_DEBT_DETAILS]` metadata within `debts.notes` and become eligible at the selected lead time: on due date, 1 day before, 2 days before, or 1 week before. Overdue debts with a remaining balance remain visible.
- The notification icon uses the app's existing debt notification list; no separate browser storage was introduced.
- JSX syntax was checked with the TypeScript JSX parser. A full Vite build and end-to-end Supabase notification test were not run in this environment.
