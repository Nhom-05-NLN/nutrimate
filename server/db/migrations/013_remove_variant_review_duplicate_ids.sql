BEGIN;

-- Canonical primary keys remain variant_id and review_id.
-- No CASCADE: abort rather than remove any unexpected dependent objects.
ALTER TABLE product_variants DROP COLUMN IF EXISTS id;
ALTER TABLE product_reviews DROP COLUMN IF EXISTS id;

COMMIT;
