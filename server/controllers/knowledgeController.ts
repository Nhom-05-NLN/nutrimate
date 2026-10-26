import type { Request, Response } from 'express';
import * as knowledgeService from '../services/knowledgeService.js';
import type { ApiResponse, KnowledgeBaseEntry } from '../types/index.js';

function logKnowledgeFailure(action: string, error: unknown): void {
  const code = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
    ? error.code
    : 'unknown';
  console.error(`[KnowledgeController] ${action} failed (code: ${code})`);
}

export async function listKnowledge(_req: Request, res: Response<ApiResponse<KnowledgeBaseEntry[]>>): Promise<void> {
  try {
    const data = await knowledgeService.listKnowledge();
    res.json({ success: true, total: data.length, data });
  } catch (error: unknown) {
    logKnowledgeFailure('List knowledge', error);
    res.status(500).json({ success: false, message: 'Không thể tải tri thức dinh dưỡng.' });
  }
}

export async function createKnowledge(req: Request, res: Response<ApiResponse<KnowledgeBaseEntry>>): Promise<void> {
  try {
    const payload = req.body ?? {};
    const data = await knowledgeService.createKnowledge(payload);
    res.status(201).json({ success: true, data });
  } catch (error: unknown) {
    if (error instanceof knowledgeService.KnowledgeValidationError) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    logKnowledgeFailure('Create knowledge', error);
    res.status(500).json({ success: false, message: 'Không thể lưu tri thức mới.' });
  }
}

export async function importKnowledge(req: Request, res: Response<ApiResponse<{ imported: number; skipped: number; total: number }>>): Promise<void> {
  try {
    const data = await knowledgeService.importKnowledge(req.body);
    res.json({ success: true, data });
  } catch (error: unknown) {
    if (error instanceof knowledgeService.KnowledgeValidationError) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    logKnowledgeFailure('Import knowledge file', error);
    res.status(500).json({ success: false, message: 'Không thể nhập file tri thức.' });
  }
}

export async function updateKnowledge(req: Request<{ id: string }>, res: Response<ApiResponse<KnowledgeBaseEntry>>): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ success: false, message: 'Mã tri thức không hợp lệ.' });
      return;
    }

    const data = await knowledgeService.updateKnowledge(id, req.body ?? {});
    res.json({ success: true, data });
  } catch (error: unknown) {
    if (error instanceof knowledgeService.KnowledgeValidationError) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    if (error instanceof knowledgeService.KnowledgeNotFoundError) {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    logKnowledgeFailure('Update knowledge', error);
    res.status(500).json({ success: false, message: 'Không thể cập nhật tri thức.' });
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
    logKnowledgeFailure('Delete knowledge', error);
    res.status(500).json({ success: false, message: 'Không thể xóa tri thức.' });
  }
}
