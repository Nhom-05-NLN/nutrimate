import assert from 'node:assert/strict';
import test from 'node:test';
import { findProducts } from '../server/repositories/productRepository.js';
import { queryPostgres } from '../server/db/index.js';

test('popular products aggregate delivered quantities and sort before pagination', async () => {
  const queries: string[] = [];
  const executeQuery = (async (sql: string) => {
    queries.push(sql);
    if (sql.includes('COUNT(*)')) return { rows: [{ count: '2' }] };
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
  assert.equal(result.total, 2);
  assert.match(queries[0], /p\.status IS TRUE/);
  assert.match(queries[1], /p\.status IS TRUE/);
  assert.doesNotMatch(queries.join('\n'), /is_active/);
  assert.match(queries[1], /SUM\(oi.quantity\)/);
  assert.match(queries[1], /o.status = 'delivered'/);
  assert.match(queries[1], /oi.product_id = p\.product_id/);
  assert.match(queries[1], /p\.product_id::text AS id/);
  assert.match(queries[1], /ORDER BY sold_count DESC, p\.product_id ASC\s+LIMIT/);
});

test('multiple categories share a parameterized OR filter before counting and pagination', async () => {
  const calls: { sql: string; values: unknown[] }[] = [];
  const executeQuery = (async (sql: string, values: unknown[] = []) => {
    calls.push({ sql, values: [...values] });
    return { rows: sql.includes('COUNT(*)') ? [{ count: '0' }] : [] };
  }) as typeof queryPostgres;
  const categories = ['low-carb', 'high-protein'];
  await findProducts({ categories, page: 1, limit: 9 }, true, executeQuery);
  for (const call of calls) {
    assert.match(call.sql, /p\.status IS TRUE/);
    assert.doesNotMatch(call.sql, /is_active/);
    assert.match(call.sql, /END = ANY\(\$1::text\[\]\)/);
    assert.deepEqual(call.values[0], categories);
  }
  assert.match(calls[1].sql, /LIMIT \$2 OFFSET \$3/);
});
