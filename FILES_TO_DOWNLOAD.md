# Files to Download for Session Persistence Fix

## Critical Files (Required)
1. `server/index.ts` - PostgreSQL session storage implementation
2. `server/simple-admin.ts` - Enhanced admin authentication with debugging
3. `package.json` - Updated dependencies including connect-pg-simple
4. `package-lock.json` - Synchronized lockfile for deployment

## Instructions
1. Download these 4 files from Replit
2. Replace the corresponding files in your GitHub repository
3. Commit and push to trigger Render deployment
4. Verify admin login works on deployed site

## What This Fixes
- 401 authentication errors on deployed site
- Session persistence across server restarts
- Enhanced debugging for production troubleshooting

## Environment Variables Required
- `DATABASE_URL` (already set)
- `SESSION_SECRET` (set to any secure random string)
- `NODE_ENV=production` (enables PostgreSQL sessions)