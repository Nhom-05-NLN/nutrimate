-- Preview codes are read from products/categories without reserving them.
-- Save operations allocate codes under transaction advisory locks.
-- Preserve existing codes and enforce uniqueness on the main product table.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('nutrimate.product-sku-allocation'));
SELECT pg_advisory_xact_lock(hashtext('nutrimate.category.codes'));
CREATE UNIQUE INDEX IF NOT EXISTS products_code_unique ON products (UPPER(code));
DROP TABLE IF EXISTS product_sku_reservations;
DROP TABLE IF EXISTS category_code_allocations;
COMMIT;
