# Supabase-only data and credit card form cleanup

- Removed the separate Statement & Payment Tracking section from the Credit Card debt form.
- Removed statement balance, minimum payment due, statement date, and separate payment due date from the form's state and saved debt details.
- Kept the First Installment Due field because it belongs to tracking the individual purchase installment plan.
- Financial records and user preferences use Supabase as the source of truth. Saving or deleting records now refuses to mutate application data when there is no configured Supabase connection and authenticated session.
- When Supabase environment variables are missing, Pocket shows its Supabase configuration screen rather than providing a local database fallback.
- No database schema or migration was added for this change.
