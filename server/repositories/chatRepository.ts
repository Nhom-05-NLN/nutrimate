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

export async function getAllKnowledge(): Promise<ChatbotKnowledge[]> {
  if (isDbConnected()) {
    try {
      const sql = `
        SELECT id, intent_tag, keyword_patterns, answer_template, recommended_category
        FROM chatbot_knowledge
      `;
      const res = await queryPostgres<KnowledgeRow>(sql);
      if (res.rows.length > 0) {
        return res.rows.map((r) => ({
          id: r.id,
          intentTag: r.intent_tag,
          keywordPatterns: r.keyword_patterns,
          answerTemplate: r.answer_template,
          recommendedCategory: (r.recommended_category as ChatbotKnowledge['recommendedCategory']) || undefined,
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Knowledge query error';
      console.warn('[ChatRepository Fallback]:', msg);
    }
  }

  return INITIAL_CHAT_KNOWLEDGE;
}
