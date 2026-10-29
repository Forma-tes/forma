# Required-field hints for modal steps

- Added shared validation feedback to `ModalShell`-based popup flows.
- When a user presses Continue, Next, or Review, required inputs in the current wizard step are checked before the click can advance the flow.
- If a required field is missing, an inline hint appears and focus moves to the first missing field.
- Successful validation clears the hint.
- This is a client-side usability guard only; save-time validation and Supabase constraints remain necessary.
- Modals that do not use `ModalShell`, or Continue buttons already disabled by their own validation logic, may need their own inline hint integration to meet the same behavior.
