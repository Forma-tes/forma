# Forma — Personal Finance System

Responsive personal-finance web app with Supabase authentication and per-user cloud storage.

## Features
- Email + password **Create Account** and **Sign In**
- Email confirmation flow (if enabled in Supabase), password reset, and sign out
- Per-user cloud data: transactions, budgets, savings goals, and recurring payments
- Dashboard, charts, category spending, monthly/yearly reports, Needs vs Wants
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
   ```
4. Open **SQL Editor** in Supabase and run the complete contents of `supabase/schema.sql`.
5. Under **Authentication → URL Configuration**, set your local Site URL to `http://localhost:5173` while testing. Add your deployed app's URL to **Redirect URLs** after deployment.
6. Under **Authentication → Providers → Email**, decide whether to require email confirmation. If enabled, new users must confirm their email before signing in.

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
