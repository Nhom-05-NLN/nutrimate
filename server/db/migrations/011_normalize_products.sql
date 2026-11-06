-- Execute as one transaction. Existing nutrition_facts are authoritative.
BEGIN;
LOCK TABLE products IN ACCESS EXCLUSIVE MODE;

-- Preserve removed values, including historical rating summaries, for recovery.
CREATE TABLE products_legacy_backup_011 AS TABLE products;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM products WHERE id IS DISTINCT FROM product_id) THEN
    RAISE EXCEPTION 'Product IDs differ: resolve references before normalizing products';
  END IF;
  IF EXISTS (SELECT 1 FROM products WHERE price IS NULL OR price < 0) THEN
    RAISE EXCEPTION 'Products contain invalid prices';
  END IF;
END $$;

UPDATE products p
SET category_id = c.category_id
FROM categories c
WHERE p.category_id IS NULL AND c.slug = p.category;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM products p LEFT JOIN categories c ON c.category_id = p.category_id
    WHERE c.category_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Products without a valid category require manual mapping';
  END IF;
END $$;

INSERT INTO nutrition_facts (
  product_id, serving_size, calories, protein, carbs, fat, sugar, fiber, sodium
)
SELECT product_id, COALESCE(serving_size, '1 khẩu phần'), COALESCE(calories, 0),
       COALESCE(protein, 0), COALESCE(carbs, 0), COALESCE(fat, 0),
       COALESCE(sugar, 0), COALESCE(fiber, 0), COALESCE(sodium, 0)
FROM products
ON CONFLICT (product_id) DO NOTHING;

ALTER TABLE products ALTER COLUMN price SET NOT NULL;
ALTER TABLE products
  DROP COLUMN id,
  DROP COLUMN base_price,
  DROP COLUMN is_active,
  DROP COLUMN category,
  DROP COLUMN category_name,
  DROP COLUMN serving_size,
  DROP COLUMN calories,
  DROP COLUMN protein,
  DROP COLUMN carbs,
  DROP COLUMN fat,
  DROP COLUMN sugar,
  DROP COLUMN fiber,
  DROP COLUMN sodium,
  DROP COLUMN rating,
  DROP COLUMN review_count;

COMMENT ON TABLE products IS 'Product identity, price, status and category reference. Nutrition and reviews live in their own tables.';
COMMIT;
