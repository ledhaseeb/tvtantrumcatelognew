-- Add YouTube-specific columns to the tv_shows table
ALTER TABLE tv_shows
ADD COLUMN subscriber_count TEXT,
ADD COLUMN video_count TEXT,
ADD COLUMN channel_id TEXT,
ADD COLUMN is_youtube_channel BOOLEAN DEFAULT FALSE,
ADD COLUMN published_at TEXT;

-- Add comment to explain purpose of these columns
COMMENT ON COLUMN tv_shows.subscriber_count IS 'YouTube channel subscriber count';
COMMENT ON COLUMN tv_shows.video_count IS 'Number of videos on the YouTube channel';
COMMENT ON COLUMN tv_shows.channel_id IS 'YouTube channel ID for direct linking';
COMMENT ON COLUMN tv_shows.is_youtube_channel IS 'Flag to identify shows that are YouTube channels';
COMMENT ON COLUMN tv_shows.published_at IS 'Original channel creation date from YouTube';