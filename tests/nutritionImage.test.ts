import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Request, Response } from 'express';
import { config } from '../server/config.js';
import { createNutritionImageController, parseImageBody } from '../server/controllers/nutritionImageController.js';
import { analyzeNutritionImage } from '../server/services/nutritionImageLlmService.js';
import { createNutritionImageService } from '../server/services/nutritionImageService.js';
import { ChatError, type ChatOwner } from '../server/types/chat.js';
import type { NutritionImagePredictionValues } from '../server/repositories/nutritionImageRepository.js';
import type { NutritionImagePrediction, NutritionImageRow } from '../server/types/nutritionImage.js';

const settings = {
  apiKey: config.chat.apiKey,
  baseUrl: config.chat.baseUrl,
  model: config.chat.model,
};
let storageDir = '';
let aiCalls = 0;
let estimateRecognized = true;
let predictionFailure = false;
const records = new Map<number, NutritionImageRow>();
let nextId = 1;

function pngFixture(): Buffer {
  const header = Buffer.alloc(33);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(header);
  header.writeUInt32BE(13, 8);
  header.write('IHDR', 12, 'ascii');
  header.writeUInt32BE(2, 16);
  header.writeUInt32BE(2, 20);
  header[24] = 8;
  header[25] = 6;
  const end = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 0, 0, 0, 0]);
  return Buffer.concat([header, end]);
}

const imageRepository = {
  async createNutritionImage(userId: number, imageUrl: string) {
    const row: NutritionImageRow = {
      image_id: nextId++,
      customer_id: userId,
      image_url: imageUrl,
      ocr_text: null,
      upload_date: new Date(),
      status: 'processing',
      predicted_calories: null,
      predicted_protein: null,
      predicted_carbs: null,
      predicted_fat: null,
      predicted_sugar: null,
    };
    records.set(row.image_id, row);
    return row;
  },
  async finishNutritionImage(imageId: number, userId: number, prediction: NutritionImagePredictionValues) {
    const row = records.get(imageId);
    if (!row || row.customer_id !== userId) throw new Error('Missing test record');
    Object.assign(row, {
      ocr_text: prediction.ocrText,
      status: prediction.status,
      predicted_calories: prediction.calories,
      predicted_protein: prediction.protein,
      predicted_carbs: prediction.carbs,
      predicted_fat: prediction.fat,
      predicted_sugar: prediction.sugar,
    });
    return row;
  },
  async failNutritionImage(imageId: number, userId: number) {
    const row = records.get(imageId);
    if (!row || row.customer_id !== userId) throw new Error('Missing test record');
    row.status = 'failed';
  },
  async getNutritionImageForCustomer(imageUrl: string, userId: number) {
    return [...records.values()].find(row => row.image_url === imageUrl && row.customer_id === userId) ?? null;
  },
};

const identity = async (req: Request, _res: Response): Promise<ChatOwner> => {
  const authorization = req.get('authorization');
  if (!authorization) return { userId: null, guestHash: 'guest' };
  if (authorization === 'Bearer admin') throw new ChatError(403, 'Chức năng này dành cho Customer.');
  return { userId: authorization === 'Bearer customer-2' ? 2 : 1, guestHash: null };
};
const service = createNutritionImageService(imageRepository, async () => {
  aiCalls++;
  if (predictionFailure) throw new ChatError(504, 'Phân tích ảnh quá thời gian.');
  return {
    recognized: estimateRecognized,
    ocrText: 'Thành phần dinh dưỡng',
    calories: estimateRecognized ? 210 : null,
    protein: estimateRecognized ? 12 : null,
    carbs: estimateRecognized ? 24 : null,
    fat: estimateRecognized ? 8 : null,
    sugar: estimateRecognized ? 4 : null,
  };
}, '');
const controller = createNutritionImageController(service, identity);
const app = express();
app.post('/nutrition-images', controller.authorize, parseImageBody, controller.upload);
app.get('/nutrition-images/:filename', controller.authorize, controller.image);
let server: ReturnType<typeof app.listen>;
let base = '';

