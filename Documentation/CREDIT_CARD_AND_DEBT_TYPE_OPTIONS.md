# Debt type options and credit card calculation

- Removed `Other` from the Add Debt or Installment type selection. Existing records with that legacy type are not deleted. The BNPL provider's `Other` option remains available for an unlisted provider.
- Credit Card form fields currently include card name, payment account, amount spent, purchase date, what it was for, pay-in-full vs installments, duration, monthly installment, and first installment due date.
- For installment repayment, the intended total is monthly installment × duration. Estimated interest/fees = total scheduled repayments − amount spent (or outstanding balance being financed). For pay-in-full, fees are zero unless the user enters explicit fees. Credit-card statement balance, minimum due, statement date, and payment due date would be useful additional fields if the flow is intended to track a full revolving credit-card statement rather than a single purchase.
- No database schema changes in this update. Test the wizard and existing legacy debt records before deployment.
