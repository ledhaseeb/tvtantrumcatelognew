import { Pool } from 'pg';
import { TvShow, Theme, Platform, ResearchSummary, User, HomepageCategory, InsertHomepageCategory, AmazonProduct, InsertAmazonProduct, PromoBanner, InsertPromoBanner } from '@shared/catalog-schema';
import { cache, CACHE_KEYS, CACHE_TTL, getCacheKey, invalidatePattern } from "./cache";
import { 
  getCachedSearch, 
  setCachedSearch, 
  getCachedHomepageCategories,
  setCachedHomepageCategories,
  getCachedTvShowsWithFilters,
  setCachedTvShowsWithFilters,
  clearAllEnhancedCaches
} from "./enhanced-cache";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') || process.env.DATABASE_URL?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : undefined,
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
    ageGroup?: string;
    ageRange?: {min: number, max: number};
    stimulationScoreRange?: {min: number, max: number};
    themes?: string[];
    themeMatchMode?: 'AND' | 'OR';
    search?: string;
    sortBy?: string;
    tantrumFactor?: string;
    interactionLevel?: string;
    dialogueIntensity?: string;
    soundFrequency?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<TvShow[]> {
    // Create cache key based on filters
    const cacheKey = getCacheKey(CACHE_KEYS.TV_SHOWS_ALL, JSON.stringify(filters));
    
    // Check cache first
    const cached = cache.get<TvShow[]>(cacheKey);
    if (cached) {
      return cached;
    }

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
      
      // Age range filtering - optimized for performance
      if (filters.ageRange) {
        // Simple string pattern matching for better performance
        const agePatterns = [];
        for (let min = filters.ageRange.min; min <= filters.ageRange.max; min++) {
          for (let max = min; max <= Math.min(filters.ageRange.max + 5, 12); max++) {
            agePatterns.push(`${min}-${max}`);
          }
        }
        
        if (agePatterns.length > 0) {
          whereConditions.push(`ts.age_range = ANY($${paramIndex})`);
          queryParams.push(agePatterns);
          paramIndex++;
        }
      }
      
      // Stimulation score range filtering
      if (filters.stimulationScoreRange) {
        whereConditions.push(`ts.stimulation_score BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
        queryParams.push(filters.stimulationScoreRange.min, filters.stimulationScoreRange.max);
        paramIndex += 2;
      }
      
      // Sensory filters
      if (filters.tantrumFactor) {
        // Map tantrumFactor to stimulation_score for backward compatibility
        const scoreMap: {[key: string]: number} = {
          'low': 1,
          'low-medium': 2,
          'medium': 3,
          'medium-high': 4,
          'high': 5
        };
        const score = scoreMap[filters.tantrumFactor.toLowerCase()];
        if (score) {
          whereConditions.push(`ts.stimulation_score = $${paramIndex}`);
          queryParams.push(score);
          paramIndex++;
        }
      }
      
      if (filters.interactionLevel) {
        whereConditions.push(`ts.interactivity_level = $${paramIndex}`);
        queryParams.push(filters.interactionLevel);
        paramIndex++;
      }
      
      if (filters.dialogueIntensity) {
        whereConditions.push(`ts.dialogue_intensity = $${paramIndex}`);
        queryParams.push(filters.dialogueIntensity);
        paramIndex++;
      }
      
      if (filters.soundFrequency) {
        whereConditions.push(`ts.sound_frequency = $${paramIndex}`);
        queryParams.push(filters.soundFrequency);
        paramIndex++;
      }
      
      // Search filtering
      if (filters.search) {
        const searchTerm = `%${filters.search.toLowerCase()}%`;
        whereConditions.push(`(
          LOWER(ts.name) LIKE $${paramIndex} OR 
          LOWER(ts.description) LIKE $${paramIndex} OR
          LOWER(ts.creator) LIKE $${paramIndex}
        )`);
        queryParams.push(searchTerm);
        paramIndex++;
      }
      
      // Add WHERE clause if we have conditions
      if (whereConditions.length > 0) {
        const whereClause = whereConditions.join(' AND ');
        if (query.includes('WHERE')) {
          query += ` AND ${whereClause}`;
        } else {
          query += ` WHERE ${whereClause}`;
        }
      }
      
      // Sorting
      let orderBy = 'ts.name ASC';
      switch (filters.sortBy) {
        case 'stimulation-score':
          orderBy = 'ts.stimulation_score ASC, ts.name ASC';
          break;
        case 'name':
          orderBy = 'ts.name ASC';
          break;
        case 'popular':
          orderBy = 'ts.is_featured DESC, ts.name ASC';
          break;
        case 'release-year':
          orderBy = 'ts.release_year DESC NULLS LAST, ts.name ASC';
          break;
        default:
          orderBy = 'ts.name ASC';
      }
      
      query += ` ORDER BY ${orderBy}`;
      
      // Pagination
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
      
      return shows;
    } finally {
      client.release();
    }
  }

  /**
   * Get TV shows with minimal fields for homepage display - optimized for bandwidth
   */
  async getTvShowsMinimal(filters: {
    themes?: string[];
    themeMatchMode?: 'AND' | 'OR';
    ageGroup?: string;
    ageRange?: { min: number; max: number };
    stimulationScoreRange?: { min: number; max: number };
    searchTerm?: string;
    sortBy?: 'stimulation-score' | 'name' | 'popular' | 'release-year';
    limit?: number;
    offset?: number;
  } = {}): Promise<TvShow[]> {
    const cacheKey = getCacheKey('tv-shows-minimal', JSON.stringify(filters));
    const cached = cache.get<TvShow[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const client = await pool.connect();
    try {
      // Select only essential fields for homepage display
      let query = `
        SELECT 
          ts.id,
          ts.name,
          ts.image_url,
          ts.age_range,
          ts.stimulation_score,
          ts.is_featured
        FROM catalog_tv_shows ts
      `;
      
      let whereConditions: string[] = [];
      let queryParams: any[] = [];
      let paramIndex = 1;
      
      // Theme filtering using array column
      if (filters.themes && filters.themes.length > 0) {
        const matchMode = filters.themeMatchMode || 'AND';
        
        if (matchMode === 'AND') {
          whereConditions.push(`ts.themes @> $${paramIndex}`);
          queryParams.push(filters.themes);
          paramIndex++;
        } else {
          whereConditions.push(`ts.themes && $${paramIndex}`);
          queryParams.push(filters.themes);
          paramIndex++;
        }
      }
      
      // Age group filtering
      if (filters.ageGroup) {
        whereConditions.push(`ts.age_range = $${paramIndex}`);
        queryParams.push(filters.ageGroup);
        paramIndex++;
      }
      
      // Age range filtering
      if (filters.ageRange) {
        const agePatterns = [];
        for (let min = filters.ageRange.min; min <= filters.ageRange.max; min++) {
          for (let max = min; max <= Math.min(filters.ageRange.max + 5, 12); max++) {
            agePatterns.push(`${min}-${max}`);
          }
        }
        
        if (agePatterns.length > 0) {
          whereConditions.push(`ts.age_range = ANY($${paramIndex})`);
          queryParams.push(agePatterns);
          paramIndex++;
        }
      }
      
      // Stimulation score filtering
      if (filters.stimulationScoreRange) {
        whereConditions.push(`ts.stimulation_score >= $${paramIndex} AND ts.stimulation_score <= $${paramIndex + 1}`);
        queryParams.push(filters.stimulationScoreRange.min, filters.stimulationScoreRange.max);
        paramIndex += 2;
      }
      
      // Search term filtering
      if (filters.searchTerm && filters.searchTerm.trim()) {
        whereConditions.push(`ts.name ILIKE $${paramIndex}`);
        queryParams.push(`%${filters.searchTerm.trim()}%`);
        paramIndex++;
      }
      
      // Apply WHERE conditions
      if (whereConditions.length > 0) {
        const whereClause = whereConditions.join(' AND ');
        query += ` WHERE ${whereClause}`;
      }
      
      // Sorting
      let orderBy = 'ts.name ASC';
      switch (filters.sortBy) {
        case 'stimulation-score':
          orderBy = 'ts.stimulation_score ASC, ts.name ASC';
          break;
        case 'name':
          orderBy = 'ts.name ASC';
          break;
        case 'popular':
          orderBy = 'ts.is_featured DESC, ts.name ASC';
          break;
        case 'release-year':
          orderBy = 'ts.name ASC'; // No release_year in minimal select
          break;
        default:
          orderBy = 'ts.name ASC';
      }
      
      query += ` ORDER BY ${orderBy}`;
      
      // Pagination
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
      const shows = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        imageUrl: row.image_url,
        ageRange: row.age_range,
        stimulationScore: row.stimulation_score,
        isFeatured: row.is_featured
      }));
      
      // Cache the results for 5 minutes
      cache.set(cacheKey, shows, CACHE_TTL.SHORT);
      
      return shows;
    } finally {
      client.release();
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
  }

  /**
   * Get featured show
   */
  async getFeaturedShow(): Promise<TvShow | null> {
    // Check cache first
    const cached = cache.get<TvShow>(CACHE_KEYS.FEATURED_SHOW);
    if (cached) {
      return cached;
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM catalog_tv_shows WHERE is_featured = true LIMIT 1'
      );
      const show = result.rows[0] || null;
      
      // Cache for 30 minutes - featured show doesn't change often
      if (show) {
        cache.set(CACHE_KEYS.FEATURED_SHOW, show, CACHE_TTL.LONG);
      }
      
      return show;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get popular shows
   */
  async getPopularShows(limit: number = 10): Promise<TvShow[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM catalog_tv_shows 
        ORDER BY is_featured DESC, stimulation_score ASC, name ASC 
        LIMIT $1
      `, [limit]);
      return result.rows;
    } finally {
      client.release();
    }
  }
  
  /**
   * Search shows by name with enhanced caching for viral traffic
   */
  async searchShows(searchTerm: string, limit: number = 20): Promise<TvShow[]> {
    // Check enhanced cache first for viral traffic handling
    const cachedResults = getCachedSearch(searchTerm);
    if (cachedResults) {
      return cachedResults.slice(0, limit);
    }

    const client = await pool.connect();
    try {
      const search = `%${searchTerm.toLowerCase()}%`;
      const result = await client.query(`
        SELECT *, 
          CASE 
            WHEN LOWER(name) = LOWER($2) THEN 1
            WHEN LOWER(name) LIKE LOWER($2 || '%') THEN 2
            WHEN LOWER(name) LIKE LOWER('%' || $2 || '%') THEN 3
            WHEN LOWER(description) LIKE $1 THEN 4
            ELSE 5
          END as search_rank
        FROM catalog_tv_shows 
        WHERE LOWER(name) LIKE $1 
           OR LOWER(description) LIKE $1 
           OR LOWER(creator) LIKE $1
        ORDER BY search_rank, name ASC
        LIMIT $3
      `, [search, searchTerm, limit]);
      
      const searchResults = result.rows;
      
      // Cache search results for viral traffic handling
      setCachedSearch(searchTerm, searchResults);
      
      return searchResults;
    } finally {
      client.release();
    }
  }
  


  /**
   * Get all themes
   */
  async getThemes(): Promise<Theme[]> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM catalog_themes ORDER BY name');
      return result.rows;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get all platforms
   */
  async getPlatforms(): Promise<Platform[]> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM catalog_platforms ORDER BY name');
      return result.rows;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get research summaries
   */
  async getResearchSummaries(category?: string, limit?: number): Promise<ResearchSummary[]> {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM catalog_research_summaries';
      let params: any[] = [];
      
      if (category) {
        query += ' WHERE category = $1';
        params.push(category);
      }
      
      query += ' ORDER BY created_at DESC';
      
      if (limit) {
        query += ` LIMIT $${params.length + 1}`;
        params.push(limit);
      }
      
      const result = await client.query(query, params);
      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        summary: row.summary,
        fullText: row.full_text,
        category: row.category,
        imageUrl: row.image_url,
        source: row.source,
        originalStudyUrl: row.original_url,
        publishedDate: row.published_date,
        headline: row.headline,
        subHeadline: row.sub_headline,
        keyFindings: row.key_findings,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } finally {
      client.release();
    }
  }
  
  /**
   * Get research summary by ID
   */
  async getResearchSummaryById(id: number): Promise<ResearchSummary | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM catalog_research_summaries WHERE id = $1',
        [id]
      );
      const row = result.rows[0];
      if (!row) return null;
      
      return {
        id: row.id,
        title: row.title,
        summary: row.summary,
        fullText: row.full_text,
        category: row.category,
        imageUrl: row.image_url,
        source: row.source,
        originalStudyUrl: row.original_url,
        publishedDate: row.published_date,
        headline: row.headline,
        subHeadline: row.sub_headline,
        keyFindings: row.key_findings,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } finally {
      client.release();
    }
  }
  
  /**
   * Admin functions - Create/Update/Delete TV shows
   */
  async createTvShow(show: Omit<TvShow, 'id'>): Promise<TvShow> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO catalog_tv_shows (
          name, description, age_range, episode_length, creator, release_year,
          end_year, is_ongoing, seasons, stimulation_score, interactivity_level,
          dialogue_intensity, sound_effects_level, music_tempo, total_music_level,
          total_sound_effect_time_level, scene_frequency, creativity_rating,
          available_on, themes, animation_style, image_url, is_featured,
          subscriber_count, video_count, channel_id, is_youtube_channel,
          published_at, has_omdb_data, has_youtube_data, on_kidsafetv
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
        ) RETURNING *
      `, [
        show.name, show.description, show.ageRange, show.episodeLength,
        show.creator, show.releaseYear, show.endYear, show.isOngoing,
        show.seasons, show.stimulationScore, show.interactivityLevel,
        show.dialogueIntensity, show.soundEffectsLevel, show.musicTempo,
        show.totalMusicLevel, show.totalSoundEffectTimeLevel, show.sceneFrequency,
        show.creativityRating, show.availableOn, show.themes, show.animationStyle,
        show.imageUrl, show.isFeatured, show.subscriberCount, show.videoCount,
        show.channelId, show.isYouTubeChannel, show.publishedAt, show.hasOmdbData,
        show.hasYoutubeData, (show as any).onKidsafetv ?? false
      ]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }
  
  /**
   * Update TV show
   */
  async updateTvShow(id: number, updates: Partial<TvShow>): Promise<TvShow | null> {
    const client = await pool.connect();
    try {
      const fields = Object.keys(updates);
      const values = Object.values(updates);
      
      if (fields.length === 0) return null;
      
      const setClause = fields.map((field, index) => {
        const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
        return `${dbField} = $${index + 1}`;
      }).join(', ');
      
      const result = await client.query(`
        UPDATE catalog_tv_shows 
        SET ${setClause}
        WHERE id = $${fields.length + 1}
        RETURNING *
      `, [...values, id]);
      
      invalidatePattern('tv_shows:');
      invalidatePattern('tv-shows-minimal');
      invalidatePattern(getCacheKey(CACHE_KEYS.TV_SHOW_BY_ID, id));
      clearAllEnhancedCaches();

      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async trackKidsafetvClick(id: number): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE catalog_tv_shows SET kidsafetv_clicks = kidsafetv_clicks + 1 WHERE id = $1`,
        [id]
      );
      invalidatePattern(getCacheKey(CACHE_KEYS.TV_SHOW_BY_ID, id));
      invalidatePattern('tv_shows:');
    } finally {
      client.release();
    }
  }
  
  /**
   * Get similar shows based on themes and age range
   */
  async getSimilarShows(showId: number, limit: number = 6): Promise<TvShow[]> {
    const client = await pool.connect();
    try {
      // First get the target show to find similar shows
      const targetShowResult = await client.query(
        'SELECT * FROM catalog_tv_shows WHERE id = $1',
        [showId]
      );
      
      if (targetShowResult.rows.length === 0) {
        return [];
      }
      
      const targetShow = targetShowResult.rows[0];
      
      // Find shows with similar themes and age range
      const result = await client.query(`
        SELECT DISTINCT ts.*, 
          CASE 
            WHEN ts.age_range = $2 THEN 3
            WHEN ts.stimulation_score = $3 THEN 2
            ELSE 1
          END as similarity_score
        FROM catalog_tv_shows ts
        WHERE ts.id != $1
          AND (
            ts.themes && $4::text[] OR
            ts.age_range = $2 OR
            ts.stimulation_score = $3
          )
        ORDER BY similarity_score DESC, ts.name
        LIMIT $5
      `, [showId, targetShow.age_range, targetShow.stimulation_score, targetShow.themes || [], limit]);
      
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Delete TV show
   */
  async deleteTvShow(id: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM catalog_tv_shows WHERE id = $1',
        [id]
      );
      return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  }
  
  /**
   * Admin authentication check
   */
  async getAdminUser(email: string): Promise<User | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM catalog_users WHERE email = $1 AND is_admin = true',
        [email]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * Get all users (admin function)
   */
  async getAllUsers(): Promise<User[]> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM catalog_users ORDER BY created_at DESC');
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get all research summaries (admin function)
   */
  async getAllResearchSummaries(): Promise<ResearchSummary[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM catalog_research_summaries ORDER BY created_at DESC'
      );
      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        summary: row.summary,
        fullText: row.full_text,
        category: row.category,
        imageUrl: row.image_url,
        source: row.source,
        originalStudyUrl: row.original_url,
        publishedDate: row.published_date,
        headline: row.headline,
        subHeadline: row.sub_headline,
        keyFindings: row.key_findings,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get research summary by ID (admin function)
   */
  async getResearchSummary(id: number): Promise<ResearchSummary | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM catalog_research_summaries WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * Create research summary (admin function)
   */
  async createResearchSummary(data: any): Promise<ResearchSummary> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO catalog_research_summaries (
          title, category, source, published_date, original_url, image_url,
          headline, sub_headline, summary, key_findings, full_text,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
        ) RETURNING *
      `, [
        data.title, data.category, data.source, data.publishedDate, data.originalStudyUrl, data.imageUrl,
        data.headline, data.subHeadline, data.summary, data.keyFindings, data.fullText
      ]);
      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        summary: row.summary,
        fullText: row.full_text,
        category: row.category,
        imageUrl: row.image_url,
        source: row.source,
        originalStudyUrl: row.original_url,
        publishedDate: row.published_date,
        headline: row.headline,
        subHeadline: row.sub_headline,
        keyFindings: row.key_findings,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } finally {
      client.release();
    }
  }

  /**
   * Update research summary (admin function)
   */
  async updateResearchSummary(id: number, data: any): Promise<ResearchSummary | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        UPDATE catalog_research_summaries 
        SET title = $2, category = $3, source = $4, published_date = $5,
            original_url = $6, image_url = $7, headline = $8, sub_headline = $9,
            summary = $10, key_findings = $11, full_text = $12, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [
        id, data.title, data.category, data.source, data.publishedDate,
        data.originalStudyUrl, data.imageUrl, data.headline, data.subHeadline,
        data.summary, data.keyFindings, data.fullText
      ]);
      const row = result.rows[0];
      if (!row) return null;
      
      return {
        id: row.id,
        title: row.title,
        summary: row.summary,
        fullText: row.full_text,
        category: row.category,
        imageUrl: row.image_url,
        source: row.source,
        originalStudyUrl: row.original_url,
        publishedDate: row.published_date,
        headline: row.headline,
        subHeadline: row.sub_headline,
        keyFindings: row.key_findings,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } finally {
      client.release();
    }
  }

  /**
   * Delete research summary (admin function)
   */
  async deleteResearchSummary(id: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM catalog_research_summaries WHERE id = $1',
        [id]
      );
      return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  }

  /**
   * Homepage Categories Management
   */
  async getHomepageCategories(): Promise<HomepageCategory[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM homepage_categories WHERE is_active = true ORDER BY display_order, name'
      );
      const categories = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        displayOrder: row.display_order,
        isActive: row.is_active,
        filterConfig: row.filter_config,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      // Calculate show counts for each category
      for (const category of categories) {
        const shows = await this.getHomepageCategoryShows(category.id);
        (category as any).showCount = shows.length;
        console.log(`[PUBLIC] Category "${category.name}" (ID: ${category.id}) has ${shows.length} shows`);
      }

      return categories;
    } finally {
      client.release();
    }
  }

  async getAllHomepageCategories(): Promise<HomepageCategory[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM homepage_categories ORDER BY display_order, name'
      );
      const categories = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        displayOrder: row.display_order,
        isActive: row.is_active,
        filterConfig: row.filter_config,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      // Calculate show counts for each category
      for (const category of categories) {
        const shows = await this.getHomepageCategoryShows(category.id);
        (category as any).showCount = shows.length;
        console.log(`[ADMIN] Category "${category.name}" (ID: ${category.id}) has ${shows.length} shows`);
      }

      return categories;
    } finally {
      client.release();
    }
  }

  async createHomepageCategory(category: InsertHomepageCategory): Promise<HomepageCategory> {
    const client = await pool.connect();
    try {
      // Get the next available display order
      let displayOrder = category.displayOrder;
      if (displayOrder === undefined || displayOrder === null) {
        const maxOrderResult = await client.query('SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM homepage_categories');
        displayOrder = maxOrderResult.rows[0].next_order;
      }
      
      const result = await client.query(`
        INSERT INTO homepage_categories (name, description, display_order, is_active, filter_config)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        category.name,
        category.description,
        displayOrder,
        category.isActive !== false,
        JSON.stringify(category.filterConfig)
      ]);

      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        displayOrder: row.display_order,
        isActive: row.is_active,
        filterConfig: row.filter_config,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } finally {
      client.release();
    }
  }

  async updateHomepageCategory(id: number, category: Partial<InsertHomepageCategory>): Promise<HomepageCategory | null> {
    const client = await pool.connect();
    try {
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (category.name !== undefined) {
        setClauses.push(`name = $${paramIndex++}`);
        values.push(category.name);
      }
      if (category.description !== undefined) {
        setClauses.push(`description = $${paramIndex++}`);
        values.push(category.description);
      }
      if (category.displayOrder !== undefined) {
        setClauses.push(`display_order = $${paramIndex++}`);
        values.push(category.displayOrder);
      }
      if (category.isActive !== undefined) {
        setClauses.push(`is_active = $${paramIndex++}`);
        values.push(category.isActive);
      }
      if (category.filterConfig !== undefined) {
        setClauses.push(`filter_config = $${paramIndex++}`);
        values.push(JSON.stringify(category.filterConfig));
      }

      setClauses.push(`updated_at = $${paramIndex++}`);
      values.push(new Date());

      values.push(id);

      const result = await client.query(`
        UPDATE homepage_categories 
        SET ${setClauses.join(', ')} 
        WHERE id = $${paramIndex}
        RETURNING *
      `, values);

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        displayOrder: row.display_order,
        isActive: row.is_active,
        filterConfig: row.filter_config,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } finally {
      client.release();
    }
  }

  async deleteHomepageCategory(id: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM homepage_categories WHERE id = $1',
        [id]
      );
      return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  }

  async getActiveHomepageCategories(): Promise<HomepageCategory[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM homepage_categories WHERE is_active = true ORDER BY display_order, name'
      );
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        displayOrder: row.display_order,
        isActive: row.is_active,
        filterConfig: row.filter_config,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } finally {
      client.release();
    }
  }

  async getHomepageCategoryShows(categoryId: number): Promise<TvShow[]> {
    const client = await pool.connect();
    try {
      // Get category filter config
      const categoryResult = await client.query(
        'SELECT filter_config FROM homepage_categories WHERE id = $1',
        [categoryId]
      );

      if (categoryResult.rows.length === 0) return [];

      const filterConfigRaw = categoryResult.rows[0].filter_config;
      const filterConfig = typeof filterConfigRaw === 'string' ? JSON.parse(filterConfigRaw) : filterConfigRaw;
      
      console.log(`[DEBUG] Category ${categoryId} filter config:`, JSON.stringify(filterConfig, null, 2));
      
      // Convert filter config to query filters
      const filters = this.convertFilterConfigToFilters(filterConfig);
      console.log(`[DEBUG] Category ${categoryId} converted filters:`, JSON.stringify(filters, null, 2));
      
      // Apply the filters to get shows with minimal fields for homepage
      const shows = await this.getTvShowsMinimal(filters);
      console.log(`[DEBUG] Category ${categoryId} getTvShows returned ${shows.length} shows`);
      return shows;
    } finally {
      client.release();
    }
  }

  private convertFilterConfigToFilters(filterConfig: any): any {
    const filters: any = {};
    
    if (!filterConfig.rules || !Array.isArray(filterConfig.rules)) {
      return filters;
    }

    for (const rule of filterConfig.rules) {
      switch (rule.field) {
        case 'stimulationScore':
          if (rule.operator === 'range' && rule.value) {
            // Handle both string format "1-2" and object format {min: 1, max: 2}
            if (typeof rule.value === 'string') {
              const parts = rule.value.split('-');
              if (parts.length === 2) {
                filters.stimulationScoreRange = {
                  min: parseInt(parts[0]),
                  max: parseInt(parts[1])
                };
              }
            } else if (typeof rule.value === 'object') {
              filters.stimulationScoreRange = {
                min: rule.value.min || 1,
                max: rule.value.max || 5
              };
            }
          }
          break;
        case 'ageGroup':
          if (rule.operator === 'equals') {
            filters.ageGroup = rule.value;
          }
          break;
        case 'ageRange':
          if (rule.operator === 'range' && rule.value) {
            // Handle age range format "0-5"
            if (typeof rule.value === 'string') {
              const parts = rule.value.split('-');
              if (parts.length === 2) {
                filters.ageRange = {
                  min: parseInt(parts[0]),
                  max: parseInt(parts[1])
                };
              }
            }
          }
          break;
        case 'themes':
          if (rule.operator === 'in' && Array.isArray(rule.value)) {
            filters.themes = rule.value;
            filters.themeMatchMode = filterConfig.logic || 'AND';
          } else if (rule.operator === 'contains') {
            // Handle individual theme contains rules - collect them into an array
            if (!filters.themes) {
              filters.themes = [];
            }
            filters.themes.push(rule.value);
          }
          break;
        case 'interactivityLevel':
          if (rule.operator === 'equals') {
            filters.interactivityLevel = rule.value;
          }
          break;
      }
    }

    // Set theme match mode if themes were found
    if (filters.themes && filters.themes.length > 0) {
      filters.themeMatchMode = filterConfig.logic || 'AND';
    }

    return filters;
  }

  async getShowsForCategory(categoryId: number): Promise<TvShow[]> {
    // This method is deprecated, use getHomepageCategoryShows instead
    return this.getHomepageCategoryShows(categoryId);
  }

  /**
   * Amazon Products Management
   */
  async getAmazonProducts(filters: {
    category?: string;
    search?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<AmazonProduct[]> {
    const cacheKey = getCacheKey('amazon-products', JSON.stringify(filters));
    const cached = cache.get<AmazonProduct[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const client = await pool.connect();
    try {
      let query = `
        SELECT * FROM amazon_products
        WHERE is_active = COALESCE($1, is_active)
      `;
      let params: any[] = [filters.isActive ?? true];
      let paramIndex = 2;

      if (filters.category) {
        query += ` AND category = $${paramIndex}`;
        params.push(filters.category);
        paramIndex++;
      }

      if (filters.search) {
        query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC`;

      if (filters.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
        paramIndex++;
      }

      if (filters.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(filters.offset);
      }

      const result = await client.query(query, params);
      const products = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        category: row.category,
        imageUrl: row.image_url,
        amazonUrl: row.amazon_url,
        price: row.price,
        availabilityCountries: row.availability_countries,
        videoUrl: row.video_url,
        description: row.description,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      // Cache for 10 minutes
      cache.set(cacheKey, products, CACHE_TTL.MEDIUM);
      
      return products;
    } finally {
      client.release();
    }
  }

  async getAmazonProductById(id: number): Promise<AmazonProduct | null> {
    const cacheKey = getCacheKey('amazon-product', id);
    const cached = cache.get<AmazonProduct>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM amazon_products WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      const product = {
        id: row.id,
        name: row.name,
        category: row.category,
        imageUrl: row.image_url,
        amazonUrl: row.amazon_url,
        price: row.price,
        availabilityCountries: row.availability_countries,
        videoUrl: row.video_url,
        description: row.description,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      cache.set(cacheKey, product, CACHE_TTL.MEDIUM);
      
      return product;
    } finally {
      client.release();
    }
  }

  async createAmazonProduct(product: InsertAmazonProduct): Promise<AmazonProduct> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO amazon_products (name, category, image_url, amazon_url, price, availability_countries, video_url, description, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          product.name,
          product.category,
          product.imageUrl,
          product.amazonUrl,
          product.price,
          product.availabilityCountries,
          product.videoUrl || null,
          product.description || null,
          product.isActive ?? true
        ]
      );
      
      const row = result.rows[0];
      const newProduct = {
        id: row.id,
        name: row.name,
        category: row.category,
        imageUrl: row.image_url,
        amazonUrl: row.amazon_url,
        price: row.price,
        availabilityCountries: row.availability_countries,
        videoUrl: row.video_url,
        description: row.description,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
      // Clear cache
      invalidatePattern('amazon-products');
      
      return newProduct;
    } finally {
      client.release();
    }
  }

  async updateAmazonProduct(id: number, updates: Partial<InsertAmazonProduct>): Promise<AmazonProduct | null> {
    const client = await pool.connect();
    try {
      const setParts: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.name !== undefined) {
        setParts.push(`name = $${paramIndex}`);
        values.push(updates.name);
        paramIndex++;
      }

      if (updates.category !== undefined) {
        setParts.push(`category = $${paramIndex}`);
        values.push(updates.category);
        paramIndex++;
      }

      if (updates.imageUrl !== undefined) {
        setParts.push(`image_url = $${paramIndex}`);
        values.push(updates.imageUrl);
        paramIndex++;
      }

      if (updates.amazonUrl !== undefined) {
        setParts.push(`amazon_url = $${paramIndex}`);
        values.push(updates.amazonUrl);
        paramIndex++;
      }

      if (updates.price !== undefined) {
        setParts.push(`price = $${paramIndex}`);
        values.push(updates.price);
        paramIndex++;
      }

      if (updates.availabilityCountries !== undefined) {
        setParts.push(`availability_countries = $${paramIndex}`);
        values.push(updates.availabilityCountries);
        paramIndex++;
      }

      if (updates.videoUrl !== undefined) {
        setParts.push(`video_url = $${paramIndex}`);
        values.push(updates.videoUrl);
        paramIndex++;
      }

      if (updates.description !== undefined) {
        setParts.push(`description = $${paramIndex}`);
        values.push(updates.description);
        paramIndex++;
      }

      if (updates.isActive !== undefined) {
        setParts.push(`is_active = $${paramIndex}`);
        values.push(updates.isActive);
        paramIndex++;
      }

      if (setParts.length === 0) {
        return this.getAmazonProductById(id);
      }

      setParts.push(`updated_at = NOW()`);
      values.push(id);

      const query = `
        UPDATE amazon_products 
        SET ${setParts.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      const updatedProduct = {
        id: row.id,
        name: row.name,
        category: row.category,
        imageUrl: row.image_url,
        amazonUrl: row.amazon_url,
        price: row.price,
        availabilityCountries: row.availability_countries,
        videoUrl: row.video_url,
        description: row.description,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
      // Clear cache
      invalidatePattern('amazon-products');
      invalidatePattern(`amazon-product:${id}`);
      
      return updatedProduct;
    } finally {
      client.release();
    }
  }

  async deleteAmazonProduct(id: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM amazon_products WHERE id = $1',
        [id]
      );
      
      // Clear cache
      invalidatePattern('amazon-products');
      invalidatePattern(`amazon-product:${id}`);
      
      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  async getAmazonProductCategories(): Promise<string[]> {
    const cacheKey = 'amazon-product-categories';
    const cached = cache.get<string[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT DISTINCT category FROM amazon_products WHERE is_active = true ORDER BY category'
      );
      
      const categories = result.rows.map(row => row.category);
      cache.set(cacheKey, categories, CACHE_TTL.LONG);
      
      return categories;
    } finally {
      client.release();
    }
  }

  private mapPromoBanner(row: any): PromoBanner {
    return {
      id: row.id,
      placement: row.placement,
      name: row.name,
      headline: row.headline,
      body: row.body,
      ctaText: row.cta_text,
      targetUrl: row.target_url,
      variant: row.variant,
      showLogo: row.show_logo,
      showAppBadges: row.show_app_badges,
      isActive: row.is_active,
      impressions: row.impressions,
      clicks: row.clicks,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async getPromoBanners(activeOnly = false): Promise<PromoBanner[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM promo_banners ${activeOnly ? 'WHERE is_active = true' : ''} ORDER BY placement, id`
      );
      return result.rows.map(row => this.mapPromoBanner(row));
    } finally {
      client.release();
    }
  }

  async getActivePromoBannersByPlacement(placement: string): Promise<PromoBanner[]> {
    const cacheKey = getCacheKey('promo-banners', placement);
    const cached = cache.get<PromoBanner[]>(cacheKey);
    if (cached) return cached;

    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM promo_banners WHERE is_active = true AND placement = $1 ORDER BY id',
        [placement]
      );
      const banners = result.rows.map(row => this.mapPromoBanner(row));
      cache.set(cacheKey, banners, 60); // short TTL so admin edits show quickly
      return banners;
    } finally {
      client.release();
    }
  }

  async createPromoBanner(banner: InsertPromoBanner): Promise<PromoBanner> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const isActive = banner.isActive ?? false;
      if (isActive) {
        // Only one active banner per placement
        await client.query(
          'UPDATE promo_banners SET is_active = false, updated_at = NOW() WHERE placement = $1 AND is_active = true',
          [banner.placement]
        );
      }
      const result = await client.query(
        `INSERT INTO promo_banners (placement, name, headline, body, cta_text, target_url, variant, show_logo, show_app_badges, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          banner.placement,
          banner.name,
          banner.headline,
          banner.body || null,
          banner.ctaText,
          banner.targetUrl || 'https://kidsafetv.com',
          banner.variant || 'card',
          banner.showLogo ?? false,
          banner.showAppBadges ?? false,
          isActive
        ]
      );
      await client.query('COMMIT');
      invalidatePattern('promo-banners');
      return this.mapPromoBanner(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updatePromoBanner(id: number, updates: Partial<InsertPromoBanner>): Promise<PromoBanner | null> {
    const fieldMap: Record<string, string> = {
      placement: 'placement',
      name: 'name',
      headline: 'headline',
      body: 'body',
      ctaText: 'cta_text',
      targetUrl: 'target_url',
      variant: 'variant',
      showLogo: 'show_logo',
      showAppBadges: 'show_app_badges',
      isActive: 'is_active'
    };
    const setParts: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const [key, col] of Object.entries(fieldMap)) {
      if ((updates as any)[key] !== undefined) {
        setParts.push(`${col} = $${i}`);
        values.push((updates as any)[key]);
        i++;
      }
    }
    if (setParts.length === 0) return null;
    setParts.push('updated_at = NOW()');
    values.push(id);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Only one active banner per placement: if this update activates (or moves) an
      // active banner, deactivate any other active banner in the target placement.
      if (updates.isActive === true || updates.placement !== undefined) {
        const current = await client.query('SELECT placement, is_active FROM promo_banners WHERE id = $1', [id]);
        if (current.rows.length) {
          const targetPlacement = updates.placement ?? current.rows[0].placement;
          const willBeActive = updates.isActive ?? current.rows[0].is_active;
          if (willBeActive) {
            await client.query(
              'UPDATE promo_banners SET is_active = false, updated_at = NOW() WHERE placement = $1 AND is_active = true AND id != $2',
              [targetPlacement, id]
            );
          }
        }
      }
      const result = await client.query(
        `UPDATE promo_banners SET ${setParts.join(', ')} WHERE id = $${i} RETURNING *`,
        values
      );
      await client.query('COMMIT');
      invalidatePattern('promo-banners');
      return result.rows.length ? this.mapPromoBanner(result.rows[0]) : null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deletePromoBanner(id: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query('DELETE FROM promo_banners WHERE id = $1', [id]);
      invalidatePattern('promo-banners');
      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  async trackPromoBannerEvent(id: number, event: 'impression' | 'click'): Promise<void> {
    const column = event === 'impression' ? 'impressions' : 'clicks';
    const client = await pool.connect();
    try {
      await client.query(`UPDATE promo_banners SET ${column} = ${column} + 1 WHERE id = $1`, [id]);
    } finally {
      client.release();
    }
  }

  /**
   * Get all unique themes from the database for theme search functionality
   */
  async getAllUniqueThemes(): Promise<string[]> {
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
  }
}

export const catalogStorage = new CatalogStorage();