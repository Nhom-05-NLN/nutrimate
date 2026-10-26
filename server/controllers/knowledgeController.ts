import type { Request, Response } from 'express';
import * as knowledgeService from '../services/knowledgeService.js';
import type { ApiResponse, ChatbotKnowledge } from '../types/index.js';

export async function listKnowledge(_req: Request, res: Response<ApiResponse<ChatbotKnowledge[]>>): Promise<void> {
  try {
    const data = await knowledgeService.listKnowledge();
    res.json({ success: true, total: data.length, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Không thể tải tri thức dinh dưỡng.';
    res.status(500).json({ success: false, message });
  }
}

export async function createKnowledge(req: Request, res: Response<ApiResponse<ChatbotKnowledge>>): Promise<void> {
  try {
    const payload = req.body ?? {};
    const data = await knowledgeService.createKnowledge(payload);
    res.status(201).json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Không thể lưu tri thức mới.';
    res.status(400).json({ success: false, message });
  }
}

export async function updateKnowledge(req: Request<{ id: string }>, res: Response<ApiResponse<ChatbotKnowledge>>): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ success: false, message: 'Mã tri thức không hợp lệ.' });
      return;
    }

    const data = await knowledgeService.updateKnowledge(id, req.body ?? {});
    res.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Không thể cập nhật tri thức.';
    const status = message.includes('không tồn tại') ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
}

export async function deleteKnowledge(req: Request<{ id: string }>, res: Response<ApiResponse<{ deleted: boolean; id: number }>>): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ success: false, message: 'Mã tri thức không hợp lệ.' });
      return;
    }

    const deleted = await knowledgeService.removeKnowledge(id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Tri thức cần xóa không tồn tại.' });
      return;
    }

    res.json({ success: true, data: { deleted: true, id } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Không thể xóa tri thức.';
    res.status(400).json({ success: false, message });
  }
}
