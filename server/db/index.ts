import pg, { QueryResult, QueryResultRow } from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

let poolInstance: pg.Pool | null = null;
let isConnected = false;

export function getPool(): pg.Pool {
  if (!poolInstance) {
    poolInstance = new Pool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      max: config.db.max,
      connectionTimeoutMillis: config.db.connectionTimeoutMillis,
    });

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

export async function queryPostgres<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  return pool.query<T>(text, params);
}
