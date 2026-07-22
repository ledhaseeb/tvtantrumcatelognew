---
name: Admin auth systems
description: Two separate admin login systems exist — only one is actually used by the login page
---

The admin login page (`/admin/login`) calls `/api/admin/login` (in `simple-admin.ts`).
This checks bcrypt against the `users` table (`is_admin = true`), using `DATABASE_URL` pool.
Current admin account: `hello@tvtantrum.com` (id=2, created July 2026).

A second endpoint `/api/auth/admin-login` (in `catalog-routes.ts`) uses `process.env.ADMIN_PASSWORD || 'admin123'` — but the login page does NOT call this endpoint.

Login also accepts `process.env.ADMIN_PASSWORD` as a plaintext override (added July 2026 to simple-admin.ts line ~82).

**Production database:** Neon (`NEON_DATABASE_URL`). The Replit dev database and Neon are separate. Changes to dev DB do NOT affect production. To update production users, connect via `psql "$NEON_DATABASE_URL"` directly.

**Deployment:** App deploys via Render from GitHub. Replit Secrets/Configurations are NOT available on Render — only Render's own env vars apply to production.

**Why:** The app has legacy auth code from an earlier iteration that was never removed.

**How to change admin password:** Generate a bcrypt hash (`bcrypt.hash(pwd, 12)`) and run `psql "$NEON_DATABASE_URL" -c "UPDATE users SET password = '...' WHERE email = 'hello@tvtantrum.com';"`.
