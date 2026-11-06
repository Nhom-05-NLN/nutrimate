ALTER TABLE users
  ADD COLUMN IF NOT EXISTS diet_preferences JSONB NOT NULL DEFAULT '[]'::jsonb;
