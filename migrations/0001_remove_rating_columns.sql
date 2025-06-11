-- Migration to remove unused rating columns from tv_shows table
ALTER TABLE tv_shows 
  DROP COLUMN IF EXISTS friendship_rating,
  DROP COLUMN IF EXISTS problem_solving_rating,
  DROP COLUMN IF EXISTS relatable_situations_rating,
  DROP COLUMN IF EXISTS emotional_intelligence_rating,
  DROP COLUMN IF EXISTS educational_value_rating,
  DROP COLUMN IF EXISTS overall_rating;