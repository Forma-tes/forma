# Debt Payment Confirmation and Due-Date Estimate

- The `Record installment paid` action opens a single confirmation form for an Expense transaction.
- The form shows payment date, actual amount paid, payment account, and a live extra-fees calculation.
- Actual payment must cover at least the scheduled installment. Any amount above the scheduled installment is recorded as extra fees in the transaction notes; repayment progress advances by the scheduled installment only.
- When adding a debt, Pocket compares the first installment due date with today's local date and estimates how many installments have come due. It caps this estimate at the selected term and updates the next due date accordingly.
- This is an estimate based on the schedule, not proof that historic installments were actually paid. Review the prefilled paid-installment count before saving if earlier installments were missed.
- No schema migrations were added. Existing Supabase persistence is retained.
