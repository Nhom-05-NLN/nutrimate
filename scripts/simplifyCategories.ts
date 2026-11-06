import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getPool, queryPostgres } from '../server/db/index.js';
import { findProducts } from '../server/repositories/productRepository.js';

const pool = getPool();
pool.options.connectionTimeoutMillis = 15000;
const client = await pool.connect();
try {
  await client.query('BEGIN');
  const before = await client.query('SELECT category_id, name, description FROM categories ORDER BY category_id');
  const references = await client.query('SELECT product_id, category_id FROM products ORDER BY product_id');
  const migration = await readFile(new URL('../server/db/migrations/014_simplify_categories.sql', import.meta.url), 'utf8');
  await client.query(migration.replace(/^BEGIN;$/m, '').replace(/^COMMIT;$/m, ''));
  assert.deepEqual((await client.query('SELECT * FROM categories ORDER BY category_id')).rows, before.rows);
  assert.deepEqual((await client.query('SELECT product_id, category_id FROM products ORDER BY product_id')).rows, references.rows);
  const columns = (await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='categories' ORDER BY ordinal_position")).rows;
  assert.deepEqual(columns.map(row => row.column_name), ['category_id', 'name', 'description']);
  const executeQuery = client.query.bind(client) as typeof queryPostgres;
  const ids = before.rows.slice(0, 2).map(row => String(row.category_id));
  const filtered = await findProducts({ categories: ids }, true, executeQuery);
  assert(filtered.products.every(product => ids.includes(product.category)));
  const apply = process.argv.includes('--apply');
  await client.query(apply ? 'COMMIT' : 'ROLLBACK');
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', categories: before.rows.length, columns, filteredProducts: filtered.total }));
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}
