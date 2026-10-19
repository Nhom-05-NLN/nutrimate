import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { after, before, test } from 'node:test';
import express from 'express';
import type { PoolClient } from 'pg';
import { config } from '../server/config.js';
import { createChatController } from '../server/controllers/chatController.js';
import { createChatIdentity, verifyCustomerJwt } from '../server/middleware/chatIdentity.js';
import { ChatConversationRepository } from '../server/repositories/chatConversationRepository.js';
import { boundedContext, createChatService } from '../server/services/chatService.js';
import { generateChatReply, type LlmMessage } from '../server/services/chatLlmService.js';
import { CHAT_DISCLAIMER, ChatError, type ChatOwner, type Conversation, type StoredChatMessage } from '../server/types/chat.js';
import { getAllKnowledge } from '../server/repositories/chatRepository.js';
import { findProducts } from '../server/repositories/productRepository.js';
import type { queryPostgres } from '../server/db/index.js';
import type { Product } from '../server/types/index.js';

// Transactional test double. PostgreSQL engine behavior has a separate opt-in suite.
class MemoryRepository extends ChatConversationRepository {
  records = new Map<string, { owner: ChatOwner; conversation: Conversation; messages: StoredChatMessage[] }>();
  override async create(owner: ChatOwner) {
    const conversation = { id: randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.records.set(conversation.id, { owner, conversation, messages: [] });
    return conversation;
  }
  owned(id: string, owner: ChatOwner) {
    const row = this.records.get(id);
    if (!row || JSON.stringify(row.owner) !== JSON.stringify(owner)) throw new ChatError(404, 'Không tìm thấy hội thoại của bạn.');
    return row;
  }
  override async list(owner: ChatOwner) { return [...this.records.values()].filter(row => JSON.stringify(row.owner) === JSON.stringify(owner)).map(row => row.conversation); }
  override async history(id: string, owner: ChatOwner) { return this.owned(id, owner).messages; }
  override async turn<T>(id: string, owner: ChatOwner, work: (client: PoolClient) => Promise<T>) {
    const row = this.owned(id, owner);
    const snapshot = [...row.messages];
    try { return await work({} as PoolClient); }
    catch (error) { row.messages = snapshot; throw error; }
  }
  override async existing(_client: PoolClient, id: string, requestId: string) { return this.records.get(id)!.messages.filter(message => message.requestId === requestId); }
  override async recent(_client: PoolClient, id: string, limit: number) { return this.records.get(id)!.messages.slice(-limit); }
  override async save(_client: PoolClient, id: string, requestId: string, content: string, reply: string, products: Product[]) {
    const saved: StoredChatMessage[] = [
      { id: randomUUID(), role: 'user', content, requestId, createdAt: new Date().toISOString(), suggestedProducts: [] },
      { id: randomUUID(), role: 'assistant', content: reply, requestId, createdAt: new Date().toISOString(), suggestedProducts: products },
    ];
    this.records.get(id)!.messages.push(...saved);
    return saved;
  }
}
const repository = new MemoryRepository();
const originalSettings = { ...config.chat };
const secret = 'synthetic-test-secret-with-at-least-32-characters';
let aiCalls = 0;
let aiFailure = false;
let databaseFailure = false;
let captured: LlmMessage[] = [];
const service = createChatService(repository, async messages => {
  aiCalls++;
  captured = messages;
  if (aiFailure) throw new ChatError(504, 'AI phản hồi quá lâu.');
  return 'Hãy cung cấp thêm mục tiêu dinh dưỡng của bạn.';
}, async () => {
  if (databaseFailure) throw new Error('Private database detail');
  return { products: [], knowledge: '' };
});
const identity = createChatIdentity(async id => id === 9 ? 'admin' : id <= 2 ? 'customer' : undefined);
const controller = createChatController(service, identity);
const app = express();
app.use(express.json());
app.post('/api/chat/conversations', controller.create);
app.get('/api/chat/conversations', controller.list);
app.get('/api/chat/conversations/:id/messages', controller.history);
app.post('/api/chat/conversations/:id/messages', controller.ask);
app.post('/api/chat/ask', controller.ask);
const server = app.listen(0, '127.0.0.1');
let base = '';
before(async () => {
  config.chat.jwtSecret = secret;
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  base = `http://127.0.0.1:${address.port}/api/chat`;
});
after(async () => { Object.assign(config.chat, originalSettings); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); });

