---
name: Admin auth systems
description: Two separate admin login systems exist — only one is actually used by the login page
---

The admin login page (`/admin/login`) calls `/api/admin/login` (in `simple-admin.ts`).
This checks bcrypt against the `users` table (`is_admin = true`).
Admin account: `admin@tvtantrum.com` (id=1).

A second endpoint `/api/auth/admin-login` (in `catalog-routes.ts`) uses `process.env.ADMIN_PASSWORD || 'admin123'` — but the login page does NOT call this endpoint. Setting the `ADMIN_PASSWORD` secret has no effect on login.

**Why:** The app has legacy auth code from an earlier iteration that was never removed.

**How to change admin password:** Generate a bcrypt hash (`bcrypt.hash(pwd, 12)`) and run `UPDATE users SET password = $1 WHERE is_admin = true`.
