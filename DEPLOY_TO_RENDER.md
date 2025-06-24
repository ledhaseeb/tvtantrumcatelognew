# Deploy TV Tantrum to Render

## Files to Add to Repository

### Essential Core Files:
```
package.json
package-lock.json
```

### Application Code:
```
server/
client/
shared/
```

### Configuration Files:
```
render.yaml
drizzle.config.ts
components.json
postcss.config.js
tailwind.config.ts
tsconfig.json
vite.config.ts
```

### Static Assets:
```
client/public/images/tv-shows/
client/public/images/optimized/
client/index.html
```

## Git Commands for Deployment

```bash
# Initialize git repository (if not already done)
git init

# Add all necessary files
git add package.json package-lock.json
git add server/ client/ shared/
git add render.yaml drizzle.config.ts components.json
git add postcss.config.js tailwind.config.ts tsconfig.json vite.config.ts
git add client/public/images/

# Commit changes
git commit -m "Deploy TV Tantrum with image optimization fixes"

# Add your Render repository as remote
git remote add origin [YOUR_RENDER_GIT_URL]

# Push to deploy
git push origin main
```

## Environment Variables to Set in Render Dashboard:
- `DATABASE_URL` (your PostgreSQL connection string)
- `NODE_ENV=production`
- `PORT=10000`

## Post-Deployment:
1. Run database migration: `npm run db:push`
2. Verify health check at: `https://your-app.onrender.com/api/health`