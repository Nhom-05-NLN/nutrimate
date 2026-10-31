import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { createChatTestDatabase } from './chatTestDatabase.js';
import { ChatConversationRepository } from '../server/repositories/chatConversationRepository.js';
import { createChatService } from '../server/services/chatService.js';
import { ChatError } from '../server/types/chat.js';

test('PostgreSQL: additive migration, ownership, atomic history, rollback and idempotency', { skip: process.env.CHAT_TEST_POSTGRES !== '1' }, async () => {
  const database = await createChatTestDatabase();
  try {
    const repository = new ChatConversationRepository(database.pool);
    const owner = { userId: 1, guestHash: null } as const;
    const other = { userId: 2, guestHash: null } as const;
    const conversation = await repository.create(owner);
    let aiFails = false;
    let aiCalls = 0;
    const service = createChatService(repository, async () => {
      aiCalls++;
      if (aiFails) throw new ChatError(504, 'AI timeout');
      return 'Phản hồi kiểm thử';
    }, async () => ({ products: [], knowledge: '' }));
    await assert.rejects(repository.history(conversation.id, other), ChatError);
    await assert.rejects(service.ask(other, conversation.id, randomUUID(), 'Unauthorized'), ChatError);
    const requestId = randomUUID();
    await service.ask(owner, conversation.id, requestId, 'Câu hỏi');
    await service.ask(owner, conversation.id, requestId, 'Câu hỏi');
    assert.equal(aiCalls, 1);
    assert.equal((await repository.history(conversation.id, owner)).length, 2);
    aiFails = true;
    await assert.rejects(service.ask(owner, conversation.id, randomUUID(), 'Failure'), ChatError);
    assert.equal((await repository.history(conversation.id, owner)).length, 2);
    const history = await repository.history(conversation.id, owner);
    assert.equal((await repository.history(conversation.id, owner, history[1]!.id)).length, 1);
    assert.equal((await repository.list(other)).length, 0);
    aiFails = false;
    for (let index = 0; index < 26; index++) await service.ask(owner, conversation.id, randomUUID(), `Question ${index}`);
    const latest = await repository.history(conversation.id, owner);
    assert.equal(latest.length, 50);
    assert.equal(latest.at(-2)?.content, 'Question 25');
    assert.equal((await repository.history(conversation.id, owner, latest[0]!.id)).length, 4);
  } finally { await database.close(); }
});
