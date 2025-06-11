# Railway Deployment Guide

## Quick Deployment Steps

1. **Connect Repository to Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select this repository

2. **Set Environment Variables**
   Railway will automatically detect most settings, but you need to add:
   
   ```
   DATABASE_URL=your_postgresql_connection_string
   SESSION_SECRET=your_secure_random_string
   NODE_ENV=production
   ```

3. **Deploy**
   - Railway will automatically build and deploy using the `railway.json` configuration
   - The app will be available at your Railway-provided URL

## Database Setup

Your app connects to a PostgreSQL database. Options:

### Option 1: Railway PostgreSQL (Recommended)
- In Railway dashboard, click "New" → "Database" → "PostgreSQL"
- Railway will automatically set DATABASE_URL environment variable

### Option 2: External Database
- Use your existing PostgreSQL connection string
- Add it as DATABASE_URL environment variable

## Health Check

The app includes a health check endpoint at `/api/health` that Railway uses to verify deployment success.

## Troubleshooting

- Check Railway logs for any deployment issues
- Ensure DATABASE_URL is properly set
- Verify all environment variables are configured

## Current Status

✅ railway.json configured
✅ Health check endpoint ready
✅ Environment variables documented
✅ Database schema ready