import assert from 'node:assert/strict';
import test from 'node:test';
import { listProductReviews, insertProductReview } from '../server/repositories/productReviewRepository.js';
import { queryPostgres } from '../server/db/index.js';
import { createReview } from '../server/controllers/productReviewController.js';
import type { Request, Response } from 'express';
import type { AuthLocals } from '../server/middleware/authMiddleware.js';

test('review list maps genuine database values and uses account names', async () => {
  const query = (async (sql: string, values: unknown[]) => {
    assert.match(sql, /COALESCE\(r.user_id, r.customer_id\)/);
    assert.match(sql, /ORDER BY r.created_at DESC, r.review_id DESC/);
    assert.deepEqual(values, ['2']);
    return { rows: [{ review_id: 7, author: 'Account name', rating: 4, comment: 'Review', created_at: '2026-01-01T00:00:00Z' }] };
  }) as unknown as typeof queryPostgres;
  assert.deepEqual(await listProductReviews('2', query), [{
    id: '7', author: 'Account name', avatarUrl: undefined, rating: 4, content: 'Review', createdAt: '2026-01-01T00:00:00.000Z',
  }]);
});

test('empty reviews stay empty and database failures are propagated', async () => {
  const empty = (async () => ({ rows: [] })) as unknown as typeof queryPostgres;
  assert.deepEqual(await listProductReviews('2', empty), []);
  assert.equal(await insertProductReview('2', '3', 5, 'Review', empty), null);
  const unavailable = (async () => { throw new Error('Database unavailable'); }) as typeof queryPostgres;
  await assert.rejects(listProductReviews('2', unavailable), /Database unavailable/);
});

test('review creation parameterizes the product, account, score and content', async () => {
  const query = (async (sql: string, values: unknown[]) => {
    assert.match(sql, /INSERT INTO product_reviews \(product_id, user_id, rating, comment\)/);
    assert.match(sql, /AND EXISTS/);
    assert.match(sql, /oi.product_id = p.product_id/);
    assert.match(sql, /o.user_id = u.id/);
    assert.match(sql, /o.status = 'delivered'/);
    assert.deepEqual(values, ['2', '3', 5, "Review ' text"]);
    return { rows: [{ review_id: 8 }] };
  }) as unknown as typeof queryPostgres;
  assert.equal(await insertProductReview('2', '3', 5, "Review ' text", query), '8');
});

test('invalid ratings or content are rejected before database access', async () => {
  for (const body of [{ rating: 0, content: 'x' }, { rating: 6, content: 'x' },
    { rating: 2.5, content: 'x' }, { rating: 5, content: ' ' }, { rating: 5, content: 'x'.repeat(2001) }]) {
    let status = 0;
    const response = {
      status(code: number) { status = code; return this; }, json() {},
    } as unknown as Response<unknown, AuthLocals>;
    await createReview({ body, params: { id: '2' } } as Request<{ id: string }>, response);
    assert.equal(status, 400);
  }
});
