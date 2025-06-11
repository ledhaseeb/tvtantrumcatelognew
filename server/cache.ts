import NodeCache from "node-cache";

// Initialize cache with optimized settings for viral traffic
export const cache = new NodeCache({
  stdTTL: 1800, // 30 minutes default TTL - longer for viral traffic
  checkperiod: 300, // Check for expired keys every 5 minutes
  useClones: false, // Don't clone objects for better performance
  deleteOnExpire: true,
  maxKeys: 50000, // Much higher cache capacity for viral load
  forceString: false, // Allow object storage for efficiency
});

// Cache keys and TTL configurations
export const CACHE_KEYS = {
  TV_SHOWS_ALL: 'tv_shows:all',
  TV_SHOW_BY_ID: 'tv_show:id:',
  FEATURED_SHOW: 'featured_show',
  POPULAR_SHOWS: 'popular_shows',
  THEMES: 'themes',
  PLATFORMS: 'platforms',
  SEARCH_RESULTS: 'search:',
  SIMILAR_SHOWS: 'similar:',
  HOMEPAGE_CATEGORIES: 'homepage_categories',
  CATEGORY_SHOWS: 'category_shows:',
  RESEARCH_SUMMARIES: 'research_summaries',
  RESEARCH_BY_ID: 'research:id:',
} as const;

export const CACHE_TTL = {
  LONG: 1800, // 30 minutes for rarely changing data
  MEDIUM: 600, // 10 minutes for moderately changing data
  SHORT: 300, // 5 minutes for frequently changing data
  VERY_SHORT: 60, // 1 minute for dynamic data
} as const;

// Cache helper functions
export function getCacheKey(baseKey: string, ...params: (string | number)[]): string {
  return params.length > 0 ? `${baseKey}${params.join(':')}` : baseKey;
}

export function invalidatePattern(pattern: string): void {
  const keys = cache.keys();
  const keysToDelete = keys.filter(key => key.includes(pattern));
  cache.del(keysToDelete);
}

// Cache statistics for monitoring
export function getCacheStats() {
  return {
    keys: cache.keys().length,
    stats: cache.getStats(),
    memory: process.memoryUsage(),
  };
}