before(async () => {
  server = app.listen(0, '127.0.0.1');
  const listening = once(server, 'listening');
  config.chat.apiKey = 'synthetic-test-key';
  config.chat.baseUrl = 'https://vision.example.test/v1';
  config.chat.model = 'synthetic-vision-model';
  storageDir = await mkdtemp(path.join(tmpdir(), 'nutrimate-image-test-'));
  Object.assign(service, createNutritionImageService(imageRepository, async () => {
    aiCalls++;
    if (predictionFailure) throw new ChatError(504, 'Phân tích ảnh quá thời gian.');
    return {
      recognized: estimateRecognized,
      ocrText: 'Thành phần dinh dưỡng',
      calories: estimateRecognized ? 210 : null,
      protein: estimateRecognized ? 12 : null,
      carbs: estimateRecognized ? 24 : null,
      fat: estimateRecognized ? 8 : null,
      sugar: estimateRecognized ? 4 : null,
    };
  }, storageDir));
  await listening;
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  base = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  config.chat.apiKey = settings.apiKey;
  config.chat.baseUrl = settings.baseUrl;
  config.chat.model = settings.model;
  if (server) {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
  await rm(storageDir, { recursive: true, force: true });
});

async function upload(image = pngFixture(), authorization = 'Bearer customer-1', contentType = 'image/png') {
  return fetch(`${base}/nutrition-images`, {
    method: 'POST',
    headers: { 'Content-Type': contentType, ...(authorization ? { Authorization: authorization } : {}) },
    body: image,
  });
}

test('requires a signed-in Customer and rejects guest or Admin image analysis', async () => {
  const beforeCount = records.size;
  assert.equal((await upload(pngFixture(), '')).status, 401);
  assert.equal((await upload(pngFixture(), 'Bearer admin')).status, 403);
  assert.equal(records.size, beforeCount);
});

test('valid image is analyzed, saved with estimates, and only its owner can retrieve it', async () => {
  const response = await upload();
  assert.equal(response.status, 201);
  const prediction = (await response.json() as { data: NutritionImagePrediction }).data;
  assert.equal(prediction.status, 'completed');
  assert.equal(prediction.predictedCalories, 210);
  assert.equal(prediction.predictedProtein, 12);
  assert.equal(prediction.predictedCarbs, 24);
  assert.equal(prediction.predictedFat, 8);
  assert.equal(prediction.predictedSugar, 4);
  const filename = path.basename(prediction.imageUrl);
  assert.equal((await fetch(`${base}/nutrition-images/${filename}`, { headers: { Authorization: 'Bearer customer-2' } })).status, 404);
  const imageResponse = await fetch(`${base}/nutrition-images/${filename}`, { headers: { Authorization: 'Bearer customer-1' } });
  assert.equal(imageResponse.status, 200);
  assert.equal(imageResponse.headers.get('content-type'), 'image/png');
  assert.deepEqual(Buffer.from(await imageResponse.arrayBuffer()), pngFixture());
});

test('unrecognized food returns no invented nutrition values', async () => {
  estimateRecognized = false;
  try {
    const response = await upload();
    assert.equal(response.status, 201);
    const prediction = (await response.json() as { data: NutritionImagePrediction }).data;
    assert.equal(prediction.status, 'unrecognized');
    assert.equal(prediction.predictedCalories, null);
    assert.equal(prediction.predictedProtein, null);
    assert.equal(prediction.predictedCarbs, null);
    assert.equal(prediction.predictedFat, null);
    assert.equal(prediction.predictedSugar, null);
  } finally {
    estimateRecognized = true;
  }
});

test('invalid image bytes or mismatched MIME are rejected before AI or database writes', async () => {
  const beforeCount = records.size;
  const beforeCalls = aiCalls;
  assert.equal((await upload(Buffer.from('not-an-image'), 'Bearer customer-1', 'image/png')).status, 400);
  assert.equal((await upload(pngFixture(), 'Bearer customer-1', 'image/jpeg')).status, 400);
  assert.equal(records.size, beforeCount);
  assert.equal(aiCalls, beforeCalls);
});

test('AI failure marks the stored image as failed and reports a retryable error', async () => {
  predictionFailure = true;
  try {
    const response = await upload();
    assert.equal(response.status, 504);
    const row = [...records.values()].at(-1);
    assert.equal(row?.status, 'failed');
    assert.equal((await response.json() as { success: boolean }).success, false);
  } finally {
    predictionFailure = false;
  }
});

test('oversized image body is rejected at the upload boundary', async () => {
  const beforeCount = records.size;
  const response = await upload(Buffer.alloc(config.nutritionImage.maxUploadBytes + 1), 'Bearer customer-1', 'image/png');
  assert.equal(response.status, 413);
  assert.equal(records.size, beforeCount);
});

test('vision adapter sends image only through the configured server-side LLM and validates nutrition output', async () => {
  const prediction = await analyzeNutritionImage(pngFixture(), 'image/png', async (url, options) => {
    assert.equal(String(url), 'https://vision.example.test/v1/chat/completions');
    assert.ok(options);
    const body = JSON.parse(options.body as string) as {
      model: string;
      messages: { content: { type: string; image_url?: { url: string } }[] }[];
    };
    assert.equal(body.model, 'synthetic-vision-model');
    const imagePart = body.messages[0]?.content.find(part => part.type === 'image_url');
    assert.ok(imagePart?.image_url?.url.startsWith('data:image/png;base64,'));
    return Response.json({
      choices: [{
        message: {
          content: JSON.stringify({
            recognized: true,
            ocr_text: 'Protein 12 g',
            predicted_calories: 210,
            predicted_protein: 12,
            predicted_carbs: 24,
            predicted_fat: 8,
            predicted_sugar: 4,
          }),
        },
      }],
    });
  });
  assert.deepEqual(prediction, {
    recognized: true,
    ocrText: 'Protein 12 g',
    calories: 210,
    protein: 12,
    carbs: 24,
    fat: 8,
    sugar: 4,
  });
  await assert.rejects(
    analyzeNutritionImage(pngFixture(), 'image/png', async () => Response.json({
      choices: [{ message: { content: '{"recognized":true,"ocr_text":"","predicted_calories":-1}' } }],
    })),
    (error: unknown) => error instanceof ChatError && error.status === 502,
  );
});
