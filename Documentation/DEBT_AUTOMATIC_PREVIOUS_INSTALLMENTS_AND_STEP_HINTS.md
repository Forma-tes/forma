# Automatic Previous Installments and Step Hints

- Removed the editable `Installments already paid` field from the Add Debt wizard.
- On new debt creation, Pocket automatically counts installments from the first installment due date through the current date and treats those installments as paid progress.
- This opening progress does not create historical expense transactions and does not deduct money from accounts.
- Editing an existing debt preserves its recorded paid-installment count rather than recalculating it from dates.
- Modal step validation now identifies the first missing required field by label and scrolls it into view before allowing the wizard to continue.

No schema or migration changes were made.
