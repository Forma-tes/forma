# Access Management UI Update

- Access management now has two separate sidebar destinations: **Requests** (`Access requests`) and **Users** (`Admin access`) nested under the Access management heading.
- The sidebar shows only the live pending-request count next to Requests. The count is refreshed from the existing `admin_list_access_requests` RPC and after request updates.
- Removed the in-page Requests/Users tabs from each destination; each page has its own heading and content.
- Refined the Request Inbox toolbar layout, search sizing, native select dark-mode colors, and empty state so the card no longer looks oversized when there are no matching requests.
- Existing RPC names, approval/deny/reopen handlers, permissions, schema.sql, and migration files were not changed.

Build status: not run successfully in this environment because dependencies are not installed (`vite: not found`). Run `npm install` then `npm run build` before deploying.
