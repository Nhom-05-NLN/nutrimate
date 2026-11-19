import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { createServer, type ViteDevServer } from 'vite';
import type { Order, OrderStatus } from '../src/types';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
const edgePath = process.env.ADMIN_ORDERS_BROWSER_PATH || process.env.CHAT_BROWSER_PATH
  || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profilePrefix = 'nutrimate-admin-orders-browser-';
const admin = {
  id: 'admin-1', name: 'Admin Browser', email: 'admin@example.invalid', phone: '0901111111', role: 'admin',
};

function createToken(): string {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: admin.id, role: admin.role, iat: now, exp: now + 3600 })}.mock-signature`;
}

function createOrders(): Order[] {
  const statuses: OrderStatus[] = [
    ...Array<OrderStatus>(9).fill('pending'), 'confirmed', 'confirmed', 'packing',
    'shipping', 'shipping', 'delivered', 'delivered', 'cancelled',
  ];
  return statuses.map((status, offset) => {
    const number = offset + 1;
    return {
      id: `order-${number}`,
      orderCode: number === 9 ? 'NM-UNIQ' : `NM-${String(number).padStart(4, '0')}`,
      createdAt: new Date(Date.UTC(2026, 0, 1, 8, number)).toISOString(),
      customer: {
        name: number === 9 ? 'Lan Unique' : `Khách ${number}`,
        phone: number === 9 ? '0912345678' : `09000000${String(number).padStart(2, '0')}`,
        email: `guest${number}@example.invalid`,
        address: '1 Nguyễn Huệ, TP.HCM',
      },
      items: [{ productId: `product-${number}`, productName: `Salad ${number}`, productImage: '', price: 99000, quantity: 1, calories: 320, protein: 18 }],
      totalAmount: 109000,
      totalCalories: 320,
      totalProtein: 18,
      shippingFee: 10000,
      shippingMethod: number % 5 === 0 ? 'express_2h' : 'standard',
      paymentMethod: number % 3 === 0 ? 'vietqr' : 'cod',
      paymentStatus: status === 'delivered' ? 'paid' : 'pending',
      status,
    };
  });
}

interface PausedRequest {
  requestId: string;
  request: { url: string; method: string; postData?: string; headers: Record<string, string> };
}
interface ApiCall {
  method: string;
  pathname: string;
  body?: string;
  headers: Record<string, string>;
}
interface Snapshot {
  path: string;
  rows: string[];
  summary: string | null;
  currentPage: string | null;
  pageButtons: string[];
  previousDisabled: boolean | null;
  nextDisabled: boolean | null;
  kpis: Record<string, string | null>;
  urgent: string | null;
}

// Opt in because Edge is not installed in every test environment.
// ADMIN_ORDERS_BROWSER_PATH may point to a different Edge/Chromium executable.
test('browser: /admin/orders pagination with isolated mock APIs', {
  skip: process.env.ADMIN_ORDERS_BROWSER_TEST !== '1',
  timeout: 180000,
}, async () => {
  const profile = await mkdtemp(path.join(tmpdir(), profilePrefix));
  let server: ViteDevServer | undefined;
  let browser: ChildProcess | undefined;
  let browserExit: Promise<void> | undefined;
  let socket: WebSocket | undefined;
  let orders = createOrders();
  let ordersDelayMs = 800;
  let leakedApiRequests = 0;
  const apiCalls: ApiCall[] = [];
  const unexpectedApiCalls: string[] = [];
  const blockedExternalRequests: string[] = [];
  const interceptionErrors: string[] = [];
  const token = createToken();

  try {
    // Mirror the frontend plugins without loading the project's backend proxy.
    // This fallback denies API traffic even if CDP interception is accidentally removed.
    server = await createServer({
      configFile: false,
      root,
      cacheDir: path.join(profile, 'vite-cache'),
      plugins: [vue(), tailwindcss(), {
        name: 'deny-unintercepted-api',
        configureServer(vite) {
          vite.middlewares.use('/api', (_req, res) => {
            leakedApiRequests++;
            res.statusCode = 503;
            res.end('Unintercepted API request');
          });
        },
      }],
      resolve: { alias: { '@': path.join(root, 'src'), '@server': path.join(root, 'server') } },
      server: { host: '127.0.0.1', port: 0, strictPort: true, hmr: false },
      logLevel: 'error',
    });
    await server.listen();
    const address = server.httpServer?.address();
    assert.ok(address && typeof address === 'object', 'Vite must listen on an ephemeral port');
    const origin = `http://127.0.0.1:${address.port}`;

    browser = spawn(edgePath, [
      '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      '--disable-background-networking', '--disable-component-update', '--disable-sync', '--disable-extensions',
      '--proxy-server=http://127.0.0.1:9', '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
      '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
    ], { windowsHide: true, stdio: 'ignore' });
    browserExit = new Promise(resolve => browser!.once('exit', () => resolve()));
    await once(browser, 'spawn');

    let debugPort = '';
    for (let attempt = 0; attempt < 100; attempt++) {
      if (browser.exitCode !== null) throw new Error(`Edge exited with code ${browser.exitCode}`);
      try {
        debugPort = (await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0] || '';
        if (debugPort) break;
      } catch {
        await delay(100);
      }
    }
    assert.match(debugPort, /^\d+$/, 'Edge must expose a local DevTools port');
    const debugResponse = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
    assert.equal(debugResponse.ok, true);
    const pages = await debugResponse.json() as { type: string; webSocketDebuggerUrl: string }[];
    const page = pages.find(item => item.type === 'page');
    assert.ok(page, 'Edge must expose a page target');
    socket = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise<void>((resolve, reject) => {
      socket!.addEventListener('open', () => resolve(), { once: true });
      socket!.addEventListener('error', () => reject(new Error('CDP connection failed')), { once: true });
    });

    let nextId = 0;
    const pending = new Map<number, (message: { result?: Record<string, unknown>; error?: unknown }) => void>();
    socket.addEventListener('message', event => {
      const message = JSON.parse(String(event.data)) as {
        id?: number; method?: string; params?: PausedRequest; result?: Record<string, unknown>; error?: unknown;
      };
      if (message.id) {
        pending.get(message.id)?.(message);
        pending.delete(message.id);
      }
      if (message.method === 'Fetch.requestPaused' && message.params) void handlePaused(message.params);
    });

    async function call(method: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
      const id = ++nextId;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }, 15000);
        pending.set(id, message => {
          clearTimeout(timer);
          if (message.error) reject(new Error(`CDP error in ${method}: ${JSON.stringify(message.error)}`));
          else resolve(message.result || {});
        });
        socket!.send(JSON.stringify({ id, method, params }));
      });
    }

    async function evaluate<T>(expression: string): Promise<T> {
      const response = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (response.exceptionDetails) throw new Error(`Browser script error: ${JSON.stringify(response.exceptionDetails)}`);
      return (response.result as { value: T }).value;
    }

    async function until(expression: string, timeout = 15000): Promise<void> {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        if (await evaluate<boolean>(expression)) return;
        await delay(50);
      }
      const text = await evaluate<string>('document.body?.innerText?.slice(0, 2500) || ""');
      throw new Error(`Browser condition timed out: ${expression}\nDOM: ${text}\nAPI: ${JSON.stringify(apiCalls)}\nInterception errors: ${interceptionErrors.join('; ')}`);
    }

    async function fulfill(requestId: string, status: number, body: unknown): Promise<void> {
      await call('Fetch.fulfillRequest', {
        requestId,
        responseCode: status,
        responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Cache-Control', value: 'no-store' }],
        body: Buffer.from(JSON.stringify(body)).toString('base64'),
      });
    }

    async function handlePaused({ requestId, request }: PausedRequest): Promise<void> {
      try {
        const url = new URL(request.url);
        if (url.origin !== origin) {
          blockedExternalRequests.push(request.url);
          await call('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
          return;
        }
        if (url.pathname !== '/api' && !url.pathname.startsWith('/api/')) {
          await call('Fetch.continueRequest', { requestId });
          return;
        }
        apiCalls.push({ method: request.method, pathname: url.pathname, body: request.postData, headers: request.headers });
        if (request.method === 'GET' && url.pathname === '/api/auth/me') {
          await fulfill(requestId, 200, { success: true, data: { ...admin, avatarUrl: null, defaultAddress: null, dietPreferences: [] } });
        } else if (request.method === 'GET' && url.pathname === '/api/orders') {
          if (ordersDelayMs > 0) {
            const delayMs = ordersDelayMs;
            ordersDelayMs = 0;
            await delay(delayMs);
          }
          await fulfill(requestId, 200, { success: true, data: orders });
        } else if (request.method === 'GET' && url.pathname === '/api/admin/notifications') {
          await fulfill(requestId, 200, { success: true, data: { notifications: [], unreadCount: 0 } });
        } else if (request.method === 'GET' && url.pathname === '/api/admin/customers') {
          await fulfill(requestId, 200, { success: true, data: { customers: [], total: 0, totalCustomers: 0, bmiGoalCustomerCount: 0, frequentChatCustomerCount: 0, page: 1, limit: 1, totalPages: 1 } });
        } else if (request.method === 'PATCH' && url.pathname === '/api/orders/order-9/status') {
          const body = JSON.parse(request.postData || '{}') as { status?: OrderStatus };
          const order = orders.find(item => item.id === 'order-9');
          if (!order || body.status !== 'confirmed') throw new Error('Unexpected order status update');
          order.status = body.status;
          await fulfill(requestId, 200, { success: true, data: order });
        } else {
          unexpectedApiCalls.push(`${request.method} ${url.pathname}`);
          await fulfill(requestId, 501, { success: false, message: 'Unexpected API request in browser test' });
        }
      } catch (err: unknown) {
        interceptionErrors.push(err instanceof Error ? err.message : String(err));
        await call('Fetch.failRequest', { requestId, errorReason: 'Failed' }).catch(() => {});
      }
    }


    const snapshotScript = `(() => {
      const clean = value => value?.replace(/\\s+/g, ' ').trim() || null;
      const labels = ['Tổng đơn toàn hệ thống', 'Chờ xác nhận & đóng gói', 'Đang vận chuyển 2H', 'Thanh toán số (VietQR / MoMo)'];
      const spans = [...document.querySelectorAll('span')];
      const footer = document.querySelector('button[title="Trang trước"]')?.parentElement?.parentElement;
      return {
        path: location.pathname,
        rows: [...document.querySelectorAll('table tbody tr')].map(row => row.querySelector('td:first-child span.font-heading')?.textContent?.trim()).filter(Boolean),
        summary: clean(footer?.querySelector('span')?.textContent),
        currentPage: document.querySelector('button[aria-current="page"]')?.textContent?.trim() || null,
        pageButtons: [...document.querySelectorAll('button[aria-label^="Trang "]')].map(button => button.textContent.trim()).filter(Boolean),
        previousDisabled: document.querySelector('button[title="Trang trước"]')?.disabled ?? null,
        nextDisabled: document.querySelector('button[title="Trang tiếp theo"]')?.disabled ?? null,
        kpis: Object.fromEntries(labels.map(label => [label, clean(spans.find(span => span.textContent.trim() === label)?.parentElement?.nextElementSibling?.textContent)])),
        urgent: clean(spans.find(span => span.textContent.includes('đơn giao siêu tốc 2H cần xử lý gấp'))?.textContent),
      };
    })()`;
    const snapshot = () => evaluate<Snapshot>(snapshotScript);
    const expectedKpis = {
      'Tổng đơn toàn hệ thống': '17 đơn',
      'Chờ xác nhận & đóng gói': '12 đơn',
      'Đang vận chuyển 2H': '2 đơn',
      'Thanh toán số (VietQR / MoMo)': '5 đơn',
    };
    const firstEight = Array.from({ length: 8 }, (_, index) => `#NM-${String(index + 1).padStart(4, '0')}`);
    const middleEight = ['#NM-UNIQ', ...Array.from({ length: 7 }, (_, index) => `#NM-${String(index + 10).padStart(4, '0')}`)];

    async function expectPage(pageNumber: number, start: number, end: number, total: number, rows: string[]): Promise<Snapshot> {
      const expectedSummary = `Hiển thị ${start} - ${end} trong tổng số ${total} đơn hàng`;
      await until(`(() => { const state = ${snapshotScript}; return state.currentPage === ${JSON.stringify(String(pageNumber))} && state.summary === ${JSON.stringify(expectedSummary)} && state.rows.length === ${rows.length}; })()`);
      const state = await snapshot();
      assert.equal(state.path, '/admin/orders');
      assert.deepEqual(state.rows, rows);
      assert.equal(state.summary, expectedSummary);
      assert.equal(state.currentPage, String(pageNumber));
      assert.equal(state.previousDisabled, pageNumber === 1);
      assert.equal(state.nextDisabled, pageNumber === Math.ceil(total / 8));
      assert.deepEqual(state.kpis, expectedKpis);
      assert.equal(state.urgent, '2 đơn giao siêu tốc 2H cần xử lý gấp');
      return state;
    }

    async function click(selector: string): Promise<void> {
      await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!(element instanceof HTMLButtonElement) || element.disabled) throw new Error('Button unavailable: ' + ${JSON.stringify(selector)}); element.click(); })()`);
    }

    async function clickTab(prefix: string): Promise<void> {
      await evaluate(`(() => { const button = [...document.querySelectorAll('button')].find(item => item.textContent.trim().startsWith(${JSON.stringify(prefix + ' (')})); if (!button) throw new Error('Missing tab'); button.click(); })()`);
    }

    async function search(value: string): Promise<void> {
      await evaluate(`(() => { const input = document.querySelector('input[placeholder="Tìm theo mã đơn, tên, SĐT..."]'); if (!(input instanceof HTMLInputElement)) throw new Error('Missing search'); input.value = ${JSON.stringify(value)}; input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    }

    await call('Network.enable');
    await call('Network.setBlockedURLs', { urls: ['ws://*', 'wss://*'] });
    await call('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
    await call('Page.enable');
    await call('Page.addScriptToEvaluateOnNewDocument', {
      source: `localStorage.setItem('nutrimate-auth-user', ${JSON.stringify(JSON.stringify(admin))}); localStorage.setItem('nutrimate-access-token', ${JSON.stringify(token)});`,
    });
    await call('Page.navigate', { url: `${origin}/admin/orders` });

    await until(`!![...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Làm mới dữ liệu' && button.disabled) && !!document.querySelector('h1')`);
    assert.equal(await evaluate<boolean>('!!document.querySelector(\'button[title="Trang trước"]\')'), false);
    const first = await expectPage(1, 1, 8, 17, firstEight);
    assert.deepEqual(first.pageButtons, ['1', '2', '3']);

    await click('button[aria-label="Trang 3"]');
    await expectPage(3, 17, 17, 17, ['#NM-0017']);

    // Exercise native keyboard activation, not only programmatic clicks.
    assert.equal(await evaluate<boolean>(`(() => { const button = document.querySelector('button[aria-label="Trang 2"]'); button.focus(); return document.activeElement === button; })()`), true);
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, text: '\r' });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
    await expectPage(2, 9, 16, 17, middleEight);
    await click('button[aria-label="Trang 1"]');
    await expectPage(1, 1, 8, 17, firstEight);
    await click('button[title="Trang tiếp theo"]');
    await expectPage(2, 9, 16, 17, middleEight);

    // Sixteen matches still have two pages, so returning to page 1 proves a reset rather than a clamp.
    await search('  KHÁCH  ');
    await expectPage(1, 1, 8, 16, firstEight);
    for (const term of ['  nm-uniq  ', 'lAn UnIqUe', '0912345678']) {
      await search(term);
      await expectPage(1, 1, 1, 1, ['#NM-UNIQ']);
    }
    await search('khong-co-don-nay');
    await until(`document.body.innerText.includes('Không tìm thấy đơn hàng nào khớp với bộ lọc.')`);
    const noMatches = await snapshot();
    assert.deepEqual(noMatches.rows, []);
    assert.equal(noMatches.summary, null);
    assert.deepEqual(noMatches.pageButtons, []);
    assert.deepEqual(noMatches.kpis, expectedKpis);

    await search('');
    await expectPage(1, 1, 8, 17, firstEight);
    await click('button[aria-label="Trang 2"]');
    await expectPage(2, 9, 16, 17, middleEight);
    // Pending still has two pages; the tab change must reset, not clamp.
    await clickTab('Chờ xác nhận');
    const pendingPage = await expectPage(1, 1, 8, 9, firstEight);
    assert.deepEqual(pendingPage.pageButtons, ['1', '2']);
    await click('button[aria-label="Trang 2"]');
    await expectPage(2, 9, 9, 9, ['#NM-UNIQ']);
    await click('table tbody tr button');
    await until(`[...document.querySelectorAll('table tbody tr button')].some(button => button.textContent.trim() === 'Duyệt đơn')`);
    await evaluate(`(() => { const button = [...document.querySelectorAll('table tbody tr button')].find(item => item.textContent.trim() === 'Duyệt đơn'); if (!button) throw new Error('Missing status option'); button.click(); })()`);
    const clamped = await expectPage(1, 1, 8, 8, firstEight);
    assert.deepEqual(clamped.pageButtons, ['1']);
    const patches = apiCalls.filter(item => item.method === 'PATCH');
    assert.equal(patches.length, 1);
    assert.equal(patches[0]!.pathname, '/api/orders/order-9/status');
    assert.deepEqual(JSON.parse(patches[0]!.body || '{}'), { status: 'confirmed' });
    assert.equal(apiCalls.filter(item => item.method === 'GET' && item.pathname === '/api/orders').length, 1, 'Paging and filtering must remain client-side');
    const orderRequest = apiCalls.find(item => item.method === 'GET' && item.pathname === '/api/orders');
    assert.equal(Object.entries(orderRequest!.headers).find(([name]) => name.toLowerCase() === 'authorization')?.[1], `Bearer ${token}`);

    orders = [];
    ordersDelayMs = 800;
    await evaluate(`(() => { const button = [...document.querySelectorAll('button')].find(item => item.textContent.trim() === 'Làm mới dữ liệu'); if (!(button instanceof HTMLButtonElement) || button.disabled) throw new Error('Missing refresh button'); button.click(); })()`);
    await until(`!![...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Làm mới dữ liệu' && button.disabled)`);
    await until(`document.body.innerText.includes('Không tìm thấy đơn hàng nào khớp với bộ lọc.') && ![...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Làm mới dữ liệu')?.disabled`);
    const empty = await snapshot();
    assert.deepEqual(empty.rows, []);
    assert.equal(empty.summary, null);
    assert.deepEqual(empty.pageButtons, []);
    assert.deepEqual(Object.values(empty.kpis), ['0 đơn', '0 đơn', '0 đơn', '0 đơn']);
    assert.equal(empty.urgent, '0 đơn giao siêu tốc 2H cần xử lý gấp');
    assert.equal(apiCalls.filter(item => item.method === 'GET' && item.pathname === '/api/orders').length, 2);

    // A canary verifies that CDP denies non-local network requests before any connection.
    assert.equal(await evaluate<boolean>(`fetch('https://network-block-check.invalid/probe', { mode: 'no-cors' }).then(() => false, () => true)`), true);
    assert.ok(blockedExternalRequests.includes('https://network-block-check.invalid/probe'));
    assert.deepEqual(unexpectedApiCalls, []);
    assert.deepEqual(interceptionErrors, []);
    assert.equal(leakedApiRequests, 0, 'No API request may reach Vite or its backend proxy');
  } finally {
    try {
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ id: 999999999, method: 'Browser.close' }));
      if (browser?.pid && browser.exitCode === null && browser.signalCode === null) {
        await Promise.race([browserExit, delay(7000)]);
        if (browser.exitCode === null && browser.signalCode === null) {
          if (process.platform === 'win32') {
            const killer = spawn('taskkill', ['/PID', String(browser.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
            await Promise.race([once(killer, 'exit').catch(() => []), delay(5000)]);
          } else {
            browser.kill('SIGKILL');
          }
          await Promise.race([browserExit, delay(5000)]);
        }
        assert.ok(browser.exitCode !== null || browser.signalCode !== null, 'Test browser must exit');
      }
    } finally {
      socket?.close();
      try {
        await server?.close();
      } finally {
        // This exact directory was created by mkdtemp for this test, never a user profile.
        await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
      }
    }
  }
});
