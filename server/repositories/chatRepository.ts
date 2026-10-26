import { ChatbotKnowledge } from '../types/index.js';
import { INITIAL_CHAT_KNOWLEDGE } from '../db/seedData.js';
import { isDbConnected, queryPostgres } from '../db/index.js';

interface KnowledgeRow {
  id: number;
  intent_tag: string;
  keyword_patterns: string[];
  answer_template: string;
  recommended_category: string | null;
}

export type KnowledgeInput = Omit<ChatbotKnowledge, 'id'>;

let fallbackKnowledge: ChatbotKnowledge[] = [...INITIAL_CHAT_KNOWLEDGE];

function normalizeKnowledgeRow(row: KnowledgeRow): ChatbotKnowledge {
  return {
    id: row.id,
    intentTag: row.intent_tag,
    keywordPatterns: Array.isArray(row.keyword_patterns) ? row.keyword_patterns : [],
    answerTemplate: row.answer_template,
    recommendedCategory: (row.recommended_category as ChatbotKnowledge['recommendedCategory']) || undefined,
  };
}

export async function getAllKnowledge(requirePostgres = false, executeQuery = queryPostgres): Promise<ChatbotKnowledge[]> {
  if (requirePostgres || isDbConnected()) {
    try {
      const sql = `
        SELECT id, intent_tag, keyword_patterns, answer_template, recommended_category
        FROM chatbot_knowledge
        ORDER BY id DESC
      `;
      const res = await executeQuery<KnowledgeRow>(sql);
      if (requirePostgres || res.rows.length > 0) {
        return res.rows.map(normalizeKnowledgeRow);
      }
    } catch (err: unknown) {
      if (requirePostgres) throw err;
      const msg = err instanceof Error ? err.message : 'Knowledge query error';
      console.warn('[ChatRepository Fallback]:', msg);
    }
  }

  return [...fallbackKnowledge];
}

export async function listKnowledgeEntries(requirePostgres = false, executeQuery = queryPostgres): Promise<ChatbotKnowledge[]> {
  return getAllKnowledge(requirePostgres, executeQuery);
}

export async function createKnowledgeEntry(input: KnowledgeInput, executeQuery = queryPostgres): Promise<ChatbotKnowledge> {
  if (isDbConnected()) {
    try {
      const res = await executeQuery<KnowledgeRow>(
        `INSERT INTO chatbot_knowledge (intent_tag, keyword_patterns, answer_template, recommended_category)
         VALUES ($1, $2, $3, $4)
         RETURNING id, intent_tag, keyword_patterns, answer_template, recommended_category`,
        [input.intentTag, input.keywordPatterns, input.answerTemplate, input.recommendedCategory ?? null],
      );
      if (!res.rows[0]) {
        throw new Error('Không thể lưu tri thức mới.');
      }
      return normalizeKnowledgeRow(res.rows[0]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể lưu tri thức mới.';
      throw new Error(message);
    }
  }

  const created: ChatbotKnowledge = {
    id: Date.now(),
    intentTag: input.intentTag,
    keywordPatterns: [...input.keywordPatterns],
    answerTemplate: input.answerTemplate,
    recommendedCategory: input.recommendedCategory,
  };
  fallbackKnowledge = [created, ...fallbackKnowledge];
  return created;
}

export async function updateKnowledgeEntry(id: number, input: Partial<KnowledgeInput>, executeQuery = queryPostgres): Promise<ChatbotKnowledge | null> {
  if (isDbConnected()) {
    try {
      const normalized = Object.fromEntries(
        Object.entries(input).filter(([, value]) => value !== undefined),
      ) as Partial<KnowledgeInput>;
      if (Object.keys(normalized).length === 0) {
        return null;
      }

      const res = await executeQuery<KnowledgeRow>(
        `UPDATE chatbot_knowledge
         SET intent_tag = COALESCE($2, intent_tag),
             keyword_patterns = COALESCE($3, keyword_patterns),
             answer_template = COALESCE($4, answer_template),
             recommended_category = COALESCE($5, recommended_category)
         WHERE id = $1
         RETURNING id, intent_tag, keyword_patterns, answer_template, recommended_category`,
        [
          id,
          normalized.intentTag ?? null,
          normalized.keywordPatterns ?? null,
          normalized.answerTemplate ?? null,
          normalized.recommendedCategory ?? null,
        ],
      );
      return res.rows[0] ? normalizeKnowledgeRow(res.rows[0]) : null;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể cập nhật tri thức.';
      throw new Error(message);
    }
  }

  const index = fallbackKnowledge.findIndex((entry) => entry.id === id);
  if (index === -1) return null;

  const previous = fallbackKnowledge[index];
  if (!previous) return null;

  const next: ChatbotKnowledge = {
    id: previous.id,
    intentTag: input.intentTag ?? previous.intentTag,
    keywordPatterns: input.keywordPatterns ? [...input.keywordPatterns] : previous.keywordPatterns,
    answerTemplate: input.answerTemplate ?? previous.answerTemplate,
    recommendedCategory: input.recommendedCategory ?? previous.recommendedCategory,
  };
  fallbackKnowledge[index] = next;
  return next;
}

export async function deleteKnowledgeEntry(id: number, executeQuery = queryPostgres): Promise<boolean> {
  if (isDbConnected()) {
    try {
      const res = await executeQuery<{ id: number }>(
        'DELETE FROM chatbot_knowledge WHERE id = $1 RETURNING id',
        [id],
      );
      return Boolean(res.rowCount && res.rowCount > 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể xóa tri thức.';
      throw new Error(message);
    }
  }

  const before = fallbackKnowledge.length;
  fallbackKnowledge = fallbackKnowledge.filter((entry) => entry.id !== id);
  return fallbackKnowledge.length !== before;
}
