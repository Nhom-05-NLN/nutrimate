import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import * as repository from '../repositories/nutritionImageRepository.js';
import { ChatConversationRepository } from '../repositories/chatConversationRepository.js';
import { ChatError } from '../types/chat.js';
import type { NutritionImagePrediction, NutritionImageRow } from '../types/nutritionImage.js';
import { analyzeNutritionImage, type ImageNutritionEstimate } from './nutritionImageLlmService.js';

type SupportedImageMime = 'image/jpeg' | 'image/png' | 'image/webp';
const imageTypes: Record<SupportedImageMime, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

function imageMimeType(image: Buffer, declaredType: string): SupportedImageMime {
  let detected: SupportedImageMime | null = null;
  if (image.length >= 12 && image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff && image.at(-2) === 0xff && image.at(-1) === 0xd9) {
    detected = 'image/jpeg';
  } else if (
    image.length >= 33
    && image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    && image.readUInt32BE(8) === 13
    && image.toString('ascii', 12, 16) === 'IHDR'
    && image.toString('ascii', image.length - 8, image.length - 4) === 'IEND'
  ) {
    detected = 'image/png';
  } else if (
    image.length >= 20
    && image.toString('ascii', 0, 4) === 'RIFF'
    && image.toString('ascii', 8, 12) === 'WEBP'
    && image.readUInt32LE(4) + 8 <= image.length
  ) {
    detected = 'image/webp';
  }

  const normalizedType = declaredType.split(';', 1)[0]?.trim().toLowerCase();
  if (!detected || (normalizedType && normalizedType !== 'application/octet-stream' && normalizedType !== detected)) {
    throw new ChatError(400, 'Ảnh không hợp lệ. Chỉ hỗ trợ JPG, PNG hoặc WebP.');
  }
  return detected;
}

function toPrediction(row: NutritionImageRow): NutritionImagePrediction {
  if (row.status !== 'completed' && row.status !== 'unrecognized') {
    throw new ChatError(503, 'Kết quả phân tích ảnh chưa sẵn sàng.');
  }
  return {
    imageId: row.image_id,
    imageUrl: row.image_url,
    ocrText: row.ocr_text ?? '',
    uploadDate: new Date(row.upload_date).toISOString(),
    status: row.status,
    predictedCalories: row.predicted_calories,
    predictedProtein: row.predicted_protein,
    predictedCarbs: row.predicted_carbs,
    predictedFat: row.predicted_fat,
    predictedSugar: row.predicted_sugar,
    labelFacts: [],
  };
}

function storedFilename(row: NutritionImageRow): string {
  const match = /^\/api\/chat\/nutrition-images\/([0-9a-f-]{36}\.(?:jpg|png|webp))$/.exec(row.image_url);
  if (!match?.[1]) throw new ChatError(500, 'Không thể đọc tệp ảnh đã lưu.');
  return match[1];
}

