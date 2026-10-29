# Debt first-installment date count fix

The debt wizard calculates opening paid-installment progress from the first installment due date and the current date. `saveDebt` must preserve that submitted count rather than recalculating it from the purchase/start date and first due date. The previous second calculation incorrectly counted the month between purchase and the first future installment as already paid.

For example, a purchase date of 2026-10-01, first installment due date of 2026-11-03, and a 12-month term should begin with 0 installments paid and 12 remaining on 2026-10-24. No historical transactions or account deductions are created.
