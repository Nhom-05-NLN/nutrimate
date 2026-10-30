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

export async function getAllKnowledge(requirePostgres = false, executeQuery = queryPostgres): Promise<ChatbotKnowledge[]> {
  if (requirePostgres || isDbConnected()) {
    try {
      const sql = `
        SELECT id, intent_tag, keyword_patterns, answer_template, recommended_category
        FROM chatbot_knowledge
      `;
      const res = await executeQuery<KnowledgeRow>(sql);
      if (requirePostgres || res.rows.length > 0) {
        return res.rows.map((r) => ({
          id: r.id,
          intentTag: r.intent_tag,
          keywordPatterns: r.keyword_patterns,
          answerTemplate: r.answer_template,
          recommendedCategory: (r.recommended_category as ChatbotKnowledge['recommendedCategory']) || undefined,
        }));
      }
    } catch (err: unknown) {
      if (requirePostgres) throw err;
      const msg = err instanceof Error ? err.message : 'Knowledge query error';
      console.warn('[ChatRepository Fallback]:', msg);
    }
  }

  return INITIAL_CHAT_KNOWLEDGE;
}

export async function getChatKnowledge(executeQuery = queryPostgres): Promise<ChatbotKnowledge[]> {
  const schema = await executeQuery<{ chatbotKnowledge: string | null; knowledgeBase: string | null }>(
    `SELECT to_regclass('public.chatbot_knowledge') AS "chatbotKnowledge",
            to_regclass('public.knowledge_base') AS "knowledgeBase"`,
  );
  const tables = schema.rows[0];
  if (!tables) throw new Error('Không thể xác định bảng tri thức NutriBot.');

  if (tables.chatbotKnowledge) return getAllKnowledge(true, executeQuery);
  if (tables.knowledgeBase) {
    const result = await executeQuery<{
      id: number;
      intent_tag: string | null;
      keyword_patterns: string[];
      answer_template: string;
      recommended_category: string | null;
    }>(
      `SELECT knowledge_id AS id, category AS intent_tag,
              ARRAY[question]::text[] AS keyword_patterns, answer AS answer_template,
              NULL::text AS recommended_category
       FROM knowledge_base
       ORDER BY knowledge_id DESC
       LIMIT 100`,
    );
    return result.rows.map(row => ({
      id: row.id,
      intentTag: row.intent_tag || 'faq',
      keywordPatterns: row.keyword_patterns,
      answerTemplate: row.answer_template,
      recommendedCategory: undefined,
    }));
  }

  throw new Error('Không tìm thấy bảng tri thức NutriBot trong PostgreSQL.');
}
