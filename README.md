# Pocket — Personal Finance System

Responsive personal-finance web app with Supabase authentication and per-user cloud storage.

## Features
- Email + password **Create Account** and **Sign In**
- Email confirmation flow, resend confirmation, password reset email, secure set-new-password screen, and sign out
- Per-user cloud data: transactions, budgets, savings goals, recurring payments, accounts/wallets, and debts/installments
- Dashboard, charts, category spending, monthly/yearly reports, Needs vs Wants
- Smart insights and a month-end expense estimate based on the current daily average
- Cash-flow calendar for recorded transactions and next recurring due dates
- Subscription and recurring-bill tracker with manual paid confirmation and duplicate-cycle protection
- Multiple accounts and wallets with opening balances and linked transaction activity
- Debt and installment tracking with remaining balance and next due date
- Budget-limit warnings at 80% and 100% of category limits
- Savings-goal milestones and monthly target guidance
- Multi-sheet yearly report export (monthly summary, categories, transactions)
- Add/edit/delete transactions and manage budgets, goals, and recurring payments
- Excel import and Excel export
- Row Level Security (RLS) policies on user data
- Local demo mode when Supabase credentials are not configured

## 1. Connect your existing Supabase project
1. In Supabase, open your project and go to **Project Settings → API** (or **API Keys**, depending on dashboard layout).
2. Copy the **Project URL** and the **publishable key** (or legacy `anon` public key). Never use a `service_role` or secret key in a browser app.
3. In this project folder, duplicate `.env.example` as `.env` and fill:
   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_OR_ANON_KEY
VITE_SITE_URL=https://YOUR_PRODUCTION_POCKET_DOMAIN
   ```
4. Open **SQL Editor** in Supabase and run the complete contents of `supabase/schema.sql`.
5. In Vercel, set `VITE_SITE_URL` to the exact canonical HTTPS URL of the deployed Pocket app (the domain users actually open). Redeploy after changing it.
6. In Supabase **Authentication → URL Configuration**, set **Site URL** to that same production URL, without a wildcard, for example `https://your-pocket-domain.vercel.app`. Add these under **Redirect URLs**: `https://your-pocket-domain.vercel.app/**` and `http://localhost:5173/**` for local testing. Replace the example domain with your real Pocket domain.
7. Under **Authentication → Sign In / Providers → Email**, enable **Confirm email**.
8. Configure a custom SMTP provider for reliable delivery; the default Supabase mailer is heavily restricted and is not intended for production. See `supabase/email-setup.md` for exact settings and template content.

## 2. Run the app locally
Requires Node.js 20+.
```bash
npm install
npm run dev
```
Open the local URL printed by Vite, usually `http://localhost:5173`.

## 3. Deploy it
Deploy to Vercel or Netlify as a Vite app:
- Build command: `npm run build`
- Output directory: `dist`
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in the hosting dashboard.
- In Supabase Auth URL Configuration, add the deployed HTTPS URL to allowed redirect URLs and set the production Site URL.
- Redeploy after adding environment variables.

## Data and security
- Each account reads and writes only rows whose `user_id` matches its authenticated Supabase user ID. RLS enforces this at the database level.
- Use only the Supabase publishable/anon key in browser code. Never put a service-role or secret key in `.env` or frontend code.
- Existing data in the standalone HTML file is saved in that browser's local storage and is **not automatically migrated**. Export it first and import the workbook after signing in if needed.
- This source package is not yet connected to your project or deployed because your project URL/key and hosting access remain private to you. Follow the steps above to connect it.

## New profile, analytics, and backup features
- Profile settings let signed-in users update their display name, preferred currency, and greeting time zone. These preferences are stored in Supabase Auth user metadata; local demo mode stores them in the browser.
- Reports now include average daily expenses, average monthly expenses, and an expense transaction count for the selected year. The year selector is generated dynamically.
- Recurring payments can be marked paid to create a linked expense transaction and advance the next due date. This uses the `mark_recurring_payment_paid` database function so the two database changes happen together.
- `Auto-pay` is a tracking label only. The app does not initiate bank transfers or charge payment methods.
- Settings supports a full JSON backup of transactions, budgets, savings goals, recurring payments, and profile preferences, plus JSON restore. Treat backups as sensitive financial records and store them privately.

