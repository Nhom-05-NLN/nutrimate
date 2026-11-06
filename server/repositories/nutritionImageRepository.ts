import { queryPostgres } from '../db/index.js';
import type { NutritionImageRow } from '../types/nutritionImage.js';

export interface NutritionImagePredictionValues {
  ocrText: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  sugar: number | null;
  status: 'completed' | 'unrecognized';
}

const columns = `image_id, customer_id, image_url, ocr_text, upload_date, status,
  predicted_calories, predicted_protein, predicted_carbs, predicted_fat, predicted_sugar, content_sha256`;

export async function createNutritionImage(userId: number, imageUrl: string, contentSha256: string): Promise<NutritionImageRow> {
  const result = await queryPostgres<NutritionImageRow>(
    `INSERT INTO nutrition_images (customer_id, image_url, upload_date, status, content_sha256)
     VALUES ($1, $2, CURRENT_TIMESTAMP, 'processing', $3)
     RETURNING ${columns}`,
    [userId, imageUrl, contentSha256],
  );
  const row = result.rows[0];
  if (!row) throw new Error('Could not create nutrition image record.');
  return row;
}

export async function findNutritionImageByHash(userId: number, contentSha256: string): Promise<NutritionImageRow | null> {
  const result = await queryPostgres<NutritionImageRow>(
    `SELECT ${columns}
     FROM nutrition_images
     WHERE customer_id = $1 AND content_sha256 = $2`,
    [userId, contentSha256],
  );
  return result.rows[0] ?? null;
}

export async function listUnhashedNutritionImages(userId: number): Promise<NutritionImageRow[]> {
  const result = await queryPostgres<NutritionImageRow>(
    `SELECT ${columns}
     FROM nutrition_images
     WHERE customer_id = $1 AND content_sha256 IS NULL
     ORDER BY upload_date DESC`,
    [userId],
  );
  return result.rows;
}

export async function setNutritionImageHashIfMissing(
  imageId: number,
  userId: number,
  contentSha256: string,
): Promise<NutritionImageRow | null> {
  const result = await queryPostgres<NutritionImageRow>(
    `UPDATE nutrition_images
     SET content_sha256 = $3
     WHERE image_id = $1 AND customer_id = $2 AND content_sha256 IS NULL
     RETURNING ${columns}`,
    [imageId, userId, contentSha256],
  );
  return result.rows[0] ?? null;
}

export async function markNutritionImageProcessing(imageId: number, userId: number): Promise<void> {
  const result = await queryPostgres(
    `UPDATE nutrition_images
     SET status = 'processing'
     WHERE image_id = $1 AND customer_id = $2 AND status = 'failed'`,
    [imageId, userId],
  );
  if (!result.rowCount) throw new Error('Could not retry nutrition image analysis.');
}

export async function finishNutritionImage(
  imageId: number,
  userId: number,
  prediction: NutritionImagePredictionValues,
): Promise<NutritionImageRow> {
  const result = await queryPostgres<NutritionImageRow>(
    `UPDATE nutrition_images
     SET ocr_text = $3,
         status = $4,
         predicted_calories = $5,
         predicted_protein = $6,
         predicted_carbs = $7,
         predicted_fat = $8,
         predicted_sugar = $9
     WHERE image_id = $1 AND customer_id = $2
     RETURNING ${columns}`,
    [imageId, userId, prediction.ocrText, prediction.status, prediction.calories, prediction.protein, prediction.carbs, prediction.fat, prediction.sugar],
  );
  const row = result.rows[0];
  if (!row) throw new Error('Could not update nutrition image record.');
  return row;
}

export async function failNutritionImage(imageId: number, userId: number, ocrText = ''): Promise<void> {
  const result = await queryPostgres(
    `UPDATE nutrition_images
     SET ocr_text = $3, status = 'failed'
     WHERE image_id = $1 AND customer_id = $2`,
    [imageId, userId, ocrText],
  );
  if (!result.rowCount) throw new Error('Could not mark nutrition image as failed.');
}

export async function getNutritionImageForCustomer(imageUrl: string, userId: number): Promise<NutritionImageRow | null> {
  const result = await queryPostgres<NutritionImageRow>(
    `SELECT ${columns}
     FROM nutrition_images
     WHERE image_url = $1 AND customer_id = $2`,
    [imageUrl, userId],
  );
  return result.rows[0] ?? null;
}

export async function deleteNutritionImage(imageId: number, userId: number): Promise<void> {
  await queryPostgres(
    'DELETE FROM nutrition_images WHERE image_id = $1 AND customer_id = $2',
    [imageId, userId],
  );
}
