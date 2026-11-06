-- Allow both Customers and Admins to own their private NutriBot image records.
BEGIN;

DO $$
DECLARE
  image_table REGCLASS := to_regclass(format('%I.%I', current_schema(), 'nutrition_images'));
  users_table REGCLASS := to_regclass(format('%I.%I', current_schema(), 'users'));
  customer_column SMALLINT;
  user_id_column SMALLINT;
  existing_constraint RECORD;
BEGIN
  SELECT attnum INTO customer_column
  FROM pg_attribute
  WHERE attrelid = image_table AND attname = 'customer_id' AND NOT attisdropped;

  SELECT attnum INTO user_id_column
  FROM pg_attribute
  WHERE attrelid = users_table AND attname = 'id' AND NOT attisdropped;

  IF image_table IS NULL OR users_table IS NULL OR customer_column IS NULL OR user_id_column IS NULL THEN
    RAISE EXCEPTION 'Missing nutrition_images.customer_id or users.id required for image ownership.';
  END IF;

  FOR existing_constraint IN
    SELECT conname
    FROM pg_constraint
    WHERE contype = 'f'
      AND conrelid = image_table
      AND customer_column = ANY(conkey)
      AND NOT (
        confrelid = users_table
        AND conkey = ARRAY[customer_column]::SMALLINT[]
        AND confkey = ARRAY[user_id_column]::SMALLINT[]
      )
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I DROP CONSTRAINT %I',
      current_schema(), 'nutrition_images', existing_constraint.conname
    );
  END LOOP;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE contype = 'f'
      AND conrelid = image_table
      AND confrelid = users_table
      AND conkey = ARRAY[customer_column]::SMALLINT[]
      AND confkey = ARRAY[user_id_column]::SMALLINT[]
  ) THEN
    EXECUTE format(
      'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I(%I) ON DELETE CASCADE',
      current_schema(), 'nutrition_images', 'fk_nutrition_image_customer',
      'customer_id', 'users', 'id'
    );
  END IF;
END
$$;

COMMIT;
