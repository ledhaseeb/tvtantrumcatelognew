# Render Deployment Guide

## Quick Setup Steps

### 1. Connect to Render
- Go to [render.com](https://render.com)
- Sign up/login with GitHub
- Click "New +" → "Web Service"
- Connect your GitHub repository

### 2. Configuration Settings
```
Name: tv-tantrum-catalog
Environment: Node
Build Command: npm install
Start Command: npx tsx server/index.ts
```

### 3. Environment Variables
Add these in Render dashboard:
```
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_secure_random_string_here
NODE_ENV=production
```

### 4. Advanced Settings
- Health Check Path: `/api/health`
- Auto-Deploy: Yes (deploys on git push)

## Database Options

### Option 1: Render PostgreSQL (Recommended)
- In Render dashboard: "New +" → "PostgreSQL"
- Copy the Internal Database URL to DATABASE_URL

### Option 2: External Database
- Use your existing PostgreSQL connection string
- Ensure the database is accessible from Render's servers

## Files Ready for Deployment
- `render.yaml` - Render service configuration
- `package.json` - Clean scripts without NODE_ENV issues
- `server/index.ts` - Production-ready server
- `public/custom-images/` - All TV show images
- Health check endpoint at `/api/health`

## Expected Result
- Full TV show catalog with 302 authentic shows
- Advanced filtering and search functionality
- Responsive design for all devices
- Fast loading with caching optimizations

Your application will be available at: `https://tv-tantrum-catalog.onrender.com`