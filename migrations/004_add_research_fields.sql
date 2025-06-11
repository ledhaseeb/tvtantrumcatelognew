-- First, delete all existing research summaries as they won't be compatible with the new structure
DELETE FROM user_read_research;
DELETE FROM research_summaries;

-- Alter the research_summaries table to match our updated schema
ALTER TABLE research_summaries ALTER COLUMN summary DROP NOT NULL;
ALTER TABLE research_summaries ALTER COLUMN category SET NOT NULL;
ALTER TABLE research_summaries ALTER COLUMN published_date TYPE TEXT;

-- Add new columns for enhanced research content
ALTER TABLE research_summaries ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE research_summaries ADD COLUMN IF NOT EXISTS sub_headline TEXT;
ALTER TABLE research_summaries ADD COLUMN IF NOT EXISTS key_findings TEXT;