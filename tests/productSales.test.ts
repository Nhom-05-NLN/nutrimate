import assert from 'node:assert/strict';
import test from 'node:test';
import { findProducts, findProductById } from '../server/repositories/productRepository.js';
import { queryPostgres } from '../server/db/index.js';

test('product detail propagates database failures and never substitutes seeded stock', async () => {
  const unavailable = (async () => { throw new Error('Database unavailable'); }) as typeof queryPostgres;
  await assert.rejects(findProductById('prod-granola', unavailable), /Database unavailable/);
  const empty = (async () => ({ rows: [] })) as unknown as typeof queryPostgres;
  assert.equal(await findProductById('prod-granola', empty), null);
});

test('product detail maps stock directly from the database, including zero stock', async () => {
  for (const stock of [0, 23]) {
    const executeQuery = (async (_sql: string, values: unknown[]) => {
      assert.deepEqual(values, ['2']);
      return { rows: [{ id: 2, code: 'NM-02', price: '10000', stock_quantity: stock, rating: '0' }] };
    }) as unknown as typeof queryPostgres;
    assert.equal((await findProductById('2', executeQuery))?.stock, stock);
  }
});

test('popular products aggregate delivered quantities and sort before pagination', async () => {
  const queries: string[] = [];
  const executeQuery = (async (sql: string) => {
    queries.push(sql);
    if (/^SELECT COUNT\(\*\)/.test(sql.trim())) return { rows: [{ count: '2' }] };
    return {
      rows: [{
        id: 12, code: 'P12', name: 'Product', category: 'low-carb',
        category_name: 'Low-Carb', price: '10000', original_price: null,
        stock_quantity: 5, rating: '4', review_count: 0,
        calories: '20', protein: '1', carbs: '2', fat: '0', sugar: '0',
        sold_count: '17',
      }],
    };
  }) as typeof queryPostgres;
  const result = await findProducts({ sort: 'sold_desc', page: 2, limit: 1 }, true, executeQuery);
  assert.equal(result.products[0].soldCount, 17);
  assert.equal(result.products[0].rating, 4);
  assert.equal(result.products[0].reviewCount, 0);
  assert.equal(result.products[0].originalPrice, undefined);
  assert.deepEqual(result.products[0].badges, []);
  assert.equal(result.total, 2);
  assert.match(queries[1], /SUM\(oi.quantity\)/);
  assert.match(queries[1], /o.status = 'delivered'/);
  assert.match(queries[1], /oi.product_id = p.product_id/);
  assert.match(queries[1], /p.product_id AS id/);
  assert.match(queries[1], /c.category_id = p.category_id/);
  assert.match(queries[1], /nutrition_facts nf ON nf.product_id = p.product_id/);
  assert.match(queries[1], /AVG\(r.rating\)/);
  assert.doesNotMatch(queries[1], /p\.(base_price|is_active|category_name|rating|review_count)/);
  assert.doesNotMatch(queries[1], /p\.(best_for|is_featured|badges|original_price|slug)/);
  assert.match(queries[1], /ORDER BY sold_count DESC, id ASC\s+LIMIT/);
});

test('multiple categories share a parameterized OR filter before counting and pagination', async () => {
  const calls: { sql: string; values: unknown[] }[] = [];
  const executeQuery = (async (sql: string, values: unknown[] = []) => {
    calls.push({ sql, values: [...values] });
    return { rows: /^SELECT COUNT\(\*\)/.test(sql.trim()) ? [{ count: '0' }] : [] };
  }) as typeof queryPostgres;
  const categories = ['low-carb', 'high-protein'];
  await findProducts({ categories, page: 1, limit: 9 }, true, executeQuery);
  for (const call of calls) {
    assert.match(call.sql, /category = ANY\(\$1::text\[\]\)/);
    assert.deepEqual(call.values[0], categories);
  }
  assert.match(calls[1].sql, /LIMIT \$2 OFFSET \$3/);
});
