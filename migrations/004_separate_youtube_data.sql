-- Migration: Separate YouTube Channel Data
-- This migration creates a dedicated table for YouTube-specific data

-- Create a dedicated table for YouTube channel data
CREATE TABLE youtube_channels (
  id SERIAL PRIMARY KEY,
  tv_show_id INTEGER NOT NULL REFERENCES tv_shows(id) ON DELETE CASCADE,
  channel_id TEXT,
  subscriber_count TEXT,
  video_count TEXT,
  published_at TEXT,
  UNIQUE(tv_show_id)
);

-- Migrate existing YouTube data from tv_shows to youtube_channels
INSERT INTO youtube_channels (
  tv_show_id, 
  channel_id, 
  subscriber_count, 
  video_count,
  published_at
)
SELECT 
  id, 
  channel_id, 
  subscriber_count, 
  video_count,
  published_at
FROM tv_shows
WHERE is_youtube_channel = TRUE 
  OR channel_id IS NOT NULL 
  OR subscriber_count IS NOT NULL;

-- We'll keep the original columns temporarily for backward compatibility
-- and drop them in a later migration after updating application code

-- Output message when migration is complete
DO $$
BEGIN
  RAISE NOTICE 'YouTube channel data separated successfully';
END $$;