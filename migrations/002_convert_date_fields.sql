-- Migration: Convert Text Date Fields to Timestamp
-- This migration converts date fields from text to proper timestamp types

-- First, create temporary columns with the correct type
ALTER TABLE users ADD COLUMN created_at_timestamp TIMESTAMP;
ALTER TABLE favorites ADD COLUMN created_at_timestamp TIMESTAMP;
ALTER TABLE tv_show_reviews ADD COLUMN created_at_timestamp TIMESTAMP;
ALTER TABLE tv_show_searches ADD COLUMN last_searched_timestamp TIMESTAMP;
ALTER TABLE tv_show_searches ADD COLUMN last_viewed_timestamp TIMESTAMP;

-- Copy data from text columns to timestamp columns
UPDATE users SET created_at_timestamp = created_at::TIMESTAMP;
UPDATE favorites SET created_at_timestamp = created_at::TIMESTAMP;
UPDATE tv_show_reviews SET created_at_timestamp = created_at::TIMESTAMP;
UPDATE tv_show_searches SET last_searched_timestamp = last_searched::TIMESTAMP;
UPDATE tv_show_searches SET last_viewed_timestamp = last_viewed::TIMESTAMP WHERE last_viewed IS NOT NULL;

-- Drop the old text columns
ALTER TABLE users DROP COLUMN created_at;
ALTER TABLE favorites DROP COLUMN created_at;
ALTER TABLE tv_show_reviews DROP COLUMN created_at;
ALTER TABLE tv_show_searches DROP COLUMN last_searched;
ALTER TABLE tv_show_searches DROP COLUMN last_viewed;

-- Rename the timestamp columns to the original names
ALTER TABLE users RENAME COLUMN created_at_timestamp TO created_at;
ALTER TABLE favorites RENAME COLUMN created_at_timestamp TO created_at;
ALTER TABLE tv_show_reviews RENAME COLUMN created_at_timestamp TO created_at;
ALTER TABLE tv_show_searches RENAME COLUMN last_searched_timestamp TO last_searched;
ALTER TABLE tv_show_searches RENAME COLUMN last_viewed_timestamp TO last_viewed;

-- Add NOT NULL constraints and defaults where appropriate
ALTER TABLE users ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE users ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE favorites ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE favorites ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE tv_show_reviews ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE tv_show_reviews ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE tv_show_searches ALTER COLUMN last_searched SET NOT NULL;
ALTER TABLE tv_show_searches ALTER COLUMN last_searched SET DEFAULT CURRENT_TIMESTAMP;

-- Output message when migration is complete
DO $$
BEGIN
  RAISE NOTICE 'Date fields converted to timestamp type successfully';
END $$;