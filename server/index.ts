import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import session from 'express-session';
import MemoryStore from 'memorystore';
import ConnectPgSimple from 'connect-pg-simple';
import compression from 'compression';
import { setupVite, serveStatic } from './vite';
import { catalogStorage } from './catalog-storage';
import { Pool } from 'pg';
import { setupSimpleAdminAuth } from './simple-admin';
import adminRoutes from './admin-routes';
import { cache, getCacheStats } from './cache';
import { getEnhancedCacheStats } from './enhanced-cache';
import { setupDatabaseRecovery } from './database-recovery';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Original database connection for image proxy
const originalDb = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ZH3VF9BEjlyk@ep-small-cloud-a46us4xp.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

const app = express();
const server = createServer(app);

// Performance optimization middleware
app.use(compression({
  level: 9, // Maximum compression for viral traffic bandwidth savings
  threshold: 512, // Compress smaller responses for mobile users
  filter: (req, res) => {
    // Don't compress if the request includes a Cache-Control: no-transform directive
    if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
      return false;
    }
    // Use default compression filter for everything else
    return compression.filter(req, res);
  }
}));

// Request queuing middleware for viral traffic management
let activeRequests = 0;
const MAX_CONCURRENT_REQUESTS = 2000; // Increased capacity
const imageRequestCounts = new Map(); // Track image requests per IP

app.use((req, res, next) => {
  const isImageRequest = req.path.includes('/images/tv-shows/') || req.path.includes('/custom-images/');
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Special handling for image requests to prevent cascading failures
  if (isImageRequest) {
    const key = `${clientIP}:${req.path}`;
    const count = imageRequestCounts.get(key) || 0;
    
    // Limit image requests per IP per path to prevent infinite retry loops
    if (count > 5) {
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.status(200).send(`<svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="600" fill="#285161"/>
        <text x="200" y="300" text-anchor="middle" fill="white" font-size="20">Rate Limited</text>
      </svg>`);
    }
    
    imageRequestCounts.set(key, count + 1);
    
    // Clean up old image request counts every 1000 requests
    if (imageRequestCounts.size > 1000) {
      const cutoff = Date.now() - 60000; // 1 minute ago
      for (const [k, v] of imageRequestCounts.entries()) {
        if (typeof v === 'object' && v.timestamp < cutoff) {
          imageRequestCounts.delete(k);
        }
      }
    }
  }
  
  // General request limiting
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    return res.status(503).json({ 
      message: "Server at capacity, please try again shortly",
      retryAfter: 5
    });
  }
  
  activeRequests++;
  res.on('finish', () => {
    activeRequests--;
  });
  
  next();
});

// Performance monitoring middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) { // Log slow requests
      console.warn(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// PostgreSQL session store for production persistence
const PgStore = ConnectPgSimple(session);

// Session configuration with persistent PostgreSQL storage
const sessionConfig: any = {
  secret: process.env.SESSION_SECRET || 'catalog-secret-key-production-2024',
  resave: false,
  saveUninitialized: false,
  name: 'tvtantrum.sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // Changed from 'strict' to 'none' for HTTPS
  }
};

console.log('[SESSION CONFIG]', {
  environment: process.env.NODE_ENV,
  cookieSecure: sessionConfig.cookie.secure,
  cookieSameSite: sessionConfig.cookie.sameSite,
  hasSecret: !!process.env.SESSION_SECRET
});

// Use PostgreSQL store in production for session persistence
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  try {
    sessionConfig.store = new PgStore({
      conString: process.env.DATABASE_URL,
      tableName: 'session',
      createTableIfMissing: true,
      pruneSessionInterval: 60 * 15 // Cleanup every 15 minutes
    });
    console.log('[SESSION] Using PostgreSQL session store for production');
  } catch (error) {
    console.error('[SESSION] PostgreSQL store failed, falling back to memory store:', error);
    const memoryStore = MemoryStore(session);
    sessionConfig.store = new memoryStore({
      checkPeriod: 86400000
    });
  }
} else {
  // Use MemoryStore for development
  const memoryStore = MemoryStore(session);
  sessionConfig.store = new memoryStore({
    checkPeriod: 86400000
  });
  console.log('[SESSION] Using memory store for development');
}

app.use(session(sessionConfig));