## Apply the database update
After updating the source code, run the updated `supabase/schema.sql` in the Supabase SQL Editor. It adds `last_paid_date` and the `mark_recurring_payment_paid` function. Do this before testing the recurring-payment Mark paid action. The function is scoped to `auth.uid()` and runs under the caller's RLS permissions.

## Validation note
The JSX source was transpiled with the installed TypeScript JSX parser and had no syntax diagnostics. A full Vite production build could not be run in this environment because dependency installation did not complete; run `npm install` and `npm run build` locally before deploying.


## Additional finance features
- Run the updated `supabase/schema.sql` in your existing Supabase project before using cloud accounts/wallets or debts. It adds `financial_accounts`, `debts`, and the optional `transactions.account_id` link, with row-level security policies for each new table.
- Account balances are calculated from the account's opening balance plus linked income minus linked expenses. Existing transactions are not automatically assigned to an account; edit a transaction to link it. Unlinked transactions do not affect any account balance.
- Cash-flow calendar shows recorded transaction dates and each recurring item's next due date. It does not invent salary dates or future transactions.
- Insights and month-end forecasts are estimates derived from recorded data. Budget alerts are displayed when a category reaches 80% of its limit, and at 100% they are marked over limit.
- Subscription and recurring-payment automation is intentionally confirmation-based: clicking “Mark paid” records an expense and advances the due date once. “Auto-pay” is informational only; Pocket never initiates transfers or card charges.
- Debt records are manually maintained; Pocket does not connect to lenders or automatically verify outstanding balances.
- Older JSON backups without `accounts` or `debts` remain restorable. Exported backups and reports contain financial information; store them privately.

## Owner, super-admin, and feature access
- The owner account is reserved for `mahmoudadel240@gmail.com`. The SQL migration assigns that role to the existing Supabase Auth account if it already exists, or assigns it when that email registers later.
- Every other newly created account receives the `user` role and an empty `enabled_features` list by default. Users do not see feature pages until the owner or a super admin enables them.
- The owner can promote a user to `super_admin` or demote a super admin. Super admins can manage feature visibility but cannot change account roles. The owner account cannot be changed from the admin UI.
- Admin controls live in **Administration → User access**. Feature grants are stored in `public.profiles`, not local storage or user-editable auth metadata.
- Run the full updated `supabase/schema.sql` in Supabase SQL Editor before deploying this version. It adds role/feature columns, reserves the owner email, and creates restricted admin RPC functions. Then redeploy the Vite app.
- Admin role changes are enforced by database functions and column-level permissions. Financial data continues to use per-user RLS. Never expose a Supabase service-role key in the frontend.
- If `mahmoudadel240@gmail.com` has not registered in Supabase Auth yet, create the account through Pocket after applying the schema. Confirm the email if Supabase email confirmation is enabled, then sign in to access the owner console.


## Appearance, sidebar, and backup visibility updates

The Settings & profile modal now supports Light/Dark themes, four accent presets (Pocket Classic, Soft Lavender, Ocean Blue, Forest Green), Comfortable/Compact/Wide sidebar layouts, and a selectable emoji avatar. Appearance preferences are saved in the current browser. The selected avatar is also saved in the signed-in user's Supabase auth metadata when the profile is saved.

Backup & restore is hidden from regular users by default. The Owner or Super Admin can enable **Show Backup & restore to regular users** in Settings. This global preference is stored in `public.app_settings` and protected by RLS; regular users can read it but cannot change it. Run the updated `supabase/schema.sql` migration before deploying this feature.

## Email confirmation setup (production)
1. In Supabase Dashboard, open **Authentication → Sign In / Providers → Email** (the exact label may vary) and enable **Confirm email**.
2. Open **Authentication → URL Configuration**. Set **Site URL** to `https://forma-three-lovat.vercel.app`.
3. Add these allowed **Redirect URLs**:
   - `https://forma-three-lovat.vercel.app/**`
   - `http://localhost:5173/**` (for local development only)
4. Keep the default Supabase signup confirmation email template using the confirmation URL (commonly `{{ .ConfirmationURL }}`), unless you intentionally customize it. If customizing, make sure its link still points to Supabase's confirmation endpoint.
5. Deploy the latest source. New registrations should show a message telling the user to check email. If a user tries to sign in before confirming, Pocket shows a confirmation notice and a **Resend confirmation email** action.
6. Test with a new email address: register, open the email, click the confirmation link, and then sign in. Check Spam/Junk if it does not arrive. Supabase's default email service has sending limits; for production volume, configure custom SMTP in Supabase Auth settings.

