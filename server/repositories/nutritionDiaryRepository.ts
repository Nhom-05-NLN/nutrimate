import { getPool, isDbConnected } from '../db/index.js';
import { MealType, NutritionDiaryDay } from '../types/nutritionDiary.js';

interface MealRow {
  id: number; meal_type: MealType; food_name: string; calories: number;
  protein: number; carbs: number; fat: number; sugar: number; created_at: Date;
}
interface WaterRow { id: number; amount_ml: number; logged_at: Date }

export async function getDay(userId: string, date: string): Promise<NutritionDiaryDay> {
  if (!isDbConnected()) throw new Error('PostgreSQL hiện không khả dụng.');
  const pool = getPool();
  const [meals, water] = await Promise.all([
    pool.query<MealRow>(`SELECT e.entry_id AS id, e.meal_type, COALESCE(e.food_name, p.name, 'Món ăn') AS food_name,
        e.calories, e.protein, e.carbs, e.fat, e.sugar, d.date::timestamptz AS created_at
      FROM nutrition_diary d
      JOIN diary_entries e ON e.diary_id = d.diary_id
      LEFT JOIN products p ON p.product_id = e.product_id
      WHERE d.customer_id = $1 AND d.date = $2
      ORDER BY e.entry_id`, [userId, date]),
    pool.query<WaterRow>(`SELECT water_log_id AS id, amount_ml, recorded_date::timestamptz AS logged_at FROM water_logs
      WHERE customer_id = $1 AND recorded_date = $2 ORDER BY water_log_id`, [userId, date]),
  ]);
  const mealEntries = meals.rows.map((row) => ({
    id: row.id, mealType: row.meal_type, foodName: row.food_name,
    calories: Number(row.calories), protein: Number(row.protein), carbs: Number(row.carbs),
    fat: Number(row.fat), sugar: Number(row.sugar), createdAt: row.created_at.toISOString(),
  }));
  const waterLogs = water.rows.map((row) => ({ id: row.id, amountMl: row.amount_ml, loggedAt: row.logged_at.toISOString() }));
  return {
    date, meals: mealEntries, waterLogs,
    totals: mealEntries.reduce((totals, entry) => ({
      calories: totals.calories + entry.calories, protein: totals.protein + entry.protein,
      carbs: totals.carbs + entry.carbs, fat: totals.fat + entry.fat, sugar: totals.sugar + entry.sugar,
      waterMl: totals.waterMl,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, waterMl: waterLogs.reduce((sum, row) => sum + row.amountMl, 0) }),
  };
}

export async function addMeal(userId: string, date: string, mealType: MealType,
  foodName: string, calories: number, protein: number, carbs: number, fat: number, sugar: number): Promise<void> {
  if (!isDbConnected()) throw new Error('PostgreSQL hiện không khả dụng.');
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let diary = await client.query<{ diary_id: number }>(
      'SELECT diary_id FROM nutrition_diary WHERE customer_id = $1 AND date = $2 FOR UPDATE', [userId, date]);
    if (diary.rowCount === 0) {
      try {
        diary = await client.query<{ diary_id: number }>(`INSERT INTO nutrition_diary (customer_id, date)
          VALUES ($1, $2) RETURNING diary_id`, [userId, date]);
      } catch (error: unknown) {
        if ((error as { code?: string }).code !== '23505') throw error;
        diary = await client.query<{ diary_id: number }>(
          'SELECT diary_id FROM nutrition_diary WHERE customer_id = $1 AND date = $2 FOR UPDATE', [userId, date]);
      }
    }
    const diaryId = diary.rows[0]?.diary_id;
    if (diaryId === undefined) throw new Error('Không thể tạo nhật ký dinh dưỡng.');
    const product = await client.query<{ product_id: number }>(
      'SELECT product_id FROM products WHERE name = $1 LIMIT 1', [foodName]);
    await client.query(`INSERT INTO diary_entries (diary_id, product_id, food_name, meal_type, quantity, calories, protein, carbs, fat, sugar)
      VALUES ($1, $2, $3, $4, 1, $5, $6, $7, $8, $9)`,
    [diaryId, product.rows[0]?.product_id ?? null, foodName, mealType, calories, protein, carbs, fat, sugar]);
    await client.query(`UPDATE nutrition_diary SET total_calories = COALESCE(total_calories, 0) + $2,
      total_protein = COALESCE(total_protein, 0) + $3, total_carbs = COALESCE(total_carbs, 0) + $4,
      total_fat = COALESCE(total_fat, 0) + $5, total_sugar = COALESCE(total_sugar, 0) + $6 WHERE diary_id = $1`,
    [diaryId, calories, protein, carbs, fat, sugar]);
    await client.query('COMMIT');
  } catch (error: unknown) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function addWater(userId: string, date: string, amountMl: number): Promise<void> {
  if (!isDbConnected()) throw new Error('PostgreSQL hiện không khả dụng.');
  await getPool().query('INSERT INTO water_logs (customer_id, recorded_date, amount_ml) VALUES ($1, $2, $3)', [userId, date, amountMl]);
}
