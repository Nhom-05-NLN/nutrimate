import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getPool, queryPostgres, testDbConnection } from '../server/db/index.js';
import { findChatProducts, findProducts, findProductById } from '../server/repositories/productRepository.js';
import { getAllCategories } from '../server/repositories/categoryRepository.js';
import { loadAdminDashboard } from '../server/services/adminDashboardService.js';

const apply = process.argv.includes('--apply');
const pool = getPool();
const client = await pool.connect();
try {
  const before = await client.query('SELECT COUNT(*)::int AS count FROM products');
  const migration = await readFile(new URL('../server/db/migrations/011_normalize_products.sql', import.meta.url), 'utf8');
  await client.query('BEGIN');
  await client.query(migration.replace(/^BEGIN;$/m, '').replace(/^COMMIT;$/m, ''));
  const executeQuery = client.query.bind(client) as typeof queryPostgres;
  const listed = await findProducts({ sort: 'sold_desc', limit: 1000 }, true, executeQuery);
  assert.equal(listed.total, before.rows[0].count);
  assert(listed.products.every(product => Number.isFinite(product.price) && Number.isFinite(product.nutrition.calories)));
  await findProducts({ categories: ['low-carb', 'high-protein'], minProtein: 1 }, true, executeQuery);
  const chat = await findChatProducts({ maxCalories: 500 }, executeQuery);
  assert(chat.every(product => product.nutrition));
  // Verify aggregates against real related rows, without leaving test data behind.
  await client.query('SAVEPOINT review_check');
  const first = listed.products[0];
  assert(first);
  await client.query('DELETE FROM product_reviews WHERE product_id = $1', [first.id]);
  await client.query('INSERT INTO product_reviews (product_id, rating) VALUES ($1, 3), ($1, 5)', [first.id]);
  const reviewed = await findProducts({ search: first.name }, true, executeQuery);
  const matching = reviewed.products.find(product => product.id === first.id);
  assert.equal(matching?.rating, 4);
  assert.equal(matching?.reviewCount, 2);
  await client.query('ROLLBACK TO SAVEPOINT review_check');
  const columns = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='products'");
  const names = columns.rows.map(row => row.column_name);
  for (const removed of ['id', 'base_price', 'is_active', 'category', 'category_name', 'calories', 'rating', 'review_count']) {
    assert(!names.includes(removed));
  }
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', products: listed.total, columns: names, reviewAggregate: 'passed' }));
  await client.query(apply ? 'COMMIT' : 'ROLLBACK');
  if (apply) {
    assert(await testDbConnection());
    assert(await findProductById(first.id));
    assert((await getAllCategories()).length > 0);
    await loadAdminDashboard();
    console.log('Committed migration; detail, categories and admin dashboard queries passed.');
  }
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}
