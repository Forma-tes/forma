# Pocket Access Management redesign

- Combined the separate User access and Access requests sidebar entries into Access management.
- Requests and Users now share one workspace with tabs.
- Request review uses a split review panel with user details and the 10 features shown before approval.
- Approval uses the existing `admin_update_access_request` RPC contract and grants all 10 feature keys in the database transaction.
- Added `supabase/migrations/20261023_access_management_workspace.sql`. Existing `supabase/schema.sql` and existing migrations are preserved unchanged.

## Apply
Run only the new migration if the previous migrations are already applied. If not, apply the existing migrations in their normal order and then this one. Test on staging first.
