import { createClient } from 'redis';

// Redis client configuration
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 5000
  }
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis connected successfully');
});

// Initialize Redis connection
let isRedisConnected = false;

export async function initializeRedis() {
  try {
    if (!isRedisConnected) {
      await redisClient.connect();
      isRedisConnected = true;
      console.log('Redis cache initialized for viral traffic handling');
    }
  } catch (error) {
    console.warn('Redis connection failed, using memory cache fallback:', error);
    isRedisConnected = false;
  }
}

// Cache keys with TTL (Time To Live)
export const CACHE_CONFIG = {
  TV_SHOWS_ALL: { key: 'tv_shows:all', ttl: 300 }, // 5 minutes
  TV_SHOWS_FEATURED: { key: 'tv_shows:featured', ttl: 600 }, // 10 minutes
  TV_SHOWS_POPULAR: { key: 'tv_shows:popular', ttl: 300 }, // 5 minutes
  THEMES: { key: 'themes:all', ttl: 1800 }, // 30 minutes
  PLATFORMS: { key: 'platforms:all', ttl: 1800 }, // 30 minutes
  HOMEPAGE_CATEGORIES: { key: 'homepage:categories', ttl: 600 }, // 10 minutes
  SEARCH_RESULTS: { key: 'search', ttl: 180 }, // 3 minutes
};

// Generic cache operations
export async function setCache(key: string, data: any, ttl: number = 300): Promise<void> {
  if (!isRedisConnected) return;
  
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.warn('Redis set failed:', error);
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  if (!isRedisConnected) return null;
  
  try {
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.warn('Redis get failed:', error);
    return null;
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  if (!isRedisConnected) return;
  
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`Invalidated ${keys.length} cache keys matching: ${pattern}`);
    }
  } catch (error) {
    console.warn('Redis invalidation failed:', error);
  }
}

// TV Show specific cache operations
export async function getCachedTvShows(filters: any): Promise<any[] | null> {
  const cacheKey = `${CACHE_CONFIG.TV_SHOWS_ALL.key}:${JSON.stringify(filters)}`;
  return await getCache(cacheKey);
}

export async function setCachedTvShows(filters: any, shows: any[]): Promise<void> {
  const cacheKey = `${CACHE_CONFIG.TV_SHOWS_ALL.key}:${JSON.stringify(filters)}`;
  await setCache(cacheKey, shows, CACHE_CONFIG.TV_SHOWS_ALL.ttl);
}

export async function getCachedSearchResults(query: string): Promise<any[] | null> {
  const cacheKey = `${CACHE_CONFIG.SEARCH_RESULTS.key}:${query.toLowerCase()}`;
  return await getCache(cacheKey);
}

export async function setCachedSearchResults(query: string, results: any[]): Promise<void> {
  const cacheKey = `${CACHE_CONFIG.SEARCH_RESULTS.key}:${query.toLowerCase()}`;
  await setCache(cacheKey, results, CACHE_CONFIG.SEARCH_RESULTS.ttl);
}

// Homepage category cache
export async function getCachedHomepageCategories(): Promise<any[] | null> {
  return await getCache(CACHE_CONFIG.HOMEPAGE_CATEGORIES.key);
}

export async function setCachedHomepageCategories(categories: any[]): Promise<void> {
  await setCache(CACHE_CONFIG.HOMEPAGE_CATEGORIES.key, categories, CACHE_CONFIG.HOMEPAGE_CATEGORIES.ttl);
}

// Cache statistics for monitoring
export async function getCacheInfo(): Promise<any> {
  if (!isRedisConnected) {
    return { connected: false, error: 'Redis not connected' };
  }
  
  try {
    const info = await redisClient.info('memory');
    const keyCount = await redisClient.dbSize();
    
    return {
      connected: true,
      keyCount,
      memoryInfo: info,
      uptime: process.uptime()
    };
  } catch (error) {
    return { connected: false, error: String(error) };
  }
}

// Cleanup function
export async function closeRedis(): Promise<void> {
  if (isRedisConnected) {
    await redisClient.quit();
    isRedisConnected = false;
  }
}

export { redisClient };