BEGIN;

DO $$
DECLARE
  target_table TEXT;
  target_constraint TEXT;
  existing_constraint RECORD;
  source_relation REGCLASS;
  users_relation REGCLASS;
  source_column SMALLINT;
  user_id_column SMALLINT;
BEGIN
  users_relation := to_regclass(format('%I.%I', current_schema(), 'users'));

  FOR target_table, target_constraint IN
    SELECT * FROM (VALUES
      ('health_profiles', 'health_profiles_customer_id_fkey'),
      ('nutrition_diary', 'nutrition_diary_customer_id_fkey'),
      ('water_logs', 'water_logs_customer_id_fkey')
    ) AS targets(table_name, constraint_name)
  LOOP
    source_relation := to_regclass(format('%I.%I', current_schema(), target_table));
    SELECT attnum INTO source_column
      FROM pg_attribute
      WHERE attrelid = source_relation AND attname = 'customer_id' AND NOT attisdropped;
    SELECT attnum INTO user_id_column
      FROM pg_attribute
      WHERE attrelid = users_relation AND attname = 'id' AND NOT attisdropped;

    IF source_relation IS NULL OR source_column IS NULL OR users_relation IS NULL OR user_id_column IS NULL THEN
      RAISE EXCEPTION 'Missing table or column required for personal feature ownership.';
    END IF;

    FOR existing_constraint IN
      SELECT constraint_row.conname
        FROM pg_constraint AS constraint_row
        WHERE constraint_row.contype = 'f'
          AND constraint_row.conrelid = source_relation
          AND source_column = ANY(constraint_row.conkey)
          AND NOT (
            constraint_row.confrelid = users_relation
            AND constraint_row.conkey = ARRAY[source_column]::SMALLINT[]
            AND constraint_row.confkey = ARRAY[user_id_column]::SMALLINT[]
          )
    LOOP
      EXECUTE format(
        'ALTER TABLE %I.%I DROP CONSTRAINT %I',
        current_schema(), target_table, existing_constraint.conname
      );
    END LOOP;

    IF NOT EXISTS (
      SELECT 1
        FROM pg_constraint AS constraint_row
        WHERE constraint_row.contype = 'f'
          AND constraint_row.conrelid = source_relation
          AND constraint_row.confrelid = users_relation
          AND constraint_row.conkey = ARRAY[source_column]::SMALLINT[]
          AND constraint_row.confkey = ARRAY[user_id_column]::SMALLINT[]
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I(id) ON DELETE CASCADE',
        current_schema(), target_table, target_constraint, 'customer_id', 'users'
      );
    END IF;
  END LOOP;
END
$$;

COMMIT;