export function createNutritionImageService(
  imageRepository = repository,
  predict: (image: Buffer, mime: SupportedImageMime, question: string) => Promise<ImageNutritionEstimate> = (image, mime, question) => analyzeNutritionImage(image, mime, fetch, question),
  storageDir = config.nutritionImage.storageDir,
  conversations = new ChatConversationRepository(),
) {
  return {
    async analyze(userId: number, conversationId: string, requestId: string, image: unknown, declaredType: string, question = ''): Promise<NutritionImagePrediction> {
      if (!Buffer.isBuffer(image) || image.length === 0) throw new ChatError(400, 'Chưa nhận được ảnh cần phân tích.');
      if (image.length > config.nutritionImage.maxUploadBytes) throw new ChatError(413, 'Ảnh vượt quá dung lượng tối đa 5 MB.');
      const mimeType = imageMimeType(image, declaredType);
      const filename = `${randomUUID()}${imageTypes[mimeType]}`;
      const imageUrl = `/api/chat/nutrition-images/${filename}`;
      await mkdir(storageDir, { recursive: true });
      const filePath = path.join(storageDir, filename);
      await writeFile(filePath, image, { flag: 'wx', mode: 0o600 });

      let record: NutritionImageRow;
      try {
        record = await imageRepository.createNutritionImage(userId, imageUrl);
      } catch (error) {
        try {
          await unlink(filePath);
        } catch {
          console.error('[NutritionImage] Could not remove an upload after database insert failure.');
        }
        throw error;
      }

      let completed: NutritionImageRow;
      let labelFacts: ImageNutritionEstimate['labelFacts'] = [];
      try {
        const estimate = await predict(image, mimeType, question);
        labelFacts = estimate.labelFacts;
        completed = await imageRepository.finishNutritionImage(record.image_id, userId, {
          ocrText: estimate.ocrText,
          calories: estimate.calories,
          protein: estimate.protein,
          carbs: estimate.carbs,
          fat: estimate.fat,
          sugar: estimate.sugar,
          status: estimate.recognized ? 'completed' : 'unrecognized',
        });
      } catch (error) {
        await imageRepository.failNutritionImage(record.image_id, userId).catch(() => {
          console.error('[NutritionImage] Could not mark an unsuccessful analysis.');
        });
        await conversations.saveImageAnalysis(
          conversationId,
          userId,
          requestId,
          record.image_id,
          '\u004b\u0068\u00f4\u006e\u0067 \u0074\u0068\u1ec3 \u0070\u0068\u00e2\u006e \u0074\u00ed\u0063\u0068 \u1ea3\u006e\u0068 \u006c\u00fa\u0063 \u006e\u00e0\u0079. \u0056\u0075\u0069 \u006c\u00f2\u006e\u0067 \u0074\u0068\u1eed \u006c\u1ea1\u0069.',
          question,
        ).catch(() => {
          console.error('[NutritionImage] Could not save a failed analysis to chat history.');
        });
        throw error;
      }

      const prediction = toPrediction(completed);
      const disclaimer = '\u0054\u0068\u00f4\u006e\u0067 \u0074\u0069\u006e \u0063\u0068\u1ec9 \u006d\u0061\u006e\u0067 \u0074\u00ed\u006e\u0068 \u0074\u0068\u0061\u006d \u006b\u0068\u1ea3\u006f, \u006b\u0068\u00f4\u006e\u0067 \u0074\u0068\u0061\u0079 \u0074\u0068\u1ebf \u0074\u01b0 \u0076\u1ea5\u006e \u0063\u1ee7\u0061 \u0062\u00e1\u0063 \u0073\u0129 \u0068\u006f\u1eb7\u0063 \u0063\u0068\u0075\u0079\u00ea\u006e \u0067\u0069\u0061 \u0064\u0069\u006e\u0068 \u0064\u01b0\u1ee1\u006e\u0067.';
      const reply = prediction.status === 'unrecognized'
        ? `\u004d\u00ec\u006e\u0068 \u0063\u0068\u01b0\u0061 \u006e\u0068\u1ead\u006e \u0064\u0069\u1ec7\u006e \u0111\u01b0\u1ee3\u0063 \u0074\u0068\u1ef1\u0063 \u0070\u0068\u1ea9\u006d \u0074\u0072\u006f\u006e\u0067 \u1ea3\u006e\u0068.\n\n${disclaimer}`
        : `Ước tính dinh dưỡng cho khẩu phần trong ảnh\n\n• Năng lượng: ${prediction.predictedCalories ?? '—'} kcal\n• Protein: ${prediction.predictedProtein ?? '—'} g\n• Carbs: ${prediction.predictedCarbs ?? '—'} g\n• Chất béo: ${prediction.predictedFat ?? '—'} g\n• Đường: ${prediction.predictedSugar ?? '—'} g\n\n${disclaimer}`;

      try {
        await conversations.saveImageAnalysis(conversationId, userId, requestId, completed.image_id, reply, question);
      } catch (error) {
        await imageRepository.deleteNutritionImage(completed.image_id, userId).catch(() => {
          console.error('[NutritionImage] Could not remove an upload after chat history save failure.');
        });
        await unlink(filePath).catch(() => {
          console.error('[NutritionImage] Could not remove an upload after chat history save failure.');
        });
        throw error;
      }

      return { ...prediction, labelFacts };
    },

    async getImage(userId: number, filename: string): Promise<{ image: Buffer; mimeType: SupportedImageMime }> {
      if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(filename)) throw new ChatError(404, 'Không tìm thấy ảnh.');
      const imageUrl = `/api/chat/nutrition-images/${filename}`;
      const row = await imageRepository.getNutritionImageForCustomer(imageUrl, userId);
      if (!row) throw new ChatError(404, 'Không tìm thấy ảnh của bạn.');
      const extension = path.extname(storedFilename(row));
      const mimeType = extension === '.jpg' ? 'image/jpeg' : extension === '.png' ? 'image/png' : 'image/webp';
      return { image: await readFile(path.join(storageDir, storedFilename(row))), mimeType };
    },
  };
}

export type NutritionImageService = ReturnType<typeof createNutritionImageService>;
