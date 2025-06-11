import { Pool } from 'pg';
import { pool } from '../db';

/**
 * Search service for TV shows
 * This service handles all search-related functionality
 * and database operations for TV shows
 */
export class SearchService {
  private pool: Pool;
  
  constructor(dbPool: Pool) {
    this.pool = dbPool;
  }
  
  /**
   * Search for TV shows by name or description
   * @param searchTerm The search term to look for
   * @returns Array of TV shows matching the search term
   */
  async searchShows(searchTerm: string) {
    if (!searchTerm || !searchTerm.trim()) {
      return [];
    }
    
    const client = await this.pool.connect();
    
    try {
      // Simple, reliable SQL search with no ORM complexity
      const result = await client.query(
        `SELECT * FROM tv_shows 
         WHERE name ILIKE $1 OR description ILIKE $1
         ORDER BY name ASC`,
        [`%${searchTerm.trim()}%`]
      );
      
      // Normalize the field names to match the frontend expectations
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        ageRange: row.age_range || '',
        stimulationScore: row.stimulation_score || 0,
        themes: row.themes || [],
        imageUrl: row.image_url,
        network: row.network,
        releaseYear: row.release_year,
        endYear: row.end_year,
        isOngoing: row.is_ongoing,
        seasons: row.seasons,
        availableOn: row.available_on || [],
        interactionLevel: row.interaction_level,
        dialogueIntensity: row.dialogue_intensity,
        soundFrequency: row.sound_frequency,
        episodeLength: row.episode_length || 0,
        creator: row.creator,
        creativityRating: row.creativity_rating,
        subscriberCount: row.subscriber_count,
        videoCount: row.video_count,
        channelId: row.channel_id,
        isYouTubeChannel: row.is_youtube_channel || false,
        publishedAt: row.published_at,
        hasOmdbData: row.has_omdb_data || false,
        hasYoutubeData: row.has_youtube_data || false
      }));
    } finally {
      client.release();
    }
  }
  
  /**
   * Track a search hit in the background
   * @param showId The ID of the show that was found in search
   */
  async trackSearchHit(showId: number) {
    if (!showId) return;
    
    // Run this in the background so it doesn't block the main thread
    setTimeout(async () => {
      try {
        const trackingClient = await this.pool.connect();
        
        try {
          await trackingClient.query(
            `INSERT INTO tv_show_searches (tv_show_id, search_count, last_searched) 
             VALUES ($1, 1, NOW()) 
             ON CONFLICT (tv_show_id) 
             DO UPDATE SET 
               search_count = tv_show_searches.search_count + 1, 
               last_searched = NOW()`, 
            [showId]
          );
        } finally {
          trackingClient.release();
        }
      } catch (e) {
        // Silently ignore any errors in tracking
        console.error('Search tracking error (non-blocking):', e);
      }
    }, 0);
  }
  
  /**
   * Perform a filtered search based on multiple criteria
   * @param filters The filter criteria
   * @returns Array of TV shows matching the filters
   */
  async searchWithFilters(filters: any) {
    const client = await this.pool.connect();
    
    try {
      console.log('Filter query detected:', filters);
      
      // Base query that safely handles all filter combinations
      let query = `SELECT * FROM tv_shows WHERE 1=1`;
      const params: any[] = [];
      let paramIndex = 1;
      
      // Add search filter if present
      if (filters.search) {
        query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }
      
      // Age range filter - filter shows that overlap with the requested age range
      if (filters.ageRangeMin !== undefined && filters.ageRangeMax !== undefined) {
        console.log(`Age range filter applied: ${filters.ageRangeMin}-${filters.ageRangeMax}`);
        
        query += ` AND (
          -- Handle exact matches like "0-2", "3-5", etc.
          (age_range ~ '^[0-9]+-[0-9]+$' AND 
           CAST(SPLIT_PART(age_range, '-', 1) AS INTEGER) <= $${paramIndex + 1} AND 
           CAST(SPLIT_PART(age_range, '-', 2) AS INTEGER) >= $${paramIndex})
          
          -- Handle ranges with "+" like "13+"
          OR (age_range ~ '^[0-9]+\\+$' AND 
              CAST(REGEXP_REPLACE(age_range, '[^0-9]', '', 'g') AS INTEGER) <= $${paramIndex + 1})
          
          -- Handle "Any Age" or similar broad categories
          OR (age_range ILIKE '%any%' OR age_range ILIKE '%all%')
        )`;
        
        params.push(filters.ageRangeMin, filters.ageRangeMax);
        paramIndex += 2;
      }
      
      // Stimulation score range filter
      if (filters.stimulationScoreRange) {
        const range = typeof filters.stimulationScoreRange === 'string' 
          ? JSON.parse(filters.stimulationScoreRange) 
          : filters.stimulationScoreRange;
        console.log('Stimulation score range filter applied:', range);
        query += ` AND stimulation_score >= $${paramIndex} AND stimulation_score <= $${paramIndex + 1}`;
        params.push(range.min, range.max);
        paramIndex += 2;
      }
      
      // Interaction level filter (updated field name)
      if (filters.interactionLevel && filters.interactionLevel !== 'Any') {
        console.log('Filtering by interaction level:', filters.interactionLevel);
        
        if (filters.interactionLevel === 'High') {
          query += ` AND (interactivity_level = $${paramIndex} OR interactivity_level ILIKE $${paramIndex + 1} OR interactivity_level ILIKE $${paramIndex + 2})`;
          params.push('High', '%High%', '%to High%');
          paramIndex += 3;
        } else {
          query += ` AND interactivity_level = $${paramIndex}`;
          params.push(filters.interactionLevel);
          paramIndex++;
        }
      }
      
      if (filters.dialogueIntensity) {
        query += ` AND dialogue_intensity = $${paramIndex}`;
        params.push(filters.dialogueIntensity);
        paramIndex++;
      }
      
      if (filters.soundFrequency) {
        query += ` AND sound_frequency = $${paramIndex}`;
        params.push(filters.soundFrequency);
        paramIndex++;
      }
      
      // Sort filter - apply appropriate sorting
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'name':
            query += ` ORDER BY LOWER(name) ASC`;
            break;
          case 'newest':
            query += ` ORDER BY release_year DESC NULLS LAST`;
            break;
          case 'oldest':
            query += ` ORDER BY release_year ASC NULLS LAST`;
            break;
          case 'stimulation-score':
            query += ` ORDER BY stimulation_score ASC NULLS LAST`;
            break;
          case 'interactivity-level':
            query += ` ORDER BY interactivity_level DESC NULLS LAST`;
            break;
          case 'popular':
            // For popularity-based sorting, we'll handle this post-query
            query += ` ORDER BY LOWER(name) ASC`;
            break;
          case 'rating':
          case 'rating_desc':
          case 'overall-rating':
            // For rating-based sorting, we'll handle this post-query
            query += ` ORDER BY LOWER(name) ASC`;
            break;
          default:
            query += ` ORDER BY LOWER(name) ASC`;
        }
      } else {
        // Default sort
        query += ` ORDER BY LOWER(name) ASC`;
      }
      
      // Execute the query
      const result = await client.query(query, params);
      
      console.log(`Interaction level filter returned ${result.rows.length} shows`);
      
      // Process the results for theme filtering if necessary
      let shows = result.rows;
      
      // Handle popularity-based sorting (post-query with view and search data)
      if (filters.sortBy === 'popular') {
        console.log(`Search Service: Starting popularity-based sorting`);
        try {
          // Get view statistics for all shows
          const viewStats = await client.query(`
            SELECT tv_show_id, view_count FROM tv_show_views
          `);
          
          // Get search statistics for all shows
          const searchStats = await client.query(`
            SELECT tv_show_id, search_count FROM tv_show_searches
          `);
          
          console.log(`Search Service: Found ${viewStats.rows.length} shows with views, ${searchStats.rows.length} shows with searches`);
          
          // Create maps for popularity data
          const viewMap = new Map();
          const searchMap = new Map();
          
          viewStats.rows.forEach(row => {
            viewMap.set(row.tv_show_id, parseInt(row.view_count) || 0);
          });
          
          searchStats.rows.forEach(row => {
            searchMap.set(row.tv_show_id, parseInt(row.search_count) || 0);
          });
          
          // Sort shows by popularity score (views * 2 + searches)
          shows.sort((a, b) => {
            const aViews = viewMap.get(a.id) || 0;
            const aSearches = searchMap.get(a.id) || 0;
            const aPopularity = (aViews * 2) + aSearches; // Weight views more heavily
            
            const bViews = viewMap.get(b.id) || 0;
            const bSearches = searchMap.get(b.id) || 0;
            const bPopularity = (bViews * 2) + bSearches;
            
            return bPopularity - aPopularity; // Descending order (highest first)
          });
          
          console.log(`Search Service: Applied popularity-based sorting to ${shows.length} shows`);
          // Log the first few shows after sorting
          const topShows = shows.slice(0, 5).map(show => {
            const views = viewMap.get(show.id) || 0;
            const searches = searchMap.get(show.id) || 0;
            const popularity = (views * 2) + searches;
            return `${show.name} (${views} views, ${searches} searches, score: ${popularity})`;
          });
          console.log(`Search Service: Top 5 popular shows: ${topShows.join(', ')}`);
        } catch (error) {
          console.error('Search Service: Error applying popularity-based sorting:', error);
          // Continue with default sorting if popularity sort fails
        }
      }
      
      // Handle rating-based sorting (post-query with review data)
      if (filters.sortBy === 'rating' || filters.sortBy === 'rating_desc' || filters.sortBy === 'overall-rating') {
        console.log(`Search Service: Starting rating-based sorting for sortBy: ${filters.sortBy}`);
        try {
          // Get review statistics for all shows
          const reviewStats = await client.query(`
            SELECT 
              tv_show_id,
              AVG(rating) as avg_rating,
              COUNT(rating) as review_count
            FROM tv_show_reviews 
            GROUP BY tv_show_id
          `);
          
          console.log(`Search Service: Found ${reviewStats.rows.length} shows with reviews`);
          
          // Create a map of show ratings
          const ratingMap = new Map();
          reviewStats.rows.forEach(row => {
            const avgRating = parseFloat(row.avg_rating) || 0;
            const reviewCount = parseInt(row.review_count) || 0;
            ratingMap.set(row.tv_show_id, {
              avgRating,
              reviewCount
            });
            console.log(`Search Service: Show ID ${row.tv_show_id}: ${avgRating} stars (${reviewCount} reviews)`);
          });
          
          // Sort shows by rating (highest first)
          shows.sort((a, b) => {
            const aStats = ratingMap.get(a.id) || { avgRating: 0, reviewCount: 0 };
            const bStats = ratingMap.get(b.id) || { avgRating: 0, reviewCount: 0 };
            
            // Sort by average rating first, then by review count as tiebreaker
            if (bStats.avgRating !== aStats.avgRating) {
              return bStats.avgRating - aStats.avgRating;
            }
            return bStats.reviewCount - aStats.reviewCount;
          });
          
          console.log(`Search Service: Applied rating-based sorting to ${shows.length} shows`);
          // Log the first few shows after sorting
          const topShows = shows.slice(0, 5).map(show => {
            const stats = ratingMap.get(show.id) || { avgRating: 0, reviewCount: 0 };
            return `${show.name} (${stats.avgRating} stars, ${stats.reviewCount} reviews)`;
          });
          console.log(`Search Service: Top 5 shows after rating sort: ${topShows.join(', ')}`);
        } catch (error) {
          console.error('Search Service: Error applying rating-based sorting:', error);
          // Continue with default sorting if rating sort fails
        }
      }
      
      // Handle theme filtering (post-query for better control)
      if (filters.themes && filters.themes.length > 0) {
        const themeMatchMode = ('themeMatchMode' in filters) ? (filters.themeMatchMode || 'AND') : 'AND';
        const searchThemes = Array.isArray(filters.themes) 
          ? filters.themes.map((theme: string) => theme.trim())
          : [filters.themes.trim()];
          
        if (themeMatchMode === 'AND') {
          // All themes must match
          shows = shows.filter((show: any) => {
            const showThemes = show.themes || [];
            return searchThemes.every((theme: string) => {
              return showThemes.some((showTheme: string) => 
                showTheme.toLowerCase() === theme.toLowerCase()
              );
            });
          });
        } else {
          // Any of the themes can match (OR)
          shows = shows.filter((show: any) => {
            const showThemes = show.themes || [];
            return searchThemes.some((theme: string) => {
              return showThemes.some((showTheme: string) => 
                showTheme.toLowerCase() === theme.toLowerCase()
              );
            });
          });
        }
      }
      
      // Normalize the field names to match the frontend expectations (same as search function)
      return shows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        ageRange: row.age_range || '',
        stimulationScore: row.stimulation_score || 0,
        themes: row.themes || [],
        imageUrl: row.image_url,
        network: row.network,
        releaseYear: row.release_year,
        endYear: row.end_year,
        isOngoing: row.is_ongoing,
        seasons: row.seasons,
        availableOn: row.available_on || [],
        interactionLevel: row.interaction_level,
        dialogueIntensity: row.dialogue_intensity,
        soundFrequency: row.sound_frequency,
        episodeLength: row.episode_length || 0,
        creator: row.creator,
        creativityRating: row.creativity_rating,
        subscriberCount: row.subscriber_count,
        videoCount: row.video_count,
        channelId: row.channel_id,
        isYouTubeChannel: row.is_youtube_channel || false,
        publishedAt: row.published_at,
        hasOmdbData: row.has_omdb_data || false,
        hasYoutubeData: row.has_youtube_data || false
      }));
    } finally {
      client.release();
    }
  }
}

// Create and export a singleton instance
export const searchService = new SearchService(pool);