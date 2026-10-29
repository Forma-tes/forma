# Debt installment payment options

The `Record installment paid` action is available for every debt record rendered by the Debts & installments page, regardless of debt type. It opens two choices:

1. **Pay due installment** — records an Expense transaction for the actual amount paid, deducts that amount from the selected account through the transaction ledger, and records amounts above the scheduled installment as extra fees in transaction notes. The debt's scheduled repayment progress advances by one installment amount.
2. **Record installment without transaction** — updates installment count, amount paid, remaining amount, and next due date without creating an Expense transaction or changing account balance.

The installment's scheduled amount is used to update debt repayment progress, while the actual amount entered is used for the Expense transaction. This avoids treating extra fees as additional principal repayment. All writes use the existing Supabase save helpers; no schema migration is added.

Future debt types rendered through the shared debts list automatically use the same payment choice flow.
