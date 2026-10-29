# Credit cards & installment apps as accounts

**Run first:** `supabase/migrations/20261027_credit_card_and_installment_accounts.sql` in the Supabase SQL editor.

## Model
- A credit card is a `financial_accounts` row (type `Credit card`) with `credit_limit`, `statement_day`, `grace_days`, `pay_from_account_id`. Owed = -balance; available = limit - owed.
- An installment app (Valu, Aman, Halan...) is an account of type `Installment app` with a limit. Plans (`debts`) link to it through `provider_account_id`; the plan total counts against the limit.
- Purchases on a card are normal expenses. A statement/due date is derived: purchase on/before the statement day goes on this month's statement, otherwise next month's. Due = statement + grace days.
- Paying a card is a Transfer from a bank/cash account (no double counting), applied to the oldest due date first.
- Paying an installment-app due date records one installment per plan (existing debt flow).

## Where things are
- Add/manage: Debts & installments (Credit cards, Installment apps, Loans & other debts).
- Accounts page: Grid/List toggle (saved in user settings); cards & apps appear as read-only shortcuts below your money accounts.
- Overview: balance excludes cards/apps; strip shows owed + next payment. Calendar shows card and installment due dates.
- Legacy per-purchase "Credit card" debts stay in Loans & other debts (not auto-converted).
