Pocket Request Access Email — Brevo setup

This function now uses Brevo's transactional email API.

In Supabase Dashboard > Edge Functions > Secrets, set:
- ACCESS_REQUEST_ADMIN_EMAIL = mahmoudadel240@gmail.com
- BREVO_API_KEY = your Brevo API key (keep server-side only)
- ACCESS_REQUEST_FROM_EMAIL = a sender email registered and verified in your Brevo account

Do not keep RESEND_API_KEY for this function; it is no longer read by the code. You may remove that old secret after the new function is deployed and tested.

Deploy from the Supabase Dashboard:
1. Edge Functions > request-access > Edit function (or deploy via editor)
2. Replace the function source with index.ts from this folder.
3. Deploy.
4. Confirm the access_requests migration/table is already applied.
5. Sign in as a test user and press Request access. Check Edge Function Logs and Brevo transactional logs if delivery fails.

Important: Brevo requires the sender address to be registered/verified. Depending on account and mailbox-provider requirements, authenticating a domain may also be needed for reliable delivery. Do not use a domain you do not own.