// Serve ads.txt file for Google AdSense verification
app.get('/ads.txt', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send('google.com, pub-1980242774753631, DIRECT, f08c47fec0942fa0');
});

// Serve llms.txt file for AI system documentation
app.get('/llms.txt', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.sendFile(join(__dirname, '../public/llms.txt'));
});

// Catalog API Routes
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    server: 'tv-tantrum',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Performance monitoring endpoint for viral traffic tracking
router.get('/performance-stats', (req, res) => {
  const memUsage = process.memoryUsage();
  const cacheStats = cache.getStats();
  
  res.json({
    timestamp: new Date().toISOString(),
    server: {
      activeRequests,
      maxConcurrentRequests: MAX_CONCURRENT_REQUESTS,
      uptime: process.uptime(),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024) // MB
      }
    },
    cache: {
      keys: cache.keys().length,
      hits: cacheStats.hits,
      misses: cacheStats.misses,
      hitRate: cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100,
      vsize: cacheStats.vsize,
      ksize: cacheStats.ksize
    },
    database: {
      maxConnections: 50,
      // Pool stats would require additional monitoring setup
    }
  });
});

// Get all TV shows with filtering
router.get('/tv-shows', async (req, res) => {
  try {
    const filters: any = {};
    
    // Basic search and age filtering
    if (req.query.search) filters.search = req.query.search;
    if (req.query.ageGroup) filters.ageGroup = req.query.ageGroup;
    
    // Age range filtering (support both JSON and individual min/max params)
    if (req.query.ageRange) {
      try {
        filters.ageRange = JSON.parse(req.query.ageRange as string);
      } catch (e) {
        return res.status(400).json({ message: "Invalid ageRange format" });
      }
    } else if (req.query.ageRangeMin && req.query.ageRangeMax) {
      filters.ageRange = {
        min: parseInt(req.query.ageRangeMin as string),
        max: parseInt(req.query.ageRangeMax as string)
      };
    }
    
    // Stimulation score range filtering
    if (req.query.stimulationScoreRange) {
      try {
        filters.stimulationScoreRange = JSON.parse(req.query.stimulationScoreRange as string);
      } catch (e) {
        return res.status(400).json({ message: "Invalid stimulationScoreRange format" });
      }
    }
    
    // Theme filtering with match mode
    if (req.query.themes) {
      if (typeof req.query.themes === 'string') {
        filters.themes = req.query.themes.split(',').map(theme => theme.trim());
      } else if (Array.isArray(req.query.themes)) {
        filters.themes = req.query.themes;
      }
    }
    if (req.query.themeMatchMode) {
      filters.themeMatchMode = req.query.themeMatchMode as 'AND' | 'OR';
    }
    
    // Sorting
    if (req.query.sortBy) filters.sortBy = req.query.sortBy;
    
    // Sensory filters
    if (req.query.tantrumFactor) filters.tantrumFactor = req.query.tantrumFactor;
    if (req.query.interactionLevel) filters.interactionLevel = req.query.interactionLevel;
    if (req.query.dialogueIntensity) filters.dialogueIntensity = req.query.dialogueIntensity;
    if (req.query.soundFrequency) filters.soundFrequency = req.query.soundFrequency;
    
    // Pagination
    if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
    if (req.query.offset) filters.offset = parseInt(req.query.offset as string);

    // Generate cache key from filters for viral traffic optimization
    const cacheKey = `tv_shows:${JSON.stringify(filters)}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      // Set aggressive cache headers for viral traffic
      res.set({
        'Cache-Control': 'public, max-age=1800, s-maxage=3600', // 30min client, 1hr CDN
        'ETag': `"shows-${Date.now()}"`,
        'Vary': 'Accept-Encoding'
      });
      return res.json(cached);
    }

    console.log('API received filters:', filters);
    const shows = await catalogStorage.getTvShows(filters);
    console.log(`API returning ${shows.length} shows`);
    
    // Cache for 30 minutes to handle viral traffic
    cache.set(cacheKey, shows, 1800);
    
    // Set aggressive cache headers
    res.set({
      'Cache-Control': 'public, max-age=1800, s-maxage=3600',
      'ETag': `"shows-${Date.now()}"`,
      'Vary': 'Accept-Encoding'
    });
    
    res.json(shows);
  } catch (error) {
    console.error("Error fetching TV shows:", error);
    res.status(500).json({ message: "Failed to fetch TV shows" });
  }
});

// Get popular shows
router.get('/shows/popular', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 12;
    const shows = await catalogStorage.getTvShows({ limit });
    res.json(shows);
  } catch (error) {
    console.error("Error fetching popular shows:", error);
    res.status(500).json({ message: "Failed to fetch popular shows" });
  }
});

// Get featured show
router.get('/shows/featured', async (req, res) => {
  try {
    const shows = await catalogStorage.getTvShows({ limit: 1 });
    res.json(shows[0] || null);
  } catch (error) {
    console.error("Error fetching featured show:", error);
    res.status(500).json({ message: "Failed to fetch featured show" });
  }
});

// Get single TV show
router.get('/tv-shows/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const show = await catalogStorage.getTvShowById(id);
    
    if (!show) {
      return res.status(404).json({ message: "Show not found" });
    }
    
    // Cache individual show data for 10 minutes
    res.set({
      'Cache-Control': 'public, max-age=600, s-maxage=600',
      'ETag': `"show-${id}-${Date.now()}"`,
      'Vary': 'Accept-Encoding'
    });
    
    res.json(show);
  } catch (error) {
    console.error("Error fetching TV show:", error);
    res.status(500).json({ message: "Failed to fetch TV show" });
  }
});

// Get all themes
router.get('/themes', async (req, res) => {
  try {
    const themes = await catalogStorage.getThemes();
    
    // Cache themes for 30 minutes (they rarely change)
    res.set({
      'Cache-Control': 'public, max-age=1800, s-maxage=1800',
      'Vary': 'Accept-Encoding'
    });
    
    res.json(themes);
  } catch (error) {
    console.error("Error fetching themes:", error);
    res.status(500).json({ message: "Failed to fetch themes" });
  }
});

// Get research summaries
router.get('/research', async (req, res) => {
  try {
    const summaries = await catalogStorage.getResearchSummaries();
    res.json(summaries);
  } catch (error) {
    console.error("Error fetching research summaries:", error);
    res.status(500).json({ message: "Failed to fetch research summaries" });
  }
});

// Get single research summary
router.get('/research/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const summaries = await catalogStorage.getResearchSummaries();
    const summary = summaries.find(s => s.id === id);
    
    if (!summary) {
      return res.status(404).json({ message: "Research summary not found" });
    }
    
    res.json(summary);
  } catch (error) {
    console.error("Error fetching research summary:", error);
    res.status(500).json({ message: "Failed to fetch research summary" });
  }
});

// Get active homepage categories (public endpoint)
router.get('/homepage-categories', async (req, res) => {
  try {
    const cacheKey = 'homepage_categories:active';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      res.set({
        'Cache-Control': 'public, max-age=3600, s-maxage=7200', // 1hr client, 2hr CDN
        'ETag': `"categories-${Date.now()}"`,
        'Vary': 'Accept-Encoding'
      });
      return res.json(cached);
    }
    
    const categories = await catalogStorage.getActiveHomepageCategories();
    
    // Cache for 1 hour - categories change infrequently
    cache.set(cacheKey, categories, 3600);
    
    res.set({
      'Cache-Control': 'public, max-age=3600, s-maxage=7200',
      'ETag': `"categories-${Date.now()}"`,
      'Vary': 'Accept-Encoding'
    });
    
    res.json(categories);
  } catch (error) {
    console.error("Error fetching homepage categories:", error);
    res.status(500).json({ message: "Failed to fetch homepage categories" });
  }
});

// Get shows for a specific homepage category
router.get('/homepage-categories/:id/shows', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const cacheKey = `category_shows:${categoryId}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      res.set({
        'Cache-Control': 'public, max-age=1800, s-maxage=3600', // 30min client, 1hr CDN
        'ETag': `"cat-shows-${categoryId}-${Date.now()}"`,
        'Vary': 'Accept-Encoding'
      });
      return res.json(cached);
    }
    
    const shows = await catalogStorage.getHomepageCategoryShows(categoryId);
    
    // Cache for 30 minutes
    cache.set(cacheKey, shows, 1800);
    
    res.set({
      'Cache-Control': 'public, max-age=1800, s-maxage=3600',
      'ETag': `"cat-shows-${categoryId}-${Date.now()}"`,
      'Vary': 'Accept-Encoding'
    });
    
    res.json(shows);
  } catch (error) {
    console.error("Error fetching category shows:", error);
    res.status(500).json({ message: "Failed to fetch category shows" });
  }
});

