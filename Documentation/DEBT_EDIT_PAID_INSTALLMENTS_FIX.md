# Debt Edit — Preserve Installment Progress

- Editing an existing debt now preserves its saved `paid_installments` value instead of recalculating it from dates on every save.
- Editing an existing debt no longer advances its already-current `due_date` by the paid-installment count again.
- Automatic previous-installment counting remains limited to newly created debts. Existing payment history and account balances are not changed by this fix.
