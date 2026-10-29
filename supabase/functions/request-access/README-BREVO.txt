Access Requests (Supabase-only)

This function stores access requests in public.access_requests. It does not send email and does not require Brevo, SMTP, a sender address, or external email secrets.

Deploy with:
  supabase functions deploy request-access

Apply the migration supabase/migrations/20261020_access_requests_admin_dashboard.sql in the Supabase SQL Editor before using the Administrative > Access requests dashboard.
