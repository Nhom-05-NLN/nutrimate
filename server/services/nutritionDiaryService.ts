import * as repository from '../repositories/nutritionDiaryRepository.js';
import { MealType } from '../types/nutritionDiary.js';

export class NutritionDiaryError extends Error {
  constructor(message: string, public readonly statusCode: number) { super(message); }
}

function validateDate(date: unknown): string {
  const parsed = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00.000Z`) : null;
  if (!parsed || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new NutritionDiaryError('Ngày nhật ký không hợp lệ.', 400);
  }
  return date;
}
function validateBody(body: unknown): Record<string, unknown> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) throw new NutritionDiaryError('Dữ liệu gửi lên không hợp lệ.', 400);
  return body as Record<string, unknown>;
}
function nutritionNumber(value: unknown, label: string, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max) {
    throw new NutritionDiaryError(`${label} phải là số từ 0 đến ${max}.`, 400);
  }
  return value;
}

export function parseDate(value: unknown): string { return validateDate(value); }
export async function getDay(userId: string, value: unknown) { return repository.getDay(userId, validateDate(value)); }
export async function createMeal(userId: string, body: unknown): Promise<void> {
  const input = validateBody(body);
  const date = validateDate(input.date);
  if (input.mealType !== 'breakfast' && input.mealType !== 'lunch' && input.mealType !== 'dinner' && input.mealType !== 'snack') {
    throw new NutritionDiaryError('Vui lòng chọn bữa ăn hợp lệ.', 400);
  }
  if (typeof input.foodName !== 'string' || !input.foodName.trim() || input.foodName.trim().length > 200) {
    throw new NutritionDiaryError('Tên món ăn không được để trống và tối đa 200 ký tự.', 400);
  }
  await repository.addMeal(userId, date, input.mealType as MealType, input.foodName.trim(),
    nutritionNumber(input.calories, 'Calories', 10000), nutritionNumber(input.protein, 'Protein', 1000),
    nutritionNumber(input.carbs, 'Carbs', 1000), nutritionNumber(input.fat, 'Fat', 1000), nutritionNumber(input.sugar, 'Sugar', 1000));
}
export async function createWater(userId: string, body: unknown): Promise<void> {
  const input = validateBody(body);
  const date = validateDate(input.date);
  if (typeof input.amountMl !== 'number' || !Number.isInteger(input.amountMl) || input.amountMl <= 0 || input.amountMl > 10000) {
    throw new NutritionDiaryError('Lượng nước phải là số nguyên dương không quá 10.000 ml.', 400);
  }
  await repository.addWater(userId, date, input.amountMl);
}
