# Installment Provider Options

Updated the Add/Edit Debt or Installment wizard to offer an app/provider selector for the `Installment` and `Buy now, pay later` debt types. Options include Valu, Aman, Souhoola, Contact Now, Sympl, Halan, Forsa, Shahry, Premium Card, and Other. Choosing Other reveals a required provider-name field.

The selected provider is stored in the existing `debts.lender` field, so this change does not require a database migration. Existing non-installment debt types continue to use the Bank / lender text field. The review screen displays the resolved provider/lender.

These options are editable UI suggestions, not an assertion that every provider supports every merchant or product. Confirm provider availability and naming against current local offerings before release.
