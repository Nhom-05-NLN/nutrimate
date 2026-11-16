BEGIN;
ALTER TABLE nutrition_facts DROP COLUMN IF EXISTS serving_size;
COMMIT;
