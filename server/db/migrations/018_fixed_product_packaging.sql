BEGIN;

ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(50) NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS package_size VARCHAR(100) NOT NULL DEFAULT '';

-- Preserve cart, inventory and order rows while removing obsolete references.
DO $$
BEGIN
  IF to_regclass('public.product_variants') IS NOT NULL THEN
    UPDATE inventory i SET product_id = v.product_id
    FROM product_variants v
    WHERE i.variant_id = v.variant_id AND i.product_id IS NULL;
  END IF;
END $$;

ALTER TABLE cart_items DROP COLUMN IF EXISTS variant_id;
ALTER TABLE inventory DROP COLUMN IF EXISTS variant_id;
ALTER TABLE order_items DROP COLUMN IF EXISTS variant_id;
ALTER TABLE order_items DROP COLUMN IF EXISTS variant_name;
DROP TABLE IF EXISTS product_variants;

COMMIT;