// Image proxy route for external images
router.get('/image-proxy', async (req, res) => {
  try {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).json({ message: "URL parameter required" });
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      return res.status(404).json({ message: "Image not found" });
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=604800'); // Cache for 7 days for viral traffic
    res.send(Buffer.from(imageBuffer));
  } catch (error) {
    console.error("Error proxying image:", error);
    res.status(500).json({ message: "Failed to proxy image" });
  }
});

// Robust image serving with proper mapping between database paths and actual files
app.get('/images/tv-shows/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Set aggressive caching headers to prevent repeated requests
    res.set({
      'Cache-Control': 'public, max-age=86400, immutable',
      'ETag': `"img-${filename}"`,
      'Vary': 'Accept-Encoding'
    });
    
    // Extract show name from filename: show-6-Alma_s_Way.jpg -> Alma's Way
    const showNameFromFile = filename
      .replace(/^show-\d+-/, '')  // Remove show-ID- prefix
      .replace(/\.[^.]+$/, '')    // Remove file extension
      .replace(/_/g, ' ')         // Replace underscores with spaces
      .replace(/\s+/g, ' ')       // Normalize spaces
      .trim();
    
    console.log(`Looking for image: ${filename} -> "${showNameFromFile}"`);
    
    // Try various filename patterns in custom-images directory
    const customImagesDir = join(__dirname, '../public/custom-images');
    const possibleFilenames = [
      // Exact match with original filename
      filename,
      // Try the extracted show name with various extensions
      `${showNameFromFile}.jpg`,
      `${showNameFromFile}.jpeg`, 
      `${showNameFromFile}.png`,
      `${showNameFromFile}.webp`,
      // Try lowercase versions
      `${showNameFromFile.toLowerCase()}.jpg`,
      `${showNameFromFile.toLowerCase()}.jpeg`,
      `${showNameFromFile.toLowerCase()}.png`,
      `${showNameFromFile.toLowerCase()}.webp`,
      // Try with different punctuation
      `${showNameFromFile.replace(/'/g, '')}.jpg`,
      `${showNameFromFile.replace(/'/g, '').toLowerCase()}.jpg`,
      // Try kebab-case versions
      `${showNameFromFile.toLowerCase().replace(/\s+/g, '-')}.jpg`,
      `${showNameFromFile.toLowerCase().replace(/\s+/g, '-')}.png`,
      `${showNameFromFile.toLowerCase().replace(/\s+/g, '-')}.webp`
    ];
    
    // Try each possible filename
    for (const possibleFile of possibleFilenames) {
      const imagePath = join(customImagesDir, possibleFile);
      try {
        await fs.promises.access(imagePath);
        console.log(`Found image: ${possibleFile}`);
        return res.sendFile(imagePath);
      } catch {}
    }
    
    // Try uploads directory with various patterns
    const uploadsDir = join(__dirname, '../public/uploads');
    const uploadPatterns = [
      `show-${filename.match(/show-(\d+)-/)?.[1]}-*.jpg`,
      filename
    ];
    
    // Check uploads directory
    try {
      const uploadFiles = await fs.promises.readdir(uploadsDir);
      const showIdMatch = filename.match(/show-(\d+)-/);
      if (showIdMatch) {
        const showId = showIdMatch[1];
        const matchingUpload = uploadFiles.find(file => 
          file.startsWith(`show-${showId}-`) && 
          (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png') || file.endsWith('.webp'))
        );
        
        if (matchingUpload) {
          const uploadPath = join(uploadsDir, matchingUpload);
          console.log(`Found upload image: ${matchingUpload}`);
          return res.sendFile(uploadPath);
        }
      }
    } catch {}
    
    // Try optimized uploads
    try {
      const optimizedDir = join(uploadsDir, 'optimized');
      const optimizedFiles = await fs.promises.readdir(optimizedDir);
      const showIdMatch = filename.match(/show-(\d+)-/);
      if (showIdMatch) {
        const showId = showIdMatch[1];
        const matchingOptimized = optimizedFiles.find(file => 
          file.includes(`show-${showId}-`) && 
          (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png') || file.endsWith('.webp'))
        );
        
        if (matchingOptimized) {
          const optimizedPath = join(optimizedDir, matchingOptimized);
          console.log(`Found optimized image: ${matchingOptimized}`);
          return res.sendFile(optimizedPath);
        }
      }
    } catch {}
    
    // Fallback to generic image
    const genericImagePath = join(__dirname, '../public/images/generic-tv-show.jpg');
    try {
      await fs.promises.access(genericImagePath);
      console.log(`Using generic image for: ${filename}`);
      return res.sendFile(genericImagePath);
    } catch {
      console.log(`No image found for: ${filename}, using SVG placeholder`);
      // Only use SVG as absolute last resort
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(`<svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="600" fill="#285161"/>
        <text x="200" y="280" text-anchor="middle" fill="white" font-size="20">📺</text>
        <text x="200" y="320" text-anchor="middle" fill="white" font-size="16">${showNameFromFile}</text>
      </svg>`);
    }
  } catch (error) {
    console.error('Image serving error:', error);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(200).send(`<svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="600" fill="#285161"/>
      <text x="200" y="300" text-anchor="middle" fill="white" font-size="24">Image Error</text>
    </svg>`);
  }
});

