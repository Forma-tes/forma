# Previous Installments / Opening Paid Progress

When adding or editing a debt, the form estimates how many installments have fallen due based on the first installment due date and the payment term. The user can enter the number of installments actually paid. Leaving the field blank uses the due-date estimate; entering `0` explicitly records no installments paid.

The selected paid count drives paid installments, amount paid so far, remaining amount, progress, and next due date. This is an opening balance/progress adjustment only: it does not create historical expense transactions or change account balances. Future installments continue to use the normal Record Installment Paid flow.

No schema or migration changes are required; values use the existing `paid_installments`, `amount_paid`, `remaining_amount`, and `due_date` fields.
