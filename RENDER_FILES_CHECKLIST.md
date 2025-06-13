# Files to Include for Render Deployment

## Core Application Files
- ✅ package.json (with clean scripts)
- ✅ package-lock.json
- ✅ server/ (entire directory)
- ✅ client/ (entire directory)
- ✅ shared/ (database schema)
- ✅ public/ (including custom-images)

## Render Configuration
- ✅ render.yaml
- ✅ RENDER_DEPLOYMENT_GUIDE.md

## Environment Template
- ✅ .env.example

## Optional Files
- tsconfig.json
- vite.config.ts
- tailwind.config.ts
- postcss.config.js
- components.json
- drizzle.config.ts

## DO NOT INCLUDE
- node_modules/
- .env (contains secrets)
- dist/
- downloads/
- .git/
- Procfile (Railway specific)
- server.js (Railway specific)
- start.js (Railway specific)
- Dockerfile (Railway specific)