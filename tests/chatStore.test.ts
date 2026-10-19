import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { useChatStore } from '../src/stores/chatStore';
import { useAuthStore } from '../src/stores/authStore';

const fixtureConversation = { id: 'existing', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
function ok(data: unknown) { return Response.json({ success: true, data }); }

test('opening Guest widget bootstraps before listing/history, with no probing 401', async () => {
  setActivePinia(createPinia());
  const original = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = async (url, options) => {
    calls.push(`${options?.method || 'GET'} ${url}`);
    if (String(url).endsWith('/session')) { assert.equal(options?.credentials, 'same-origin'); return ok({ kind: 'guest', created: true }); }
    if (String(url).endsWith('/messages')) return ok({ messages: [] });
    if (options?.method === 'POST') return ok(fixtureConversation);
    return ok([]);
  };
  try {
    const store = useChatStore();
    await store.initialize();
    assert.deepEqual(calls, ['POST /api/chat/session', 'GET /api/chat/conversations', 'POST /api/chat/conversations', 'GET /api/chat/conversations/existing/messages']);
    assert.equal(store.error, '');
    assert.equal(store.conversationId, 'existing');
  } finally { globalThis.fetch = original; }
});

test('restoring Guest session loads its history without creating a second conversation', async () => {
  setActivePinia(createPinia());
  const original = globalThis.fetch;
  let creations = 0;
  globalThis.fetch = async (url, options) => {
    if (String(url).endsWith('/session')) return ok({ kind: 'guest', created: false });
    if (String(url).endsWith('/messages')) return ok({ messages: [{ id: '1', role: 'user', content: 'Previous Guest question', createdAt: new Date().toISOString(), requestId: 'old', suggestedProducts: [] }] });
    if (options?.method === 'POST') creations++;
    return ok([fixtureConversation]);
  };
  try {
    const store = useChatStore();
    await store.initialize();
    assert.equal(creations, 0);
    assert.equal(store.messages[0]?.text, 'Previous Guest question');
  } finally { globalThis.fetch = original; }
});

test('Customer sends JWT on session/list/history; expired JWT preserves context and never creates Guest', async () => {
  setActivePinia(createPinia());
  const original = globalThis.fetch;
  const auth = useAuthStore();
  auth.accessToken = 'customer-jwt';
  let expired = false;
  const calls: string[] = [];
  globalThis.fetch = async (url, options) => {
    calls.push(String(url));
    assert.ok(options);
    assert.equal((options.headers as Record<string, string>).Authorization, 'Bearer customer-jwt');
    if (expired) return Response.json({ success: false, message: 'Token expired' }, { status: 401 });
    if (String(url).endsWith('/session')) return ok({ kind: 'customer', created: false });
    if (String(url).endsWith('/messages')) return ok({ messages: [{ id: '1', role: 'user', content: 'Private Customer context', createdAt: new Date().toISOString(), requestId: 'old', suggestedProducts: [] }] });
    return ok([fixtureConversation]);
  };
  try {
    const store = useChatStore();
    await store.initialize();
    assert.equal(store.messages[0]?.text, 'Private Customer context');
    expired = true;
    const before = calls.length;
    await store.initialize();
    assert.equal(calls.length, before + 1);
    assert.equal(store.requiresAuthentication, true);
    assert.equal(store.guestSessionExpired, false);
    assert.equal(auth.accessToken, 'customer-jwt');
    assert.equal(store.conversationId, 'existing');
    assert.equal(store.messages[0]?.text, 'Private Customer context');
    await store.sendMessage('Must not send');
    await store.restartGuestSession();
    assert.equal(calls.length, before + 1);
    assert.match(store.error, /đăng nhập lại/);
  } finally { globalThis.fetch = original; }
});

test('expired Guest pauses the old context and starts fresh only after explicit recovery', async () => {
  setActivePinia(createPinia());
  const original = globalThis.fetch;
  let expired = false;
  globalThis.fetch = async (url, options) => {
    if (String(url).endsWith('/session')) return ok({ kind: 'guest', created: expired });
    if (String(url).endsWith('/messages')) return ok({ messages: [] });
    if (String(url).endsWith('/ask')) return Response.json({ success: false, message: 'No cookie' }, { status: 401 });
    if (options?.method === 'POST') return ok({ ...fixtureConversation, id: 'new-session' });
    return ok(expired ? [] : [fixtureConversation]);
  };
  try {
    const store = useChatStore();
    await store.initialize();
    expired = true;
    await store.sendMessage('Unsent question');
    assert.equal(store.guestSessionExpired, true);
    assert.equal(store.conversationId, 'existing');
    await store.restartGuestSession();
    assert.equal(store.guestSessionExpired, false);
    assert.equal(store.conversationId, 'new-session');
    assert.ok(!store.messages.some(message => message.text === 'Unsent question'));
  } finally { globalThis.fetch = original; }
});

test('widget store rejects empty input and retries a failed request with the same id, without duplicating user messages', async () => {
  setActivePinia(createPinia());
  const original = globalThis.fetch;
  let asks = 0;
  const requestIds: string[] = [];
  globalThis.fetch = async (_url, options) => {
    if (String(_url).endsWith('/session')) return Response.json({ success: true, data: { kind: 'guest', created: true } });
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
    if (String(_url).endsWith('/session')) return Response.json({ success: true, data: { kind: 'guest', created: true } });
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
