---
name: Admin auth
description: Admin auth model and where the checks live
---
Admin auth is session-based and ENFORCED (re-enabled July 2026). The canonical middleware is `requireAdmin` in `server/simple-admin.ts` (checks `req.session.adminUser`, 401 otherwise). It protects: server/index.ts product+banner routes, all of server/admin-routes.ts (`router.use(requireAdmin)`), and the session checks in server/admin-auth.ts and server/catalog-routes.ts were also enabled.
**Why:** admin endpoints were previously publicly writable via no-op "disabled for development" stubs.
**How to apply:** any new `/api/admin/*` route must use `requireAdmin` from `./simple-admin`. Login: POST /api/admin/login (admin@tvtantrum.com in users table); admin login page at /tvtantrum-admin-secure-access-2024; dashboard queries must use `credentials: 'include'` and expect 401 redirects to /admin/login.
