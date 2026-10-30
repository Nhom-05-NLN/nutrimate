import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { config } from '../server/config.js';

// An outer transaction pins a pooler connection and rolls back all test DDL/data.
export async function createChatTestDatabase() {
  const client = new pg.Client(config.db);
  await client.connect();
  try {
    await client.query('BEGIN');
    const schema = `chat_test_${randomUUID().replaceAll('-', '')}`;
    if (!/^chat_test_[a-f0-9]{32}$/.test(schema)) throw new Error('Invalid test namespace');
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET LOCAL search_path TO "${schema}", public, pg_temp`);
    await client.query('CREATE TABLE users (id INTEGER PRIMARY KEY, role TEXT)');
    await client.query("INSERT INTO users VALUES (1, 'customer'), (2, 'customer')");
    const migration = (await readFile(new URL('../server/db/migrations/001_chat.sql', import.meta.url), 'utf8'))
      .replace(/^BEGIN;\s*$/m, '').replace(/^COMMIT;\s*$/m, '');
    await client.query(migration);
    await client.query(migration);
    const transactionalClient = {
      async query(sql: string, params?: unknown[]) {
        if (sql === 'BEGIN') return client.query('SAVEPOINT chat_turn');
        if (sql === 'COMMIT') return client.query('RELEASE SAVEPOINT chat_turn');
        if (sql === 'ROLLBACK') {
          await client.query('ROLLBACK TO SAVEPOINT chat_turn');
          return client.query('RELEASE SAVEPOINT chat_turn');
        }
        return client.query(sql, params);
      },
      release() {},
    };
    const pool = { query: client.query.bind(client), connect: async () => transactionalClient } as unknown as pg.Pool;
    return { pool, async close() { try { await client.query('ROLLBACK'); } finally { await client.end(); } } };
  } catch (error) {
    try { await client.query('ROLLBACK'); } finally { await client.end(); }
    throw error;
  }
}