The frontend can request a confirmation email and resend it, but it cannot enable **Confirm email** in your Supabase project settings; that must be enabled in the Supabase Dashboard. The confirmation redirect uses the current app origin, so it must be present in the project's allowed Redirect URLs.

## Latest navigation update

- Removed the redundant “My finances” workspace switcher from the sidebar.
- Removed the personal name/profile row from the sidebar; account details are now in the top-right account menu.
- Added an account menu with display name, email, role, Account & profile settings, and Sign out for authenticated users.
- Made the notification bell open a notification popover listing upcoming unpaid recurring payments, with an action to open Recurring payments.
- The notification bell displays a dot when upcoming recurring payments exist.

The account menu and notification popover use the existing authenticated session and recurring-payment records; they do not introduce mock notifications or new backend tables.


## Authentication email delivery troubleshooting

- Set `VITE_SITE_URL` in Vercel to the canonical deployed Pocket URL and redeploy. The app uses it for signup confirmation, resend confirmation, and password recovery redirects, avoiding accidental redirects to temporary Vercel preview domains.
- Set Supabase **Site URL** to that same production origin and allow the production URL wildcard plus `http://localhost:5173/**` for local testing. Redirect URLs must be on the allow list or Supabase can reject/fallback from the requested redirect.
- The app now listens for Supabase's `PASSWORD_RECOVERY` event and supports setting and confirming a new password after opening the reset link.
- Use the standard Supabase `{{ .ConfirmationURL }}` in both confirmation and recovery email templates unless you intentionally implement a custom token-verification route.
- A successful API response means Supabase accepted the send request, not necessarily that the email reached the inbox. Check Auth logs, spam, sender-domain verification, and SMTP provider logs.


## Pocket typography
- Brand and headings: Sora (Google Fonts), with Manrope fallback.
- Interface, forms, tables, and data: Manrope (Google Fonts), with Arial/sans-serif fallback.
- Wordmark: Pocket.


## Pocket Insights Dashboard refresh
- Refreshed dashboard visual system with structured cards, clearer data hierarchy, modern admin-style navigation, and blue insight accents.
- Appearance settings expose only Light/Dark theme selection; design preset and sidebar density controls are removed from the Settings UI.
- Typography remains Sora for brand/headings and Manrope for UI/data.


## Google sign-in setup
- The login and sign-up screens include **Continue with Google**, using Supabase OAuth (`signInWithOAuth`); existing email/password, email confirmation, and password reset flows remain available.
- In Supabase, open **Authentication → Sign In / Providers → Google**, enable Google, and add the Google OAuth Client ID and Client Secret from Google Cloud Console.
- In Google Cloud Console, configure the OAuth consent screen and add the Supabase project's callback URL shown in the Supabase Google provider settings (typically `https://<project-ref>.supabase.co/auth/v1/callback`) as an authorized redirect URI.
- In Supabase **Authentication → URL Configuration**, ensure the deployed Pocket URL is the Site URL and is included in Redirect URLs. The app sends `VITE_SITE_URL` (or the current origin) as the post-login redirect.
- Google sign-in will not complete until these provider settings are configured in Supabase; no client secret belongs in the frontend or `.env` file.


## Gender-personalized categories and transfers

- During email sign-up, users can choose Female, Male, or Prefer not to say. The choice is stored in Supabase Auth user metadata and only personalizes suggested categories; it does not restrict access to custom categories.
- Transaction types include Expense, Income, and Transfer. Transfers move an amount from one account/wallet to another and are excluded from income/expense totals.
- Before deploying the transfer feature to an existing Supabase project, run `supabase/migrations/20261018_gender_categories_and_transfers.sql` in Supabase SQL Editor. The main `supabase/schema.sql` also includes the updated schema for new setups.
- Google OAuth sign-ups may not have a gender choice during the Google consent flow; those accounts use the shared core categories until the user chooses a gender in a future profile update.


## Transaction subcategories
- The transaction form now shows a category and a dependent subcategory selector.
- Run `supabase/migrations/20261018_transaction_subcategories.sql` in Supabase SQL Editor before deploying so subcategories persist.
- `.env` is included as a local template; replace placeholders locally and do not commit it. Configure the same variables in Vercel Environment Variables.
