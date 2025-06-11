-- Migration: Add Foreign Key Constraints
-- This migration adds foreign key constraints to ensure referential integrity

-- First, clean up orphaned records that would violate foreign key constraints

-- Delete orphaned records from tv_show_searches
DELETE FROM tv_show_searches
WHERE tv_show_id NOT IN (SELECT id FROM tv_shows);

-- Delete orphaned records from tv_show_reviews
DELETE FROM tv_show_reviews
WHERE tv_show_id NOT IN (SELECT id FROM tv_shows);

-- Delete orphaned records from favorites
DELETE FROM favorites
WHERE tv_show_id NOT IN (SELECT id FROM tv_shows);

DELETE FROM favorites
WHERE user_id NOT IN (SELECT id FROM users);

-- Now add the foreign key constraints

-- Add foreign keys to favorites table
ALTER TABLE favorites 
  ADD CONSTRAINT fk_favorites_user 
  FOREIGN KEY (user_id) REFERENCES users(id) 
  ON DELETE CASCADE;

ALTER TABLE favorites 
  ADD CONSTRAINT fk_favorites_tv_show 
  FOREIGN KEY (tv_show_id) REFERENCES tv_shows(id) 
  ON DELETE CASCADE;

-- Add foreign keys to tv_show_reviews table  
ALTER TABLE tv_show_reviews 
  ADD CONSTRAINT fk_reviews_tv_show 
  FOREIGN KEY (tv_show_id) REFERENCES tv_shows(id) 
  ON DELETE CASCADE;

-- Add foreign keys to tv_show_searches table
ALTER TABLE tv_show_searches 
  ADD CONSTRAINT fk_searches_tv_show 
  FOREIGN KEY (tv_show_id) REFERENCES tv_shows(id) 
  ON DELETE CASCADE;

-- Output message when migration is complete
DO $$
BEGIN
  RAISE NOTICE 'Foreign key constraints added successfully';
END $$;