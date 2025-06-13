import { Pool } from 'pg';
import { TvShow, Theme, Platform, ResearchSummary, User, HomepageCategory, InsertHomepageCategory } from '@shared/catalog-schema';
import { cache, CACHE_KEYS, CACHE_TTL, getCacheKey, invalidatePattern } from "./cache";
import { 
  getCachedSearch, 
  setCachedSearch, 
  getCachedHomepageCategories,
  setCachedHomepageCategories,
  getCachedTvShowsWithFilters,
  setCachedTvShowsWithFilters
} from "./enhanced-cache";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: false
});

// Handle pool errors to prevent app crashes
pool.on('error', (err: any, client) => {
  console.error('Database pool error - continuing with cache:', err.code, err.message);
  // Don't crash the app - pool will recover automatically
});

export class CatalogStorage {
  /**
   * Get all TV shows with filtering capabilities
   */
  async getTvShows(filters: {
    themes?: string[];
    themeMatchMode?: 'AND' | 'OR';
    ageGroup?: string;
    platforms?: string[];
    search?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<TvShow[]> {
    // Enhanced caching for viral traffic
    const cached = getCachedTvShowsWithFilters(filters);
    if (cached) {
      return cached;
    }

    // Check cache first with a specific key for this filter combination
    const cacheKey = getCacheKey(CACHE_KEYS.TV_SHOWS, JSON.stringify(filters));
    const cacheResult = cache.get<TvShow[]>(cacheKey);
    if (cacheResult) {
      return cacheResult;
    }

    try {
      const client = await pool.connect();
      try {
        // Optimized query without DISTINCT for better performance
        let query = `
          SELECT ts.* 
          FROM catalog_tv_shows ts
        `;
      
        let whereConditions: string[] = [];
        let queryParams: any[] = [];
        let paramIndex = 1;
        
        // Theme filtering using array column
        if (filters.themes && filters.themes.length > 0) {
          // Default to AND mode if no explicit mode is provided
          const matchMode = filters.themeMatchMode || 'AND';
          
          if (matchMode === 'AND') {
            // For AND logic, show must have ALL specified themes
            // Use @> operator to check if themes array contains all specified themes
            whereConditions.push(`ts.themes @> $${paramIndex}`);
            queryParams.push(filters.themes);
            paramIndex++;
          } else {
            // For OR logic, show must have ANY of the specified themes  
            whereConditions.push(`ts.themes && $${paramIndex}`);
            queryParams.push(filters.themes);
            paramIndex++;
          }
        }
        
        // Age group filtering - simplified to avoid parsing errors
        if (filters.ageGroup) {
          whereConditions.push(`ts.age_range = $${paramIndex}`);
          queryParams.push(filters.ageGroup);
          paramIndex++;
        }
        
        // Platform filtering
        if (filters.platforms && filters.platforms.length > 0) {
          whereConditions.push(`ts.platforms && $${paramIndex}`);
          queryParams.push(filters.platforms);
          paramIndex++;
        }
        
        // Search functionality
        if (filters.search) {
          whereConditions.push(`
            (ts.title ILIKE $${paramIndex} OR 
             ts.description ILIKE $${paramIndex} OR 
             EXISTS (
               SELECT 1 FROM unnest(ts.themes) AS theme 
               WHERE theme ILIKE $${paramIndex}
             ))
          `);
          queryParams.push(`%${filters.search}%`);
          paramIndex++;
        }
        
        // Featured filtering
        if (filters.featured !== undefined) {
          whereConditions.push(`ts.featured = $${paramIndex}`);
          queryParams.push(filters.featured);
          paramIndex++;
        }
        
        // Add WHERE clause if we have conditions
        if (whereConditions.length > 0) {
          query += ` WHERE ${whereConditions.join(' AND ')}`;
        }
        
        // Add ordering by rating and then by title
        query += ` ORDER BY ts.rating DESC, ts.title ASC`;
        
        // Add pagination
        if (filters.limit) {
          query += ` LIMIT $${paramIndex}`;
          queryParams.push(filters.limit);
          paramIndex++;
          
          if (filters.offset) {
            query += ` OFFSET $${paramIndex}`;
            queryParams.push(filters.offset);
            paramIndex++;
          }
        }
        
        const result = await client.query(query, queryParams);
        const shows = result.rows;
        
        // Cache the results for 5 minutes
        cache.set(cacheKey, shows, CACHE_TTL.SHORT);
        setCachedTvShowsWithFilters(filters, shows);
        
        return shows;
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('Database error in getTvShows - using cache fallback:', error.message);
      // Return empty array as fallback when database is unavailable
      return [];
    }
  }

  /**
   * Get a single TV show by ID
   */
  async getTvShowById(id: number): Promise<TvShow | null> {
    // Check cache first
    const cacheKey = getCacheKey(CACHE_KEYS.TV_SHOW_BY_ID, id);
    const cached = cache.get<TvShow>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const client = await pool.connect();
      try {
        const result = await client.query(
          'SELECT * FROM catalog_tv_shows WHERE id = $1',
          [id]
        );
        const show = result.rows[0] || null;
        
        // Cache for 10 minutes - individual shows change less frequently
        if (show) {
          cache.set(cacheKey, show, CACHE_TTL.MEDIUM);
        }
        
        return show;
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('Database error in getTvShowById - returning null:', error.message);
      return null;
    }
  }

  /**
   * Get featured show
   */
  async getFeaturedShow(): Promise<TvShow | null> {
    const cacheKey = CACHE_KEYS.FEATURED_SHOW;
    const cached = cache.get<TvShow>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const client = await pool.connect();
      try {
        const result = await client.query(
          'SELECT * FROM catalog_tv_shows WHERE featured = true ORDER BY rating DESC LIMIT 1'
        );
        const show = result.rows[0] || null;
        
        if (show) {
          cache.set(cacheKey, show, CACHE_TTL.LONG);
        }
        
        return show;
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('Database error in getFeaturedShow - returning null:', error.message);
      return null;
    }
  }

  /**
   * Get popular shows
   */
  async getPopularShows(limit: number = 10): Promise<TvShow[]> {
    const cacheKey = getCacheKey(CACHE_KEYS.POPULAR_SHOWS, limit);
    const cached = cache.get<TvShow[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const client = await pool.connect();
      try {
        const result = await client.query(
          'SELECT * FROM catalog_tv_shows ORDER BY rating DESC LIMIT $1',
          [limit]
        );
        const shows = result.rows;
        
        cache.set(cacheKey, shows, CACHE_TTL.MEDIUM);
        return shows;
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('Database error in getPopularShows - returning empty array:', error.message);
      return [];
    }
  }

  /**
   * Search shows by name with enhanced caching for viral traffic
   */
  async searchShows(searchTerm: string, limit: number = 20): Promise<TvShow[]> {
    // Enhanced caching for viral traffic
    const cached = getCachedSearch(searchTerm);
    if (cached) {
      return cached;
    }

    const cacheKey = getCacheKey(CACHE_KEYS.SEARCH, searchTerm, limit);
    const cacheResult = cache.get<TvShow[]>(cacheKey);
    if (cacheResult) {
      return cacheResult;
    }

    try {
      const client = await pool.connect();
      try {
        const result = await client.query(`
          SELECT * FROM catalog_tv_shows
          WHERE title ILIKE $1 OR description ILIKE $1
          ORDER BY 
            CASE 
              WHEN title ILIKE $2 THEN 1
              WHEN title ILIKE $1 THEN 2
              ELSE 3
            END,
            rating DESC
          LIMIT $3
        `, [`%${searchTerm}%`, `${searchTerm}%`, limit]);
        
        const shows = result.rows;
        
        // Cache for 3 minutes for viral traffic handling
        cache.set(cacheKey, shows, 180);
        setCachedSearch(searchTerm, shows);
        
        return shows;
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('Database error in searchShows - returning empty array:', error.message);
      return [];
    }
  }

  /**
   * Get all themes
   */
  async getThemes(): Promise<Theme[]> {
    const cacheKey = CACHE_KEYS.THEMES;
    const cached = cache.get<Theme[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM catalog_themes ORDER BY name');
        const themes = result.rows;
        
        cache.set(cacheKey, themes, CACHE_TTL.LONG);
        return themes;
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('Database error in getThemes - returning empty array:', error.message);
      return [];
    }
  }

  /**
   * Get all platforms
   */
  async getPlatforms(): Promise<Platform[]> {
    const cacheKey = CACHE_KEYS.PLATFORMS;
    const cached = cache.get<Platform[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM catalog_platforms ORDER BY name');
        const platforms = result.rows;
        
        cache.set(cacheKey, platforms, CACHE_TTL.LONG);
        return platforms;
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('Database error in getPlatforms - returning empty array:', error.message);
      return [];
    }
  }

  /**
   * Get research summaries
   */
  async getResearchSummaries(category?: string, limit?: number): Promise<ResearchSummary[]> {
    const cacheKey = getCacheKey(CACHE_KEYS.RESEARCH, category || 'all', limit || 'all');
    const cached = cache.get<ResearchSummary[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const client = await pool.connect();
      try {
        let query = 'SELECT * FROM catalog_research_summaries';
        const params: any[] = [];
        
        if (category) {
          query += ' WHERE category = $1';
          params.push(category);
        }
        
        query += ' ORDER BY published_date DESC';
        
        if (limit) {
          const paramIndex = params.length + 1;
          query += ` LIMIT $${paramIndex}`;
          params.push(limit);
        }
        
        const result = await client.query(query, params);
        const summaries = result.rows.map(row => ({
          id: row.id,
          title: row.title,
          summary: row.summary,
          fullText: row.full_text,
          category: row.category,
          imageUrl: row.image_url,
          source: row.source,
          originalUrl: row.original_study_url,
          publishedDate: row.published_date,
          headline: row.headline,
          subHeadline: row.sub_headline,
          keyFindings: row.key_findings,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));
        
        cache.set(cacheKey, summaries, CACHE_TTL.MEDIUM);
        return summaries;
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('Database error in getResearchSummaries - returning empty array:', error.message);
      return [];
    }
  }

  /**
   * Get research summary by ID
   */
  async getResearchSummaryById(id: number): Promise<ResearchSummary | null> {
    const cacheKey = getCacheKey(CACHE_KEYS.RESEARCH_BY_ID, id);
    const cached = cache.get<ResearchSummary>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const client = await pool.connect();
      try {
        const result = await client.query(
          'SELECT * FROM catalog_research_summaries WHERE id = $1',
          [id]
        );
        
        if (result.rows.length === 0) {
          return null;
        }
        
        const row = result.rows[0];
        const summary: ResearchSummary = {
          id: row.id,
          title: row.title,
          summary: row.summary,
          fullText: row.full_text,
          category: row.category,
          imageUrl: row.image_url,
          source: row.source,
          originalUrl: row.original_study_url,
          publishedDate: row.published_date,
          headline: row.headline,
          subHeadline: row.sub_headline,
          keyFindings: row.key_findings,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
        
        cache.set(cacheKey, summary, CACHE_TTL.MEDIUM);
        return summary;
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('Database error in getResearchSummaryById - returning null:', error.message);
      return null;
    }
  }

  /**
   * Get similar shows based on themes and age range
   */
  async getSimilarShows(showId: number, limit: number = 6): Promise<TvShow[]> {
    const cacheKey = getCacheKey(CACHE_KEYS.SIMILAR_SHOWS, showId, limit);
    const cached = cache.get<TvShow[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const client = await pool.connect();
      try {
        // First get the current show to find similar ones
        const currentShowResult = await client.query(
          'SELECT themes, age_range FROM catalog_tv_shows WHERE id = $1',
          [showId]
        );
        
        if (currentShowResult.rows.length === 0) {
          return [];
        }
        
        const currentShow = currentShowResult.rows[0];
        
        // Find shows with overlapping themes and same age range, excluding current show
        const result = await client.query(`
          SELECT *, 
          (
            SELECT COUNT(*) 
            FROM unnest(themes) AS theme 
            WHERE theme = ANY($1)
          ) as theme_overlap
          FROM catalog_tv_shows 
          WHERE id != $2 
          AND age_range = $3
          AND themes && $1
          ORDER BY theme_overlap DESC, rating DESC 
          LIMIT $4
        `, [currentShow.themes, showId, currentShow.age_range, limit]);
        
        const shows = result.rows;
        cache.set(cacheKey, shows, CACHE_TTL.MEDIUM);
        return shows;
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('Database error in getSimilarShows - returning empty array:', error.message);
      return [];
    }
  }

  /**
   * Homepage Categories Management
   */
  async getHomepageCategories(): Promise<HomepageCategory[]> {
    return this.getActiveHomepageCategories();
  }

  async getActiveHomepageCategories(): Promise<HomepageCategory[]> {
    // Enhanced caching for viral traffic
    const cached = getCachedHomepageCategories();
    if (cached) {
      return cached;
    }

    const cacheKey = CACHE_KEYS.HOMEPAGE_CATEGORIES;
    const cacheResult = cache.get<HomepageCategory[]>(cacheKey);
    if (cacheResult) {
      return cacheResult;
    }

    try {
      const client = await pool.connect();
      try {
        const result = await client.query(`
          SELECT id, title, subtitle, filter_config, display_order, is_active, created_at, updated_at
          FROM catalog_homepage_categories 
          WHERE is_active = true 
          ORDER BY display_order ASC, created_at ASC
        `);
        
        const categories = result.rows;
        
        // Cache for 10 minutes for viral traffic handling
        cache.set(cacheKey, categories, 600);
        setCachedHomepageCategories(categories);
        
        return categories;
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('Database error in getActiveHomepageCategories - returning empty array:', error.message);
      return [];
    }
  }

  async getHomepageCategoryShows(categoryId: number): Promise<TvShow[]> {
    const cacheKey = getCacheKey(CACHE_KEYS.HOMEPAGE_CATEGORY_SHOWS, categoryId);
    const cached = cache.get<TvShow[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const client = await pool.connect();
      try {
        // Get the category's filter configuration
        const categoryResult = await client.query(
          'SELECT filter_config FROM catalog_homepage_categories WHERE id = $1 AND is_active = true',
          [categoryId]
        );
        
        if (categoryResult.rows.length === 0) {
          return [];
        }
        
        const filterConfig = categoryResult.rows[0].filter_config;
        const filters = this.convertFilterConfigToFilters(filterConfig);
        
        // Get shows using the existing getTvShows method
        const shows = await this.getTvShows(filters);
        
        cache.set(cacheKey, shows, CACHE_TTL.SHORT);
        return shows;
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('Database error in getHomepageCategoryShows - returning empty array:', error.message);
      return [];
    }
  }

  private convertFilterConfigToFilters(filterConfig: any): any {
    // Convert the database filter config to the format expected by getTvShows
    const filters: any = {};
    
    if (filterConfig.themes && filterConfig.themes.length > 0) {
      filters.themes = filterConfig.themes;
      filters.themeMatchMode = filterConfig.themeMatchMode || 'AND';
    }
    
    if (filterConfig.ageGroup) {
      filters.ageGroup = filterConfig.ageGroup;
    }
    
    if (filterConfig.platforms && filterConfig.platforms.length > 0) {
      filters.platforms = filterConfig.platforms;
    }
    
    if (filterConfig.featured !== undefined) {
      filters.featured = filterConfig.featured;
    }
    
    if (filterConfig.limit) {
      filters.limit = filterConfig.limit;
    }
    
    return filters;
  }

  /**
   * Get all unique themes from the database for theme search functionality
   */
  async getAllUniqueThemes(): Promise<string[]> {
    try {
      const client = await pool.connect();
      try {
        const result = await client.query(`
          SELECT DISTINCT unnest(themes) as theme
          FROM catalog_tv_shows
          WHERE themes IS NOT NULL
          ORDER BY theme
        `);
        
        return result.rows.map(row => row.theme).filter(theme => theme && theme.trim());
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('Database error in getAllUniqueThemes - returning empty array:', error.message);
      return [];
    }
  }
}

export const catalogStorage = new CatalogStorage();