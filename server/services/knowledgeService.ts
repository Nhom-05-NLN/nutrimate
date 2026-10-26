import type { ChatbotKnowledge } from '../types/index.js';
import { createKnowledgeEntry, deleteKnowledgeEntry, listKnowledgeEntries, updateKnowledgeEntry } from '../repositories/chatRepository.js';

export type KnowledgePayload = {
  intentTag?: string;
  keywordPatterns?: string[] | string;
  answerTemplate?: string;
  recommendedCategory?: string;
};

const validCategories = new Set(['all', 'low-carb', 'high-protein', 'sugar-free']);

function toKeywordArray(value: string[] | string | undefined): string[] {
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function normalizeKnowledgePayload(input: KnowledgePayload): Omit<ChatbotKnowledge, 'id'> {
  const intentTag = (input.intentTag ?? '').trim();
  if (!intentTag || intentTag.length > 50) {
    throw new Error('Mã intent phải có từ 1 đến 50 ký tự.');
  }

  const keywordPatterns = toKeywordArray(input.keywordPatterns);
  if (keywordPatterns.length === 0 || keywordPatterns.length > 30) {
    throw new Error('Cần ít nhất 1 và tối đa 30 từ khóa.');
  }

  const answerTemplate = (input.answerTemplate ?? '').trim();
  if (!answerTemplate || answerTemplate.length > 4000) {
    throw new Error('Nội dung câu trả lời phải có từ 1 đến 4000 ký tự.');
  }

  const recommendedCategory = (input.recommendedCategory ?? '').trim();
  const safeCategory = recommendedCategory && validCategories.has(recommendedCategory)
    ? recommendedCategory as ChatbotKnowledge['recommendedCategory']
    : undefined;

  return {
    intentTag,
    keywordPatterns,
    answerTemplate,
    recommendedCategory: safeCategory,
  };
}

export async function listKnowledge(): Promise<ChatbotKnowledge[]> {
  return listKnowledgeEntries();
}

export async function createKnowledge(input: KnowledgePayload): Promise<ChatbotKnowledge> {
  return createKnowledgeEntry(normalizeKnowledgePayload(input));
}

export async function updateKnowledge(id: number, input: KnowledgePayload): Promise<ChatbotKnowledge> {
  const normalized = normalizeKnowledgePayload(input);
  const updated = await updateKnowledgeEntry(id, normalized);
  if (!updated) {
    throw new Error('Tri thức cần cập nhật không tồn tại.');
  }
  return updated;
}

export async function removeKnowledge(id: number): Promise<boolean> {
  return deleteKnowledgeEntry(id);
}
