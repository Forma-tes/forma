# Debt edit installment recalculation fix

When editing an existing debt, Pocket now preserves the recorded paid-installment count if the repayment schedule is unchanged. If the user changes the first installment due date, duration, or next due date, the paid-installment count is recalculated from the updated schedule instead of always reusing the old saved count. This keeps ordinary edits stable while allowing intentional schedule edits to update installments paid/remaining.

No database schema changes or historical transactions are created by this fix.
