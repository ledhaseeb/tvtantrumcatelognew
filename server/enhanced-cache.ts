import { cache, CACHE_KEYS, CACHE_TTL, getCacheKey } from "./cache";

// Enhanced in-memory caching for viral traffic handling
// This works without Redis and scales with multiple instances

export const VIRAL_CACHE_CONFIG = {
  SEARCH_RESULTS: { ttl: 180000 }, // 3 minutes in ms
  TV_SHOWS_LIST: { ttl: 300000 }, // 5 minutes
  HOMEPAGE_DATA: { ttl: 600000 }, // 10 minutes
  THEMES_PLATFORMS: { ttl: 1800000 }, // 30 minutes
};

// Enhanced search caching
const searchCache = new Map<string, { data: any[], timestamp: number }>();

export function getCachedSearch(query: string): any[] | null {
  const cached = searchCache.get(query.toLowerCase());
  if (cached && Date.now() - cached.timestamp < VIRAL_CACHE_CONFIG.SEARCH_RESULTS.ttl) {
    return cached.data;
  }
  return null;
}

export function setCachedSearch(query: string, results: any[]): void {
  searchCache.set(query.toLowerCase(), {
    data: results,
    timestamp: Date.now()
  });
  
  // Cleanup old entries to prevent memory leaks
  if (searchCache.size > 1000) {
    const now = Date.now();
    for (const [key, value] of searchCache.entries()) {
      if (now - value.timestamp > VIRAL_CACHE_CONFIG.SEARCH_RESULTS.ttl) {
        searchCache.delete(key);
      }
    }
  }
}

// Enhanced homepage caching
let homepageCategoriesCache: { data: any[], timestamp: number } | null = null;

export function getCachedHomepageCategories(): any[] | null {
  if (homepageCategoriesCache && 
      Date.now() - homepageCategoriesCache.timestamp < VIRAL_CACHE_CONFIG.HOMEPAGE_DATA.ttl) {
    return homepageCategoriesCache.data;
  }
  return null;
}

export function setCachedHomepageCategories(categories: any[]): void {
  homepageCategoriesCache = {
    data: categories,
    timestamp: Date.now()
  };
}

// TV Shows filtering cache with enhanced performance
const tvShowsFilterCache = new Map<string, { data: any[], timestamp: number }>();

export function getCachedTvShowsWithFilters(filters: any): any[] | null {
  const filterKey = JSON.stringify(filters);
  const cached = tvShowsFilterCache.get(filterKey);
  
  if (cached && Date.now() - cached.timestamp < VIRAL_CACHE_CONFIG.TV_SHOWS_LIST.ttl) {
    return cached.data;
  }
  return null;
}

export function setCachedTvShowsWithFilters(filters: any, shows: any[]): void {
  const filterKey = JSON.stringify(filters);
  tvShowsFilterCache.set(filterKey, {
    data: shows,
    timestamp: Date.now()
  });
  
  // Cleanup old filter combinations
  if (tvShowsFilterCache.size > 500) {
    const now = Date.now();
    for (const [key, value] of tvShowsFilterCache.entries()) {
      if (now - value.timestamp > VIRAL_CACHE_CONFIG.TV_SHOWS_LIST.ttl) {
        tvShowsFilterCache.delete(key);
      }
    }
  }
}

// Cache statistics for monitoring
export function getEnhancedCacheStats() {
  return {
    searchCache: {
      size: searchCache.size,
      maxSize: 1000
    },
    tvShowsCache: {
      size: tvShowsFilterCache.size,
      maxSize: 500
    },
    homepageCache: {
      cached: homepageCategoriesCache !== null,
      age: homepageCategoriesCache ? Date.now() - homepageCategoriesCache.timestamp : 0
    }
  };
}

// Clear all caches (useful for admin operations)
export function clearAllEnhancedCaches(): void {
  searchCache.clear();
  tvShowsFilterCache.clear();
  homepageCategoriesCache = null;
  console.log('All enhanced caches cleared');
}