# Complete File List for Railway Deployment

## Essential Application Files:
- package.json
- package-lock.json
- tsconfig.json
- vite.config.ts
- tailwind.config.ts
- postcss.config.js
- components.json
- drizzle.config.ts

## Server Files:
- server/ (entire directory)
  - index.ts
  - vite.ts
  - db.ts
  - cache.ts
  - admin-auth.ts
  - admin-functions.ts
  - admin-routes.ts
  - catalog-routes.ts
  - catalog-storage.ts
  - simple-admin.ts
  - simple-upload.ts
  - replitAuth.ts

## Client Files:
- client/ (entire directory)
  - index.html
  - env.d.ts
  - src/ (all React components and pages)
  - public/ (if exists)

## Database Schema:
- shared/ (entire directory)
  - catalog-schema.ts

## Static Assets:
- public/ (entire directory including custom-images)

## Railway Deployment Files:
- railway.json
- .railwayignore
- Dockerfile
- .env.example
- RAILWAY_DEPLOYMENT.md

## Optional Development Files:
- migrations/ (database migrations)
- build.js
- generate-hash.ts
- optimize-all-images.ts

## DO NOT INCLUDE:
- node_modules/
- .env (contains secrets)
- dist/
- downloads/
- .git/
- attached_assets/