// Legacy media route redirect  
app.get('/media/tv-shows/:filename', (req, res) => {
  res.redirect(301, `/images/tv-shows/${req.params.filename}`);
});

// Setup admin authentication routes
setupSimpleAdminAuth(app);

// Add health check endpoint at root level for Railway
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    server: 'tv-tantrum',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount API routes BEFORE Vite middleware to prevent conflicts
// Performance monitoring endpoint for high-traffic scaling
app.get('/api/performance-stats', (req, res) => {
  const stats = getCacheStats();
  const enhancedStats = getEnhancedCacheStats();
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({
    uptime: uptime,
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
      external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB',
    },
    cache: {
      memory: {
        keysCount: stats.keys,
        hits: stats.stats.hits,
        misses: stats.stats.misses,
        hitRate: stats.stats.hits > 0 ? ((stats.stats.hits / (stats.stats.hits + stats.stats.misses)) * 100).toFixed(2) + '%' : '0%',
        ksize: stats.stats.ksize,
        vsize: stats.stats.vsize
      },
      viral: enhancedStats
    },
    timestamp: new Date().toISOString()
  });
});

// Cache management endpoint for scaling operations
app.post('/api/cache/clear', (req, res) => {
  const pattern = req.body.pattern;
  if (pattern) {
    // Clear specific cache patterns
    const keys = cache.keys().filter(key => key.includes(pattern));
    cache.del(keys);
    res.json({ message: `Cleared ${keys.length} cache entries matching pattern: ${pattern}` });
  } else {
    // Clear all cache
    cache.flushAll();
    res.json({ message: 'All cache cleared' });
  }
});

app.use('/api/admin', adminRoutes);
app.use('/api', router);

const port = Number(process.env.PORT) || 5000;

if (process.env.NODE_ENV === 'development') {
  setupVite(app, server);
} else {
  // For production, try to serve static files, fallback to development setup
  try {
    serveStatic(app);
  } catch (error) {
    console.log('Static files not found, using development server for production deployment');
    setupVite(app, server);
  }
}

// Global error handlers to prevent database crashes
process.on('uncaughtException', (error: any) => {
  console.error('Uncaught Exception:', error.message);
  if (error.code === '57P01' || error.message?.includes('terminating connection')) {
    console.log('Database connection terminated - continuing operation with cache');
    return; // Don't crash the app
  }
  console.error('Non-database error - exiting:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (reason?.code === '57P01' || reason?.message?.includes('terminating connection')) {
    console.log('Database rejection handled - continuing with cache');
    return; // Don't crash the app
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`TV Tantrum Catalog server running on port ${port}`);
  console.log(`Using catalog database with 302 authentic TV shows`);
  console.log(`Simplified content discovery without social features`);
  console.log(`Enhanced caching enabled for viral traffic handling`);
  console.log(`Database crash protection active`);
});