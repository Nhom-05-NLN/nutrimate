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
