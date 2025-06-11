# TV Tantrum Railway Deployment Guide

## Quick Migration Steps

### 1. Create Railway Account
- Visit [railway.app](https://railway.app)
- Sign up with GitHub account
- Connect your TV Tantrum repository

### 2. Deploy to Railway
```bash
# Option A: GitHub Integration (Recommended)
1. Create new project from GitHub repo
2. Railway auto-detects Node.js app
3. Builds using package.json scripts

# Option B: Railway CLI
npm install -g @railway/cli
railway login
railway init
railway up
```

### 3. Add PostgreSQL Database
- In Railway dashboard: "Add Service" → "Database" → "PostgreSQL"
- Copy the provided DATABASE_URL
- Database will be ready in ~30 seconds

### 4. Set Environment Variables
```
DATABASE_URL=<from Railway PostgreSQL service>
SESSION_SECRET=<generate 32+ character secret>
NODE_ENV=production
VITE_GA_MEASUREMENT_ID=G-YOUR-GA-ID
VITE_GOOGLE_ADSENSE_ID=ca-pub-1980242774753631
```

### 5. Import Your Data
```sql
-- Connect to Railway database and run:
-- 1. Apply schema migrations
npm run db:push

-- 2. Import your 302 TV shows (use Railway database console)
-- Copy data from your current Replit database
```

### 6. Configure Custom Domain
- In Railway project settings → "Domains"
- Add tvtantrum.com
- Update DNS records as shown
- SSL certificate auto-generates

### 7. Verify Deployment
- [ ] All 302 shows load correctly
- [ ] Admin panel accessible at /tvtantrum-admin-secure-access-2024
- [ ] Performance monitoring at /api/performance-stats
- [ ] AdSense starts serving ads on custom domain

## Migration Benefits
✅ Custom domain AdSense integration
✅ Professional hosting infrastructure  
✅ Zero-downtime deployments
✅ Automatic scaling for viral traffic
✅ $15-25/month cost vs Replit limitations

## Post-Migration
Your tvtantrum.com will be production-ready with:
- Full AdSense functionality
- Optimized performance for 2,000+ concurrent users
- Professional deployment pipeline
- Ready for your 5,000-person email list launch

**Estimated Time: 2-3 hours total**
**Downtime: Zero (when using staging environment)**