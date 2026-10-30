import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { createChatTestDatabase } from './chatTestDatabase.js';
import { ChatConversationRepository } from '../server/repositories/chatConversationRepository.js';
import { createChatService } from '../server/services/chatService.js';
import { CHAT_DISCLAIMER } from '../server/types/chat.js';

test('live Gemini + PostgreSQL: two turns, persisted history and idempotent retry', { skip: process.env.CHAT_TEST_LIVE !== '1' }, async () => {
  const database = await createChatTestDatabase();
  try {
    const repository = new ChatConversationRepository(database.pool);
    const service = createChatService(repository);
    const owner = { userId: null, guestHash: 'a'.repeat(64) } as const;
    const conversation = await service.create(owner);
    const firstId = randomUUID();
    const question = 'Chào NutriBot. Hãy chào lại ngắn gọn bằng tiếng Việt.';
    const first = await service.ask(owner, conversation.id, firstId, question);
    assert.ok(first.reply.includes(CHAT_DISCLAIMER));
    assert.ok(first.messages.some(message => message.role === 'assistant'));
    const retry = await service.ask(owner, conversation.id, firstId, question);
    assert.equal(retry.reply, first.reply);
    await service.ask(owner, conversation.id, randomUUID(), 'Tôi vừa chào bạn bằng ngôn ngữ nào? Trả lời một câu.');
    assert.equal((await service.history(conversation.id, owner)).length, 4);
  } finally { await database.close(); }
});
