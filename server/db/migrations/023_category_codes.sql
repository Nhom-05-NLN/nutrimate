BEGIN;
SELECT pg_advisory_xact_lock(hashtext('nutrimate.category.codes'));
LOCK TABLE categories IN ACCESS EXCLUSIVE MODE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS code VARCHAR(7);
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM categories) > 999 THEN
    RAISE EXCEPTION 'CAT-xxx supports at most 999 category codes';
  END IF;
  IF EXISTS (SELECT 1 FROM categories WHERE code IS NULL OR code !~ '^CAT-[0-9]{3}$') THEN
    UPDATE categories SET code = NULL;
    WITH numbered AS (SELECT category_id,ROW_NUMBER() OVER (ORDER BY category_id) AS n FROM categories)
    UPDATE categories c SET code = 'CAT-' || LPAD(n.n::text,3,'0')
    FROM numbered n WHERE n.category_id=c.category_id;
  END IF;
END $$;
ALTER TABLE categories ALTER COLUMN code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS categories_code_unique ON categories(code);

-- Used codes remain here after category deletion, so they cannot be reused.
CREATE TABLE IF NOT EXISTS category_code_allocations (
  code VARCHAR(7) PRIMARY KEY CHECK (code ~ '^CAT-[0-9]{3}$'),
  token UUID UNIQUE,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ
);
INSERT INTO category_code_allocations (code,used)
SELECT code,TRUE FROM categories ON CONFLICT (code) DO UPDATE SET used=TRUE,token=NULL,expires_at=NULL;
COMMIT;
