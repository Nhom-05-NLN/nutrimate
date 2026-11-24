BEGIN;

ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(50) NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS package_size VARCHAR(100) NOT NULL DEFAULT '';

-- Remove obsolete variant references from carts and orders.
ALTER TABLE cart_items DROP COLUMN IF EXISTS variant_id;
ALTER TABLE order_items DROP COLUMN IF EXISTS variant_id;
ALTER TABLE order_items DROP COLUMN IF EXISTS variant_name;
DROP TABLE IF EXISTS product_variants;

COMMIT;
