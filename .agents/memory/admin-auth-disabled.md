---
name: Admin auth disabled
description: Project-wide no-op admin auth pattern and its risk
---
All admin endpoints (`/api/admin/*` in server/index.ts, server/admin-auth.ts, server/catalog-routes.ts) use a `requireAdmin` middleware that just logs "Authentication disabled for development" and calls next(). The admin dashboard frontend also mocks `/api/admin/me`.
**Why:** pre-existing deliberate dev convenience; real session-based auth code exists commented out in server/admin-auth.ts.
**How to apply:** when adding admin routes, follow the existing `requireAdmin` pattern for consistency, but flag to the user that admin endpoints are publicly writable until auth is re-enabled (uncomment the session check in admin-auth.ts and the local requireAdmin in server/index.ts) before any production deploy.
