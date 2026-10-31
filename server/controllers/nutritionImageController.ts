import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import { config } from '../config.js';
import { resolveChatOwner } from '../middleware/chatIdentity.js';
import { ChatError } from '../types/chat.js';
import type { ApiResponse } from '../types/index.js';
import type { NutritionImagePrediction } from '../types/nutritionImage.js';
import { createNutritionImageService, type NutritionImageService } from '../services/nutritionImageService.js';

function checkSameOrigin(req: Request): void {
  if (req.get('sec-fetch-site') === 'cross-site') throw new ChatError(403, 'Yêu cầu phải đến từ website NutriMate.');
  const origin = req.get('origin');
  if (origin && origin !== `${req.protocol}://${req.get('host')}`) throw new ChatError(403, 'Nguồn yêu cầu không hợp lệ.');
}

function failure(res: Response, error: unknown): void {
  const code = error instanceof ChatError ? error.status : 503;
  if (!(error instanceof ChatError)) console.error('[NutritionImage] Request failed.');
  res.status(code).json({
    success: false,
    message: error instanceof ChatError ? error.message : 'Không thể xử lý ảnh lúc này. Vui lòng thử lại.',
  });
}

export function createNutritionImageController(
  service: NutritionImageService = createNutritionImageService(),
  identity = resolveChatOwner,
) {
  return {
    authorize: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      res.setHeader('Cache-Control', 'no-store');
      try {
        checkSameOrigin(req);
        const owner = await identity(req, res);
        if (owner.userId === null) throw new ChatError(401, 'Đăng nhập Customer để phân tích ảnh thực phẩm.');
        res.locals.nutritionImageUserId = owner.userId;
        next();
      } catch (error) {
        failure(res, error);
      }
    },

    upload: async (
      req: Request,
      res: Response<ApiResponse<NutritionImagePrediction>>,
    ): Promise<void> => {
      res.setHeader('Cache-Control', 'no-store');
      try {
        const userId = res.locals.nutritionImageUserId;
        if (typeof userId !== 'number' || !Number.isSafeInteger(userId)) throw new ChatError(401, 'Đăng nhập Customer để phân tích ảnh thực phẩm.');
        const result = await service.analyze(userId, req.body, req.get('content-type') ?? '');
        res.status(201).json({ success: true, data: result });
      } catch (error) {
        failure(res, error);
      }
    },

    image: async (req: Request<{ filename: string }>, res: Response): Promise<void> => {
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      try {
        const userId = res.locals.nutritionImageUserId;
        if (typeof userId !== 'number' || !Number.isSafeInteger(userId)) throw new ChatError(401, 'Đăng nhập Customer để xem ảnh đã tải lên.');
        const result = await service.getImage(userId, req.params.filename);
        res.type(result.mimeType).send(result.image);
      } catch (error) {
        failure(res, error);
      }
    },
  };
}

export function parseImageBody(req: Request, res: Response, next: NextFunction): void {
  express.raw({
    type: () => true,
    limit: config.nutritionImage.maxUploadBytes,
  })(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }
    if (typeof error === 'object' && error !== null && 'type' in error && error.type === 'entity.too.large') {
      res.status(413).json({ success: false, message: 'Ảnh vượt quá dung lượng tối đa 5 MB.' });
      return;
    }
    next(error);
  });
}
