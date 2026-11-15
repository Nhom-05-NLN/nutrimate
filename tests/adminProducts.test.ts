import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import { createServer } from 'node:http';
import routes from '../server/routes/adminProductRoutes.js';
import { validateProduct, ProductInputError, listAdminProducts } from '../server/repositories/adminProductRepository.js';
import { queryPostgres } from '../server/db/index.js';

const input = { sku: ' sku-01 ', name: ' Product ', category: '4', price: 10000,
  calo: 100, protein: 1, carbs: 2, fat: 3, sugar: 0, image: '', status: 'Đang bán' };

test('product input normalizes identifiers and validates numeric/category/status fields', () => {
  assert.equal(validateProduct(input).sku, 'SKU-01');
  assert.equal(validateProduct(input).name, 'Product');
  assert.equal(validateProduct(input).stock, 0);
  assert.equal(validateProduct({ ...input, unit: ' jar ', package_size: ' 250 g ' }).unit, 'jar');
  assert.equal(validateProduct({ ...input, package_size: ' 250 g ' }).package_size, '250 g');
  for (const change of [{ unit: 1 }, { unit: 'x'.repeat(51) }, { package_size: false }, { package_size: 'x'.repeat(101) }]) {
    assert.throws(() => validateProduct({ ...input, ...change }), ProductInputError);
  }
  assert.equal(validateProduct({ ...input, stock: 25 }).stock, 25);
  for (const change of [{ category: 'Low-Carb' }, { price: NaN }, { price: -1 },
    { calo: '' }, { protein: -1 }, { status: 'other' }, { sku: '' }, { name: 'a' },
    { stock: -1 }, { stock: 1.5 }, { stock: '' }, { stock: 2147483648 }]) {
    assert.throws(() => validateProduct({ ...input, ...change }), ProductInputError);
  }
});

test('admin list uses normalized PostgreSQL tables and returns empty data without seeds', async () => {
  const queries: string[] = [];
  const executeQuery = (async (sql: string) => {
    queries.push(sql); return { rows: [] };
  }) as unknown as typeof queryPostgres;
  assert.deepEqual(await listAdminProducts(executeQuery), { products: [], categories: [], totalSold: 0 });
  assert.match(queries[0], /p.product_id/);
  assert.match(queries[0], /nutrition_facts/);
  assert.match(queries[0], /product_reviews/);
  assert.doesNotMatch(queries[0], /is_active|original_price|p\.slug/);
  assert.match(queries[2], /o.status='delivered'/);
});

test('all admin product endpoints reject unauthenticated requests', async () => {
  const app = express(); app.use(express.json()); app.use('/api/admin/products', routes);
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address(); assert(address && typeof address !== 'string');
    for (const [method, suffix] of [['GET',''], ['POST',''], ['PUT','/2'], ['DELETE','/2']]) {
      const response = await fetch(`http://127.0.0.1:${address.port}/api/admin/products${suffix}`, { method });
      assert.equal(response.status, 401);
    }
  } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
});
