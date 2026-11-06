import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getPool, queryPostgres } from '../server/db/index.js';
import { findProducts } from '../server/repositories/productRepository.js';

const pool = getPool();
pool.options.connectionTimeoutMillis = 15000;
const client = await pool.connect();
try {
  await client.query('BEGIN');
  const before = await client.query('SELECT COUNT(*)::int AS count FROM products');
  const migration = await readFile(new URL('../server/db/migrations/012_simplify_product_attributes.sql', import.meta.url), 'utf8');
  await client.query(migration.replace(/^BEGIN;$/m, '').replace(/^COMMIT;$/m, ''));
  const executeQuery = client.query.bind(client) as typeof queryPostgres;
  const result = await findProducts({ sort: 'sold_desc', limit: 1000 }, true, executeQuery);
  assert.equal(result.total, before.rows[0].count);
  assert(result.products.every(product => product.originalPrice === undefined));
  const columns = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='products' ORDER BY ordinal_position");
  const removed = ['best_for', 'is_featured', 'badges', 'original_price', 'slug'];
  assert(columns.rows.every(row => !removed.includes(row.column_name)));
  const apply = process.argv.includes('--apply');
  await client.query(apply ? 'COMMIT' : 'ROLLBACK');
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', products: result.total, columns: columns.rows }));
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}
