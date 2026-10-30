import type { KnowledgeBaseEntry } from '../types/index.js';
import {
  createKnowledgeEntry,
  deleteKnowledgeEntry,
  importKnowledgeEntries,
  listKnowledgeEntries,
  updateKnowledgeEntry,
  type KnowledgeInput,
  type KnowledgeImportResult,
} from '../repositories/chatRepository.js';

export type KnowledgePayload = {
  question?: unknown;
  answer?: unknown;
  category?: unknown;
};

export class KnowledgeValidationError extends Error {}
export class KnowledgeNotFoundError extends Error {}

const MAX_IMPORT_ENTRIES = 500;

function extractImportEntries(input: unknown): unknown[] | null {
  if (Array.isArray(input)) return input;
  if (typeof input !== 'object' || input === null) return null;

  const record = input as Record<string, unknown>;
  for (const key of ['entries', 'questions', 'data', 'rows']) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }
  return null;
}

export function normalizeKnowledgePayload(input: KnowledgePayload): KnowledgeInput {
  if (typeof input.question !== 'string' || input.question.trim().length === 0) {
    throw new KnowledgeValidationError('Câu hỏi không được để trống.');
  }
  if (typeof input.answer !== 'string' || input.answer.trim().length === 0) {
    throw new KnowledgeValidationError('Câu trả lời không được để trống.');
  }
  if (input.category !== undefined && input.category !== null && typeof input.category !== 'string') {
    throw new KnowledgeValidationError('Danh mục không hợp lệ.');
  }

  const category = typeof input.category === 'string' ? input.category.trim() : '';
  if (category.length > 100) {
    throw new KnowledgeValidationError('Danh mục không được vượt quá 100 ký tự.');
  }

  return {
    question: input.question.trim(),
    answer: input.answer.trim(),
    category: category || null,
  };
}

export async function listKnowledge(): Promise<KnowledgeBaseEntry[]> {
  return listKnowledgeEntries();
}

export async function createKnowledge(input: KnowledgePayload): Promise<KnowledgeBaseEntry> {
  return createKnowledgeEntry(normalizeKnowledgePayload(input));
}

export async function importKnowledge(input: unknown): Promise<KnowledgeImportResult> {
  const entries = extractImportEntries(input);

  if (!entries) {
    throw new KnowledgeValidationError('File JSON cần là một mảng tri thức hoặc object có thuộc tính entries, questions, data hoặc rows.');
  }
  if (entries.length === 0 || entries.length > MAX_IMPORT_ENTRIES) {
    throw new KnowledgeValidationError(`File JSON phải có từ 1 đến ${MAX_IMPORT_ENTRIES} tri thức.`);
  }

  const normalized = entries.map((entry, index) => {
    try {
      if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
        throw new KnowledgeValidationError('Mỗi mục phải là một object.');
      }
      return normalizeKnowledgePayload(entry as KnowledgePayload);
    } catch (error: unknown) {
      if (error instanceof KnowledgeValidationError) {
        throw new KnowledgeValidationError(`Tri thức thứ ${index + 1}: ${error.message}`);
      }
      throw error;
    }
  });

  return importKnowledgeEntries(normalized);
}

export async function updateKnowledge(id: number, input: KnowledgePayload): Promise<KnowledgeBaseEntry> {
  const updated = await updateKnowledgeEntry(id, normalizeKnowledgePayload(input));
  if (!updated) {
    throw new KnowledgeNotFoundError('Tri thức cần cập nhật không tồn tại.');
  }
  return updated;
}

export async function removeKnowledge(id: number): Promise<boolean> {
  return deleteKnowledgeEntry(id);
}
