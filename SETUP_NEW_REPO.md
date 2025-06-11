# Setup Commands for New GitHub Repository

## After downloading all files to your new folder:

### 1. Initialize Git Repository
```bash
git init
```

### 2. Add Your GitHub Repository as Remote
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### 3. Create .gitignore File
```bash
# Create .gitignore file with this content:
node_modules/
dist/
.env
*.log
.DS_Store
downloads/
attached_assets/
.cache/
```

### 4. Add All Files
```bash
git add .
```

### 5. Make Initial Commit
```bash
git commit -m "Initial commit: TV Show Catalog with Railway deployment

- Complete React + Express TV catalog application
- 302 authentic TV shows with PostgreSQL database
- Advanced filtering and search functionality
- Railway deployment configuration ready
- Production-ready with health checks and monitoring"
```

### 6. Push to GitHub
```bash
git push -u origin main
```

## Verify Before Pushing:
- Confirm all files from FILES_TO_DOWNLOAD.md are present
- Check that .env file is NOT included (contains secrets)
- Verify railway.json and deployment files are present
- Ensure public/custom-images folder is included

## After Successful Push:
1. Go to railway.app
2. Create new project from your GitHub repository
3. Railway will auto-detect configuration from railway.json
4. Add environment variables in Railway dashboard
5. Deploy automatically