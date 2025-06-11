-- Migration: Separate Search and View Tracking
-- This migration separates search counts and view counts into distinct tables for better analytics

-- Create a new table for view tracking
CREATE TABLE tv_show_views (
  id SERIAL PRIMARY KEY,
  tv_show_id INTEGER NOT NULL REFERENCES tv_shows(id) ON DELETE CASCADE,
  view_count INTEGER NOT NULL DEFAULT 1,
  last_viewed TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Migrate view data from the combined table
INSERT INTO tv_show_views (
  tv_show_id,
  view_count,
  last_viewed
)
SELECT 
  tv_show_id,
  view_count,
  last_viewed
FROM tv_show_searches
WHERE view_count > 0;

-- Rename the existing table to clarify its purpose and drop the view-related columns
ALTER TABLE tv_show_searches RENAME TO tv_show_searches_old;

-- Create a new searches table without the view columns
CREATE TABLE tv_show_searches (
  id SERIAL PRIMARY KEY,
  tv_show_id INTEGER NOT NULL REFERENCES tv_shows(id) ON DELETE CASCADE,
  search_count INTEGER NOT NULL DEFAULT 1,
  last_searched TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Migrate search data
INSERT INTO tv_show_searches (
  tv_show_id,
  search_count,
  last_searched
)
SELECT 
  tv_show_id,
  search_count,
  last_searched
FROM tv_show_searches_old;

-- Drop the old table once data is migrated
DROP TABLE tv_show_searches_old;

-- Output message when migration is complete
DO $$
BEGIN
  RAISE NOTICE 'Search and view tracking separated successfully';
END $$;