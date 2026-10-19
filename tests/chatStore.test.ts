import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { useChatStore } from '../src/stores/chatStore';
import { useAuthStore } from '../src/stores/authStore';

test('widget store rejects empty input and retries a failed request with the same id, without duplicating user messages', async () => {
  setActivePinia(createPinia());
  const original = globalThis.fetch;
  let asks = 0;
  const requestIds: string[] = [];
  globalThis.fetch = async (_url, options) => {
    if (String(_url).endsWith('/conversations')) return Response.json({ success: true, data: { id: 'conversation', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } });
    const body = JSON.parse(options?.body as string);
    requestIds.push(body.requestId);
    asks++;
    if (asks === 1) return Response.json({ success: false, message: 'AI chưa phản hồi' }, { status: 504 });
    return Response.json({ success: true, data: { conversationId: 'conversation', reply: 'Trả lời', suggestedProducts: [], messages: [
      { id: '1', role: 'user', content: body.message, requestId: body.requestId, createdAt: new Date().toISOString(), suggestedProducts: [] },
      { id: '2', role: 'assistant', content: 'Trả lời', requestId: body.requestId, createdAt: new Date().toISOString(), suggestedProducts: [] },
    ] } });
  };
  try {
    const store = useChatStore();
    await store.sendMessage('   ');
    assert.equal(asks, 0);
    await store.sendMessage('Xin chào');
    const failed = store.messages.find(message => message.failed)!;
    assert.ok(failed && store.error);
    await store.sendMessage(failed.text, failed.requestId);
    assert.equal(store.messages.filter(message => message.sender === 'user').length, 1);
    assert.equal(store.messages.at(-1)?.text, 'Trả lời');
    assert.equal(store.error, '');
    assert.equal(requestIds[0], requestIds[1]);
    assert.equal(store.isThinking, false);
  } finally { globalThis.fetch = original; }
});

test('changing identity clears private history and ignores an old in-flight response', async () => {
  setActivePinia(createPinia());
  const original = globalThis.fetch;
  let finish: ((response: Response) => void) | undefined;
  globalThis.fetch = async (_url, options) => {
    if (String(_url).endsWith('/conversations')) return Response.json({ success: true, data: { id: 'conversation', createdAt: '', updatedAt: '' } });
    return new Promise<Response>(resolve => { finish = () => resolve(Response.json({ success: true, data: {
      conversationId: 'conversation', messages: [{ id: '2', role: 'assistant', content: 'PRIVATE OLD RESPONSE', createdAt: new Date().toISOString(), suggestedProducts: [] }],
    } })); assert.ok(options?.body); });
  };
  try {
    const store = useChatStore();
    const sending = store.sendMessage('Old account question');
    while (!finish) await new Promise(resolve => setTimeout(resolve, 1));
    useAuthStore().accessToken = 'new-identity-token';
    await nextTick();
    finish(new Response());
    await sending;
    assert.ok(!store.messages.some(message => message.text.includes('PRIVATE') || message.text.includes('Old account')));
    assert.equal(store.conversationId, null);
  } finally { globalThis.fetch = original; }
});
