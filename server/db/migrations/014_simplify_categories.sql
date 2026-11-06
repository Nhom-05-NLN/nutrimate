BEGIN;

-- Keep category_id as the existing primary key and preserve product references.
-- No CASCADE: dependencies must be addressed explicitly.
ALTER TABLE categories
  DROP COLUMN IF EXISTS id,
  DROP COLUMN IF EXISTS slug,
  DROP COLUMN IF EXISTS diet_type,
  DROP COLUMN IF EXISTS icon,
  DROP COLUMN IF EXISTS sort_order;

COMMIT;