function jwt(sub = '1', exp = Math.floor(Date.now() / 1000) + 60, key = secret) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp })).toString('base64url');
  return `${header}.${payload}.${createHmac('sha256', key).update(`${header}.${payload}`).digest('base64url')}`;
}
async function request(path: string, body?: unknown, authorization?: string, cookie?: string) {
  return fetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: {
    'Content-Type': 'application/json', ...(authorization ? { Authorization: `Bearer ${authorization}` } : {}), ...(cookie ? { Cookie: cookie } : {}),
  }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
async function create(token = jwt()) {
  const response = await request('/conversations', {}, token);
  assert.equal(response.status, 201);
  return (await response.json()).data.id as string;
}

test('Customer: successful chat persists user/assistant, history and multi-turn context', async () => {
  const id = await create();
  const response = await request('/ask', { conversationId: id, requestId: randomUUID(), message: 'Tôi muốn ăn uống hợp lý' }, jwt());
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.data.messages.length, 2);
  assert.deepEqual(body.data.messages.map((message: StoredChatMessage) => message.role), ['user', 'assistant']);
  assert.ok(body.data.reply.includes(CHAT_DISCLAIMER));
  await request(`/conversations/${id}/messages`, { requestId: randomUUID(), message: 'Còn bữa tối?' }, jwt());
  assert.equal(captured.length, 4);
  assert.equal(captured[1]?.content, 'Tôi muốn ăn uống hợp lý');
  const history = await request(`/conversations/${id}/messages`, undefined, jwt());
  assert.equal((await history.json()).data.messages.length, 4);
});
test('empty, non-string and oversized questions return 400 without calling AI', async () => {
  const id = await create();
  const beforeCalls = aiCalls;
  for (const message of ['', '   ', 123, {}, 'x'.repeat(4001)]) {
    const response = await request('/ask', { conversationId: id, requestId: randomUUID(), message }, jwt());
    assert.equal(response.status, 400);
  }
  assert.equal(aiCalls, beforeCalls);
});
test('AI timeout rolls back; retry with the same request id succeeds exactly once', async () => {
  const id = await create();
  const body = { conversationId: id, requestId: randomUUID(), message: 'Tư vấn bữa sáng' };
  aiFailure = true;
  try { assert.equal((await request('/ask', body, jwt())).status, 504); }
  finally { aiFailure = false; }
  assert.equal(repository.records.get(id)!.messages.length, 0);
  assert.equal((await request('/ask', body, jwt())).status, 200);
  const beforeCalls = aiCalls;
  assert.equal((await request('/ask', body, jwt())).status, 200);
  assert.equal(aiCalls, beforeCalls);
  assert.equal(repository.records.get(id)!.messages.length, 2);
  assert.equal((await request('/ask', { ...body, message: 'Nội dung khác' }, jwt())).status, 409);
});
test('unauthenticated history/send is 401; explicit Guest can create, send and recover history', async () => {
  const id = await create();
  assert.equal((await request(`/conversations/${id}/messages`)).status, 401);
  assert.equal((await request('/ask', { conversationId: id, requestId: randomUUID(), message: 'Xin chào' })).status, 401);
  const response = await request('/conversations', {});
  assert.equal(response.status, 201);
  const header = response.headers.get('set-cookie')!;
  assert.ok(header.includes('HttpOnly') && header.includes('SameSite=Strict'));
  const cookie = header.split(';')[0]!;
  const guestId = (await response.json()).data.id;
  assert.equal((await request('/ask', { conversationId: guestId, requestId: randomUUID(), message: 'Xin chào' }, undefined, cookie)).status, 200);
  assert.equal((await request(`/conversations/${guestId}/messages`, undefined, undefined, cookie)).status, 200);
  assert.equal((await request(`/conversations/${id}/messages`, undefined, undefined, cookie)).status, 404);
  const otherGuest = await request('/conversations', {});
  const otherCookie = otherGuest.headers.get('set-cookie')!.split(';')[0]!;
  assert.equal((await request(`/conversations/${guestId}/messages`, undefined, undefined, otherCookie)).status, 404);
});
test('another Customer cannot read or send to the owner conversation; list is isolated', async () => {
  const id = await create();
  const beforeCalls = aiCalls;
  assert.equal((await request(`/conversations/${id}/messages`, undefined, jwt('2'))).status, 404);
  assert.equal((await request('/ask', { conversationId: id, requestId: randomUUID(), message: 'Xin chào' }, jwt('2'))).status, 404);
  assert.equal(aiCalls, beforeCalls);
  const list = await request('/conversations', undefined, jwt('2'));
  assert.ok(!(await list.json()).data.some((row: Conversation) => row.id === id));
});
test('invalid/expired JWT is rejected, never downgraded to Guest; Admin is forbidden', async () => {
  for (const token of ['bad', jwt('1', 1), jwt('1', Math.floor(Date.now() / 1000) + 60, 'wrong')]) {
    assert.equal((await request('/conversations', {}, token)).status, 401);
  }
  assert.equal((await request('/conversations', {}, jwt('9'))).status, 403);
  assert.equal((await request('/conversations', {}, jwt('100'))).status, 401);
  assert.throws(() => verifyCustomerJwt(jwt(), ''), ChatError);
});
test('database failure returns 503 without AI calls, fake products or internal details', async () => {
  const id = await create();
  const beforeCalls = aiCalls;
  databaseFailure = true;
  try {
    const response = await request('/ask', { conversationId: id, requestId: randomUUID(), message: 'Có sản phẩm nào?' }, jwt());
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.data, undefined);
    assert.ok(!JSON.stringify(body).includes('Private database detail'));
  } finally { databaseFailure = false; }
  assert.equal(aiCalls, beforeCalls);
});
test('context is bounded by message count and chars, preserving latest complete pairs', () => {
  const history: StoredChatMessage[] = Array.from({ length: 100 }, (_, index) => ({
    id: String(index), role: index % 2 === 0 ? 'user' : 'assistant', content: 'x'.repeat(1000), createdAt: '', requestId: '', suggestedProducts: [],
  }));
  const context = boundedContext(history, 'latest question');
  assert.ok(context.length <= config.chat.maxContextMessages);
  assert.ok(context.reduce((sum, message) => sum + message.content.length, 0) <= config.chat.maxContextChars);
  assert.equal(context[0]?.role, 'user');
  assert.equal(context.at(-1)?.content, 'latest question');
});
test('strict repository mode returns genuine empty results and propagates database errors instead of seed data', async () => {
  const empty: typeof queryPostgres = async () => ({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });
  const unavailable: typeof queryPostgres = async () => { throw new Error('Database unavailable'); };
  assert.deepEqual(await getAllKnowledge(true, empty), []);
  assert.deepEqual(await findProducts({}, true, empty), []);
  await assert.rejects(getAllKnowledge(true, unavailable), /Database unavailable/);
  await assert.rejects(findProducts({}, true, unavailable), /Database unavailable/);
});
test('invalid IDs and cross-site requests are rejected without AI access', async () => {
  const beforeCalls = aiCalls;
  assert.equal((await request('/ask', { conversationId: 'not-an-id', requestId: randomUUID(), message: 'Hello' }, jwt())).status, 400);
  const response = await fetch(base + '/conversations', { method: 'POST', headers: { Origin: 'https://other.example.test', 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(response.status, 403);
  assert.equal(aiCalls, beforeCalls);
});
test('provider parses compatible response and rejects empty/error/timeout responses safely', async () => {
  Object.assign(config.chat, { apiKey: 'synthetic-test-key', model: 'test-model', baseUrl: 'https://llm.example.test/v1' });
  try {
    const good: typeof fetch = async (url, options) => {
      assert.equal(String(url), 'https://llm.example.test/v1/chat/completions');
      assert.ok(options);
      assert.ok(String((options.headers as Record<string, string>).Authorization).includes('synthetic-test-key'));
      return Response.json({ choices: [{ message: { content: 'Xin chào' } }] });
    };
    assert.equal(await generateChatReply([{ role: 'user', content: 'Hello' }], good), 'Xin chào');
    for (const fake of [async () => Response.json({ choices: [] }), async () => new Response('Secret provider failure', { status: 500 })]) {
      await assert.rejects(generateChatReply([], fake), (error: unknown) => error instanceof ChatError && error.status === 502 && !error.message.includes('Secret'));
    }
    await assert.rejects(generateChatReply([], async () => { throw new DOMException('timeout', 'TimeoutError'); }), (error: unknown) => error instanceof ChatError && error.status === 504);
    config.chat.apiKey = '';
    await assert.rejects(generateChatReply([], good), (error: unknown) => error instanceof ChatError && error.status === 503);
  } finally { Object.assign(config.chat, originalSettings, { jwtSecret: secret }); }
});
