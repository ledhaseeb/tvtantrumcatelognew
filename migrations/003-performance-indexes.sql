-- Performance indexes for viral traffic optimization
-- These indexes will dramatically speed up the slow queries causing 2+ second response times

-- Index for age range filtering (most common filter)
CREATE INDEX IF NOT EXISTS idx_catalog_tv_shows_age_range ON catalog_tv_shows(age_range);

-- Index for stimulation score filtering  
CREATE INDEX IF NOT EXISTS idx_catalog_tv_shows_stimulation_score ON catalog_tv_shows(stimulation_score);

-- GIN index for themes array operations (AND/OR filtering)
CREATE INDEX IF NOT EXISTS idx_catalog_tv_shows_themes_gin ON catalog_tv_shows USING GIN(themes);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_catalog_tv_shows_composite ON catalog_tv_shows(age_range, stimulation_score);

-- Index for featured shows
CREATE INDEX IF NOT EXISTS idx_catalog_tv_shows_featured ON catalog_tv_shows(is_featured) WHERE is_featured = true;

-- Index for homepage categories active status
CREATE INDEX IF NOT EXISTS idx_homepage_categories_active ON homepage_categories(is_active) WHERE is_active = true;

-- Analyze tables to update statistics for query planner
ANALYZE catalog_tv_shows;
ANALYZE homepage_categories;