BEGIN;
SELECT pg_advisory_xact_lock(hashtext('nutrimate.product-sku-allocation'));
LOCK TABLE products IN ACCESS EXCLUSIVE MODE;

CREATE TABLE IF NOT EXISTS product_sku_reservations (
  sku VARCHAR(11) PRIMARY KEY CHECK (sku ~ '^NM-PRD-[0-9]{4}$'),
  token UUID NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
);

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM products) > 9999 THEN
    RAISE EXCEPTION 'SKU format supports at most 9999 products';
  END IF;
  IF EXISTS (SELECT 1 FROM products WHERE code IS NULL OR code !~ '^NM-PRD-[0-9]{4}$') THEN
    DELETE FROM product_sku_reservations;
    UPDATE products SET code = '__SKU_MIGRATION__' || product_id::text;
    WITH numbered AS (
      SELECT product_id, ROW_NUMBER() OVER (ORDER BY product_id) AS position FROM products
    )
    UPDATE products p SET code = 'NM-PRD-' || LPAD(n.position::text, 4, '0')
    FROM numbered n WHERE n.product_id = p.product_id;
  END IF;
END $$;

DROP SEQUENCE IF EXISTS product_sku_sequence;
COMMIT;
