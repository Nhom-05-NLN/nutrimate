DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'order_items'
      AND column_name = 'is_ai_combo'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'order_items'
      AND column_name = 'is_ai_recommended'
  ) THEN
    ALTER TABLE order_items RENAME COLUMN is_ai_combo TO is_ai_recommended;
  ELSE
    ALTER TABLE order_items
      ADD COLUMN IF NOT EXISTS is_ai_recommended BOOLEAN NOT NULL DEFAULT FALSE;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'order_items'
        AND column_name = 'is_ai_combo'
    ) THEN
      UPDATE order_items
      SET is_ai_recommended = TRUE
      WHERE is_ai_combo = TRUE;
    END IF;
  END IF;
END
$$;
