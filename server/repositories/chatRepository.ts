import type { KnowledgeBaseEntry } from '../types/index.js';
import { queryPostgres } from '../db/index.js';

interface KnowledgeRow {
  knowledge_id: number;
  question: string | null;
  answer: string | null;
  category: string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
}

export type KnowledgeInput = {
  question: string;
  answer: string;
  category: string | null;
}

export interface KnowledgeImportResult {
  imported: number;
  skipped: number;
  total: number;
}

function normalizeKnowledgeRow(row: KnowledgeRow): KnowledgeBaseEntry {
  return {
    id: row.knowledge_id,
    question: row.question,
    answer: row.answer,
    category: row.category,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const knowledgeColumns = `
  knowledge_id, question, answer, category, created_at, updated_at
`;

export async function getAllKnowledge(executeQuery = queryPostgres): Promise<KnowledgeBaseEntry[]> {
  const result = await executeQuery<KnowledgeRow>(`
    SELECT ${knowledgeColumns}
    FROM knowledge_base
    ORDER BY knowledge_id DESC
  `);
  return result.rows.map(normalizeKnowledgeRow);
}

export async function listKnowledgeEntries(executeQuery = queryPostgres): Promise<KnowledgeBaseEntry[]> {
  return getAllKnowledge(executeQuery);
}

export async function createKnowledgeEntry(input: KnowledgeInput, executeQuery = queryPostgres): Promise<KnowledgeBaseEntry> {
  const result = await executeQuery<KnowledgeRow>(
    `INSERT INTO knowledge_base (question, answer, category, created_at, updated_at)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING ${knowledgeColumns}`,
    [input.question, input.answer, input.category],
  );
  if (!result.rows[0]) {
    throw new Error('Không thể lưu tri thức mới.');
  }
  return normalizeKnowledgeRow(result.rows[0]);
}

export async function importKnowledgeEntries(entries: KnowledgeInput[], executeQuery = queryPostgres): Promise<KnowledgeImportResult> {
  if (entries.length === 0) {
    return { imported: 0, skipped: 0, total: 0 };
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

  const result = await executeQuery<{ knowledge_id: number }>(
    `WITH incoming AS (
       SELECT DISTINCT ON (
         lower(btrim(sample.question)),
         lower(COALESCE(btrim(sample.category), ''))
       )
         sample.question,
         sample.answer,
         sample.category
       FROM jsonb_to_recordset($1::jsonb) AS sample(
         question TEXT,
         answer TEXT,
         category TEXT
       )
       ORDER BY
         lower(btrim(sample.question)),
         lower(COALESCE(btrim(sample.category), ''))
     ),
     new_entries AS (
       SELECT incoming.*
       FROM incoming
       WHERE NOT EXISTS (
         SELECT 1
         FROM knowledge_base existing
         WHERE lower(btrim(existing.question)) = lower(btrim(incoming.question))
           AND lower(COALESCE(btrim(existing.category), '')) = lower(COALESCE(btrim(incoming.category), ''))
       )
     )
     INSERT INTO knowledge_base (question, answer, category, created_at, updated_at)
     SELECT question, answer, category, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
     FROM new_entries
     RETURNING knowledge_id`,
    [JSON.stringify(entries)],
  );

  const imported = result.rows.length;
  return {
    imported,
    skipped: entries.length - imported,
    total: entries.length,
  };
}

export async function updateKnowledgeEntry(id: number, input: KnowledgeInput, executeQuery = queryPostgres): Promise<KnowledgeBaseEntry | null> {
  const result = await executeQuery<KnowledgeRow>(
    `UPDATE knowledge_base
     SET question = $2,
         answer = $3,
         category = $4,
         updated_at = CURRENT_TIMESTAMP
     WHERE knowledge_id = $1
     RETURNING ${knowledgeColumns}`,
    [id, input.question, input.answer, input.category],
  );
  return result.rows[0] ? normalizeKnowledgeRow(result.rows[0]) : null;
}

export async function deleteKnowledgeEntry(id: number, executeQuery = queryPostgres): Promise<boolean> {
  const result = await executeQuery<{ knowledge_id: number }>(
    'DELETE FROM knowledge_base WHERE knowledge_id = $1 RETURNING knowledge_id',
    [id],
  );
  return Boolean(result.rowCount && result.rowCount > 0);
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
