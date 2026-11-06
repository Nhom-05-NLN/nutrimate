import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createChatTestDatabase } from './chatTestDatabase.js';
import { removeMeal } from '../server/repositories/nutritionDiaryRepository.js';

test('PostgreSQL: meal deletion is owner/date scoped and recalculates diary totals', { skip: process.env.NUTRITION_DIARY_TEST_POSTGRES !== '1' }, async () => {
  const database = await createChatTestDatabase();
  try {
    await database.pool.query(`
      CREATE TABLE nutrition_diary (
        diary_id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES users(id),
        date DATE NOT NULL,
        total_calories DOUBLE PRECISION NOT NULL DEFAULT 0,
        total_protein DOUBLE PRECISION NOT NULL DEFAULT 0,
        total_carbs DOUBLE PRECISION NOT NULL DEFAULT 0,
        total_fat DOUBLE PRECISION NOT NULL DEFAULT 0,
        total_sugar DOUBLE PRECISION NOT NULL DEFAULT 0
      );
      CREATE TABLE diary_entries (
        entry_id SERIAL PRIMARY KEY,
        diary_id INTEGER NOT NULL REFERENCES nutrition_diary(diary_id),
        calories DOUBLE PRECISION NOT NULL,
        protein DOUBLE PRECISION NOT NULL,
        carbs DOUBLE PRECISION NOT NULL,
        fat DOUBLE PRECISION NOT NULL,
        sugar DOUBLE PRECISION NOT NULL
      );
      INSERT INTO nutrition_diary (customer_id, date, total_calories, total_protein, total_carbs, total_fat, total_sugar)
      VALUES (1, '2026-11-06', 300, 30, 60, 12, 8), (2, '2026-11-06', 900, 90, 180, 36, 24);
      INSERT INTO diary_entries (diary_id, calories, protein, carbs, fat, sugar)
      VALUES (1, 200, 20, 40, 8, 5), (1, 100, 10, 20, 4, 3), (2, 900, 90, 180, 36, 24);
    `);

    assert.equal(await removeMeal('1', '2026-11-06', 1, database.pool), true);
    assert.equal(await removeMeal('1', '2026-11-06', 3, database.pool), false);
    assert.equal(await removeMeal('1', '2026-11-07', 2, database.pool), false);

    const result = await database.pool.query(`
      SELECT diary_id, total_calories, total_protein, total_carbs, total_fat, total_sugar
      FROM nutrition_diary ORDER BY diary_id
    `);
    assert.deepEqual(result.rows, [
      { diary_id: 1, total_calories: 100, total_protein: 10, total_carbs: 20, total_fat: 4, total_sugar: 3 },
      { diary_id: 2, total_calories: 900, total_protein: 90, total_carbs: 180, total_fat: 36, total_sugar: 24 },
    ]);
    const entries = await database.pool.query('SELECT entry_id FROM diary_entries ORDER BY entry_id');
    assert.deepEqual(entries.rows, [{ entry_id: 2 }, { entry_id: 3 }]);
  } finally {
    await database.close();
  }
});
