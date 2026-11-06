BEGIN;

ALTER TABLE products
  DROP COLUMN IF EXISTS best_for,
  DROP COLUMN IF EXISTS is_featured,
  DROP COLUMN IF EXISTS badges,
  DROP COLUMN IF EXISTS original_price,
  DROP COLUMN IF EXISTS slug;

-- Exact backup name requested. No CASCADE: unexpected dependencies abort.
DROP TABLE IF EXISTS products_legacy_backup_011;

COMMIT;
