-- Migration: Create Junction Tables for Themes and Platforms
-- This migration replaces text array columns with proper junction tables

-- Create themes table
CREATE TABLE themes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Create platforms table
CREATE TABLE platforms (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Create junction tables
CREATE TABLE tv_show_themes (
  id SERIAL PRIMARY KEY,
  tv_show_id INTEGER NOT NULL REFERENCES tv_shows(id) ON DELETE CASCADE,
  theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  UNIQUE(tv_show_id, theme_id)
);

CREATE TABLE tv_show_platforms (
  id SERIAL PRIMARY KEY,
  tv_show_id INTEGER NOT NULL REFERENCES tv_shows(id) ON DELETE CASCADE,
  platform_id INTEGER NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  UNIQUE(tv_show_id, platform_id)
);

-- Migrate existing theme data
-- First, extract all unique themes from the tv_shows table
DO $$
DECLARE
  theme_record RECORD;
  theme_name TEXT;
  theme_id INTEGER;
  show_record RECORD;
BEGIN
  -- Insert unique themes
  FOR theme_record IN 
    SELECT DISTINCT unnest(themes) AS theme_name FROM tv_shows WHERE themes IS NOT NULL
  LOOP
    theme_name := theme_record.theme_name;
    INSERT INTO themes (name) VALUES (theme_name);
  END LOOP;

  -- Create junction table entries for each show's themes
  FOR show_record IN 
    SELECT id, unnest(themes) AS theme_name FROM tv_shows WHERE themes IS NOT NULL
  LOOP
    SELECT id INTO theme_id FROM themes WHERE name = show_record.theme_name;
    IF theme_id IS NOT NULL THEN
      INSERT INTO tv_show_themes (tv_show_id, theme_id) 
      VALUES (show_record.id, theme_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- Migrate existing platform data
-- Extract all unique platforms from the tv_shows table
DO $$
DECLARE
  platform_record RECORD;
  platform_name TEXT;
  platform_id INTEGER;
  show_record RECORD;
BEGIN
  -- Insert unique platforms
  FOR platform_record IN 
    SELECT DISTINCT unnest(available_on) AS platform_name FROM tv_shows WHERE available_on IS NOT NULL
  LOOP
    platform_name := platform_record.platform_name;
    INSERT INTO platforms (name) VALUES (platform_name);
  END LOOP;

  -- Create junction table entries for each show's platforms
  FOR show_record IN 
    SELECT id, unnest(available_on) AS platform_name FROM tv_shows WHERE available_on IS NOT NULL
  LOOP
    SELECT id INTO platform_id FROM platforms WHERE name = show_record.platform_name;
    IF platform_id IS NOT NULL THEN
      INSERT INTO tv_show_platforms (tv_show_id, platform_id) 
      VALUES (show_record.id, platform_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- No need to drop the original array columns yet, we'll keep them temporarily for backward compatibility
-- Until we update the application code to use the new tables

-- Output message when migration is complete
DO $$
BEGIN
  RAISE NOTICE 'Junction tables created successfully';
END $$;