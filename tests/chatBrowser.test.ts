import assert from 'node:assert/strict';
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import pg from 'pg';
import { config } from '../server/config.js';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
function customerToken(id: number, seconds = 3600) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: String(id), exp: Math.floor(Date.now() / 1000) + seconds })).toString('base64url');
  return `${header}.${payload}.${createHmac('sha256', config.chat.jwtSecret).update(`${header}.${payload}`).digest('base64url')}`;
}

// Opt-in browser check against the running app, real PostgreSQL and real LLM.
// Only newly-created fixture rows are removed; existing application data is untouched.
test('real browser: Guest bootstrap/reload/chat, Customer JWT/history, expiry and ownership', { skip: process.env.CHAT_TEST_BROWSER !== '1', timeout: 120000 }, async () => {
  const base = process.env.CHAT_BROWSER_URL || 'http://127.0.0.1:3000';
  const profile = await mkdtemp(path.join(tmpdir(), 'nutrimate-chat-browser-'));
  const browser = spawn(process.env.CHAT_BROWSER_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
  ], { windowsHide: true, stdio: 'ignore' });
  const database = new pg.Client(config.db);
  let socket: WebSocket | undefined;
  let userId: number | undefined;
  let guestId: string | undefined;
  let guestHash: string | undefined;
  const email = `cn25-${randomUUID()}@example.invalid`;
  const statuses: { path: string; status: number }[] = [];
  try {
    await database.connect();
    const fixture = await database.query<{ id: number }>('INSERT INTO public.users (email, full_name, role) VALUES ($1, $2, $3) RETURNING id', [email, 'CN25 browser test', 'customer']);
    userId = fixture.rows[0]!.id;
    let port = '';
    for (let attempt = 0; attempt < 100; attempt++) {
      try { port = (await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]!; break; }
      catch { await delay(100); }
    }
    assert.ok(port, 'Headless browser must start');
    const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json() as { type: string; webSocketDebuggerUrl: string }[];
    socket = new WebSocket(pages.find(page => page.type === 'page')!.webSocketDebuggerUrl);
    await new Promise<void>((resolve, reject) => { socket!.addEventListener('open', () => resolve(), { once: true }); socket!.addEventListener('error', () => reject(new Error('CDP connection failed')), { once: true }); });
    let nextId = 0;
    const pending = new Map<number, (message: { result?: Record<string, unknown>; error?: unknown }) => void>();
    socket.addEventListener('message', event => {
      const message = JSON.parse(String(event.data));
      if (message.id) { pending.get(message.id)?.(message); pending.delete(message.id); }
      if (message.method === 'Network.responseReceived' && message.params.response.url.includes('/api/chat/')) {
        statuses.push({ path: new URL(message.params.response.url).pathname, status: message.params.response.status });
      }
    });
    async function call(method: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
      const id = ++nextId;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 45000);
        pending.set(id, message => { clearTimeout(timer); if (message.error) reject(new Error(`CDP failure: ${method}`)); else resolve(message.result || {}); });
        socket!.send(JSON.stringify({ id, method, params }));
      });
    }
    async function evaluate(expression: string) {
      const response = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (response.exceptionDetails) throw new Error('Browser script failed');
      return (response.result as { value: unknown })?.value;
    }
    async function until(expression: string, timeout = 45000) {
      const start = Date.now();
      while (Date.now() - start < timeout) { if (await evaluate(expression)) return; await delay(100); }
      throw new Error('Browser condition timed out');
    }
    const stores = "document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s";
    const chat = `${stores}.get('chat')`;
    const auth = `${stores}.get('auth')`;
    await call('Network.enable');
    await call('Page.enable');
    await call('Page.navigate', { url: base });
    await until("!!document.querySelector('[aria-label=\"Mở tư vấn NutriBot AI\"]')");
    await evaluate("document.querySelector('[aria-label=\"Mở tư vấn NutriBot AI\"]').click()");
    await until(`${chat}.conversationId && !${chat}.isThinking`);
    assert.equal(await evaluate(`${chat}.error`), '');
    assert.ok(!statuses.some(response => response.status >= 400), 'Guest opening must have no failed chat requests');
    guestId = await evaluate(`${chat}.conversationId`) as string;
    const cookies = await call('Network.getCookies', { urls: [`${base}/api/chat/session`] });
    const guestCookie = (cookies.cookies as { name: string; value: string; httpOnly: boolean }[]).find(cookie => cookie.name === 'nutrimate_guest')!;
    assert.equal(guestCookie.httpOnly, true);
    guestHash = createHash('sha256').update(guestCookie.value).digest('hex');
    await evaluate("(() => {const input=document.querySelector('[aria-label=\"Câu hỏi gửi NutriBot\"]'); input.value='Xin chào NutriBot. Trả lời một câu ngắn.'; input.dispatchEvent(new Event('input',{bubbles:true})); input.closest('form').requestSubmit();})()");
    await until(`${chat}.messages.some(m=>m.sender==='user') && !${chat}.isThinking`);
    assert.equal(await evaluate(`${chat}.error`), '');
    assert.equal(await evaluate(`${chat}.messages.filter(m=>m.requestId).length`), 2);
    await call('Page.reload');
    await until("!!document.querySelector('[aria-label=\"Mở tư vấn NutriBot AI\"]')");
    await evaluate("document.querySelector('[aria-label=\"Mở tư vấn NutriBot AI\"]').click()");
    await until(`${chat}.conversationId && !${chat}.isThinking`);
    assert.equal(await evaluate(`${chat}.conversationId`), guestId);
    assert.equal(await evaluate(`${chat}.messages.filter(m=>m.requestId).length`), 2);
    const validToken = customerToken(userId);
    await evaluate(`${auth}.login({...${auth}.currentUser,id:${JSON.stringify(String(userId))},name:'CN25 browser test',email:${JSON.stringify(email)}},${JSON.stringify(validToken)})`);
    await until(`${chat}.conversationId && ${chat}.conversationId!==${JSON.stringify(guestId)} && !${chat}.isThinking`);
    const customerId = await evaluate(`${chat}.conversationId`) as string;
    assert.equal(await evaluate(`${chat}.conversations.some(c=>c.id===${JSON.stringify(guestId)})`), false);
    await evaluate(`${chat}.sendMessage('Chào NutriBot, trả lời thật ngắn.')`);
    assert.equal(await evaluate(`${chat}.error`), '');
    assert.equal(await evaluate(`${chat}.messages.filter(m=>m.requestId).length`), 2);
    const foreign = await evaluate(`fetch('/api/chat/conversations/${guestId}/messages',{headers:{Authorization:'Bearer '+${JSON.stringify(validToken)}}}).then(r=>r.status)`);
    assert.equal(foreign, 404);
    await evaluate(`${auth}.accessToken=${JSON.stringify(customerToken(userId, 3))}`);
    await until(`${chat}.conversationId===${JSON.stringify(customerId)} && !${chat}.isThinking`);
    await delay(3100);
    await evaluate(`${chat}.initialize()`);
    assert.equal(await evaluate(`${chat}.requiresAuthentication`), true);
    assert.equal(await evaluate(`${chat}.guestSessionExpired`), false);
    assert.equal(await evaluate(`${chat}.conversationId`), customerId);
    assert.equal(await evaluate(`${chat}.messages.filter(m=>m.requestId).length`), 2);
    assert.equal(await evaluate("!!document.querySelector('[role=alert] a[href=\"/login\"]')"), true);
    await evaluate(`${auth}.logout()`);
    await until(`${chat}.conversationId===${JSON.stringify(guestId)} && !${chat}.isThinking`);
    assert.equal(await evaluate(`fetch('/api/chat/conversations/${customerId}/messages').then(r=>r.status)`), 404);
    console.log('Browser verified:', new URL(base).origin, 'Guest/JWT/history/expiry/isolation; expected denial responses only.');
  } finally {
    socket?.close();
    browser.kill();
    if (guestId && guestHash) await database.query('DELETE FROM public.chat_conversations WHERE id = $1 AND guest_owner_hash = $2', [guestId, guestHash]);
    if (userId) await database.query('DELETE FROM public.users WHERE id = $1 AND email = $2', [userId, email]);
    await database.end();
    if (path.resolve(profile).startsWith(path.join(tmpdir(), 'nutrimate-chat-browser-'))) {
      await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {});
    }
  }
});
