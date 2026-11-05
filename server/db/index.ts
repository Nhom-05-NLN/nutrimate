import pg, { QueryResult, QueryResultRow } from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

let poolInstance: pg.Pool | null = null;
let isConnected = false;

export function getPool(): pg.Pool {
  if (!poolInstance) {
    const poolConfig: pg.PoolConfig = config.db.connectionString
      ? {
          connectionString: config.db.connectionString,
          ssl: config.db.ssl,
          max: config.db.max,
          connectionTimeoutMillis: config.db.connectionTimeoutMillis,
        }
      : {
          host: config.db.host,
          port: config.db.port,
          user: config.db.user,
          password: config.db.password,
          database: config.db.database,
          ssl: config.db.ssl,
          max: config.db.max,
          connectionTimeoutMillis: config.db.connectionTimeoutMillis,
        };

    poolInstance = new Pool(poolConfig);

    poolInstance.on('error', (err) => {
      console.warn('[PostgreSQL Pool Warning]:', err.message);
    });
  }
  return poolInstance;
}

export async function testDbConnection(): Promise<boolean> {
  try {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      isConnected = true;
      console.log(`[PostgreSQL] Kết nối thành công tới database: ${config.db.database}@${config.db.host}:${config.db.port}`);
      return true;
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    isConnected = false;
    const msg = err instanceof Error ? err.message : 'Unknown database error';
    console.warn(`[PostgreSQL Notice] Chưa kết nối được DB (${msg}). Hệ thống tự động kích hoạt chế độ Fallback In-Memory Seed Data để ứng dụng hoạt động thông suốt.`);
    return false;
  }
}

export function isDbConnected(): boolean {
  return isConnected;
}

export async function ensureDietPreferencesColumn(): Promise<void> {
  if (!isConnected) {
    throw new Error('PostgreSQL chưa sẵn sàng để cập nhật cấu trúc chế độ ăn.');
  }

  await getPool().query(
    `ALTER TABLE users
     ADD COLUMN IF NOT EXISTS diet_preferences JSONB NOT NULL DEFAULT '[]'::jsonb`,
  );
}

export async function ensureAdminPersonalFeatures(): Promise<void> {
  if (!isConnected) {
    throw new Error('PostgreSQL chưa sẵn sàng để cập nhật cấu trúc hồ sơ cá nhân.');
  }

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query(`
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
    `);
    await client.query('COMMIT');
  } catch (error: unknown) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function ensureAiRecommendedOrderItemsColumn(): Promise<void> {
  if (!isConnected) {
    throw new Error('PostgreSQL chưa sẵn sàng để cập nhật cấu trúc phân loại đơn hàng.');
  }
  await getPool().query(
    `DO $$
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
     $$`,
  );
}

export async function queryPostgres<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
  timeoutMs = 5000
): Promise<QueryResult<T>> {
  const pool = getPool();
  let timer: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`PostgreSQL query timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([pool.query<T>(text, params), timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
