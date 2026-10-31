import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { getPool } from '../db/index.js';
import { ChatError, type ChatOwner, type ChatSuggestedProduct, type Conversation, type StoredChatMessage } from '../types/chat.js';

const ownerClause = '(user_id = $2 OR (user_id IS NULL AND guest_owner_hash = $3))';
const messageColumns = 'id::text, role, content, created_at AS "createdAt", request_id AS "requestId", suggested_products AS "suggestedProducts"';

export class ChatConversationRepository {
  constructor(private pool: Pool = getPool()) {}
  async create(owner: ChatOwner): Promise<Conversation> {
    const result = await this.pool.query<Conversation>(
      'INSERT INTO chat_conversations (id, user_id, guest_owner_hash) VALUES ($1, $2, $3) RETURNING id, created_at AS "createdAt", updated_at AS "updatedAt"',
      [randomUUID(), owner.userId, owner.guestHash],
    );
    return result.rows[0]!;
  }
  async list(owner: ChatOwner): Promise<Conversation[]> {
    const result = await this.pool.query<Conversation>(
      'SELECT id, created_at AS "createdAt", updated_at AS "updatedAt" FROM chat_conversations WHERE user_id = $1 OR (user_id IS NULL AND guest_owner_hash = $2) ORDER BY updated_at DESC, id DESC LIMIT 50',
      [owner.userId, owner.guestHash],
    );
    return result.rows;
  }
  async history(id: string, owner: ChatOwner, before?: string): Promise<StoredChatMessage[]> {
    const result = await this.pool.query<{ messages: StoredChatMessage[] }>(
      `SELECT COALESCE((SELECT json_agg(m ORDER BY m.id::bigint) FROM
       (SELECT ${messageColumns} FROM chat_messages WHERE conversation_id = c.id
        AND ($4::bigint IS NULL OR id < $4::bigint) ORDER BY chat_messages.id DESC LIMIT 50) m), '[]'::json) AS messages
       FROM chat_conversations c WHERE id = $1 AND ${ownerClause}`,
      [id, owner.userId, owner.guestHash, before || null],
    );
    if (!result.rows[0]) throw new ChatError(404, 'Không tìm thấy hội thoại của bạn.');
    return result.rows[0].messages;
  }
  async turn<T>(id: string, owner: ChatOwner, work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SET LOCAL statement_timeout = '5s'");
      const result = await client.query(
        `SELECT id FROM chat_conversations WHERE id = $1 AND ${ownerClause} FOR UPDATE NOWAIT`,
        [id, owner.userId, owner.guestHash],
      );
      if (!result.rowCount) throw new ChatError(404, 'Không tìm thấy hội thoại của bạn.');
      const value = await work(client);
      await client.query('COMMIT');
      return value;
    } catch (error) {
      await client.query('ROLLBACK');
      if (error && typeof error === 'object' && 'code' in error && error.code === '55P03') {
        throw new ChatError(409, 'Hội thoại đang xử lý tin nhắn khác. Vui lòng thử lại.');
      }
      throw error;
    } finally { client.release(); }
  }
  async recent(client: PoolClient, id: string, limit: number): Promise<StoredChatMessage[]> {
    const result = await client.query<StoredChatMessage>(
      `SELECT ${messageColumns} FROM chat_messages WHERE conversation_id = $1 ORDER BY chat_messages.id DESC LIMIT $2`, [id, limit],
    );
    return result.rows.reverse();
  }
  async existing(client: PoolClient, id: string, requestId: string): Promise<StoredChatMessage[]> {
    const result = await client.query<StoredChatMessage>(
      `SELECT ${messageColumns} FROM chat_messages WHERE conversation_id = $1 AND request_id = $2 ORDER BY chat_messages.id`, [id, requestId],
    );
    return result.rows;
  }
  async save(client: PoolClient, id: string, requestId: string, content: string, reply: string, products: ChatSuggestedProduct[]): Promise<StoredChatMessage[]> {
    const result = await client.query<StoredChatMessage>(
      `INSERT INTO chat_messages (conversation_id, request_id, role, content, suggested_products)
       VALUES ($1, $2, 'user', $3, '[]'::jsonb), ($1, $2, 'assistant', $4, $5::jsonb)
       RETURNING ${messageColumns}`, [id, requestId, content, reply, JSON.stringify(products)],
    );
    await client.query('UPDATE chat_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
    return result.rows;
  }
}
