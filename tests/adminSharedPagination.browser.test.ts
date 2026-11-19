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
import type { AdminCategoryRecord, AdminCustomer, KnowledgeBaseEntry, Voucher } from '../src/types';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
const edgePath = process.env.ADMIN_ORDERS_BROWSER_PATH || process.env.CHAT_BROWSER_PATH
  || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profilePrefix = 'nutrimate-admin-shared-pagination-browser-';
const admin = {
  id: 'admin-1', name: 'Admin Browser', email: 'admin@example.invalid', phone: '0901111111', role: 'admin',
};

function createToken(): string {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: admin.id, role: admin.role, iat: now, exp: now + 3600 })}.mock-signature`;
}

function createCategories(): AdminCategoryRecord[] {
  return Array.from({ length: 17 }, (_, offset) => {
    const number = offset + 1;
    return {
      id: `cat-${number}`,
      code: number === 9 ? 'CAT-UNIQ' : `CAT-${String(number).padStart(3, '0')}`,
      name: number === 9 ? 'Rau Unique' : `Danh mục ${number}`,
      description: number === 9 ? 'Mô tả unique cho bộ lọc' : `Mô tả danh mục ${number}`,
      status: number % 4 !== 0,
      productCount: number % 3,
      products: [],
    };
  });
}

function createCustomers(): AdminCustomer[] {
  return Array.from({ length: 17 }, (_, offset) => {
    const number = offset + 1;
    return {
      id: `cust-${number}`,
      name: number === 9 ? 'Lan Unique' : `Khách ${number}`,
      email: `guest${number}@example.invalid`,
      phone: number === 9 ? '0912345678' : `09000000${String(number).padStart(2, '0')}`,
      avatarUrl: null,
      bmi: number % 2 === 0 ? 22.4 : null,
      heightCm: 165,
      weightKg: 55,
      nutritionGoal: number % 3 === 0 ? 'lose_weight' : null,
      totalSpent: number * 10000,
      orderCount: number % 5,
      completedOrderCount: number % 4,
      recentChatMessages: number === 9 ? 8 : 0,
      recentChatConversations: number === 9 ? 2 : 0,
      lastChatAt: number === 9 ? '2026-01-10T08:00:00.000Z' : null,
    };
  });
}

function createVouchers(): Voucher[] {
  return Array.from({ length: 17 }, (_, offset) => {
    const number = offset + 1;
    return {
      id: `voucher-${number}`,
      code: number === 9 ? 'UNIQ20' : `CODE${String(number).padStart(2, '0')}`,
      title: number === 9 ? 'Ưu đãi Unique' : `Voucher ${number}`,
      discountType: 'fixed',
      discountValue: 20000,
      minOrderAmount: 100000,
      targetType: number % 7 === 0 ? 'first_order' : 'all',
      usageLimit: 100,
      usedCount: number,
      endDate: '2027-12-31T00:00:00.000Z',
      isActive: number % 5 !== 0,
    };
  });
}

function createKnowledge(): KnowledgeBaseEntry[] {
  return Array.from({ length: 17 }, (_, offset) => {
    const number = offset + 1;
    return {
      id: number,
      question: number === 9 ? 'Protein unique từ đâu?' : `Câu hỏi ${number}`,
      answer: `Câu trả lời ${number}`,
      category: number % 4 === 0 ? null : 'dinh dưỡng',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
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
  search: string;
  body?: string;
}
interface PageSnapshot {
  path: string;
  rows: string[];
  summary: string | null;
  currentPage: string | null;
  pageButtons: string[];
  previousDisabled: boolean | null;
  nextDisabled: boolean | null;
  padding: { top: number; right: number; bottom: number; left: number } | null;
  overflowX: boolean;
}

test('browser: shared admin pagination on categories, customers, vouchers, knowledge-base', {
  skip: process.env.ADMIN_ORDERS_BROWSER_TEST !== '1' && process.env.ADMIN_SHARED_PAGINATION_BROWSER_TEST !== '1',
  timeout: 180000,
}, async () => {
  const profile = await mkdtemp(path.join(tmpdir(), profilePrefix));
  let server: ViteDevServer | undefined;
  let browser: ChildProcess | undefined;
  let browserExit: Promise<void> | undefined;
  let socket: WebSocket | undefined;
  const categories = createCategories();
  const customers = createCustomers();
  const vouchers = createVouchers();
  const knowledge = createKnowledge();
  let leakedApiRequests = 0;
  const apiCalls: ApiCall[] = [];
  const unexpectedApiCalls: string[] = [];
  const blockedExternalRequests: string[] = [];
  const interceptionErrors: string[] = [];
  const token = createToken();

  try {
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

    function paginateCustomers(url: URL) {
      const limit = Number(url.searchParams.get('limit') || 8);
      const pageNumber = Number(url.searchParams.get('page') || 1);
      const search = (url.searchParams.get('search') || '').trim().toLowerCase();
      const filtered = customers.filter(item => {
        if (!search) return true;
        return [item.id, item.name, item.email, item.phone].some(value => (value || '').toLowerCase().includes(search));
      });
      const total = filtered.length;
      const start = (pageNumber - 1) * limit;
      return {
        customers: filtered.slice(start, start + limit),
        total,
        totalCustomers: customers.length,
        bmiGoalCustomerCount: customers.filter(item => item.bmi !== null).length,
        frequentChatCustomerCount: customers.filter(item => item.recentChatMessages >= 5).length,
        page: pageNumber,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
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
        apiCalls.push({ method: request.method, pathname: url.pathname, search: url.search, body: request.postData });
        if (request.method === 'GET' && url.pathname === '/api/auth/me') {
          await fulfill(requestId, 200, { success: true, data: { ...admin, avatarUrl: null, defaultAddress: null, dietPreferences: [] } });
        } else if (request.method === 'GET' && url.pathname === '/api/admin/notifications') {
          await fulfill(requestId, 200, { success: true, data: { notifications: [], unreadCount: 0 } });
        } else if (request.method === 'GET' && url.pathname === '/api/admin/customers') {
          await fulfill(requestId, 200, { success: true, data: paginateCustomers(url) });
        } else if (request.method === 'GET' && url.pathname === '/api/admin/categories') {
          await fulfill(requestId, 200, { success: true, data: categories });
        } else if (request.method === 'GET' && url.pathname === '/api/vouchers') {
          await fulfill(requestId, 200, { success: true, data: vouchers });
        } else if (request.method === 'GET' && url.pathname === '/api/knowledge') {
          await fulfill(requestId, 200, { success: true, data: knowledge });
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
      const nav = document.querySelector('nav[aria-label="Phân trang"]');
      const styles = nav ? getComputedStyle(nav) : null;
      const tableWrap = document.querySelector('table')?.closest('div');
      const rowSelector = location.pathname === '/admin/customers'
        ? 'table tbody tr td:nth-child(2) span.block.font-bold'
        : location.pathname === '/admin/vouchers'
          ? 'table tbody tr td:first-child span.font-heading'
          : location.pathname === '/admin/knowledge-base'
            ? 'article p.text-base.font-black'
            : 'table tbody tr td:nth-child(2) span.font-bold';
      return {
        path: location.pathname,
        rows: [...document.querySelectorAll(rowSelector)].map(node => node.textContent?.trim()).filter(Boolean),
        summary: clean(nav?.querySelector('span')?.textContent),
        currentPage: document.querySelector('button[aria-current="page"]')?.textContent?.trim()
          || clean(document.querySelector('nav[aria-label="Phân trang"] span[aria-live="polite"]')?.textContent),
        pageButtons: [...document.querySelectorAll('button[aria-label^="Trang "]')].map(button => button.textContent.trim()).filter(Boolean),
        previousDisabled: document.querySelector('button[title="Trang trước"]')?.disabled ?? null,
        nextDisabled: document.querySelector('button[title="Trang tiếp theo"]')?.disabled ?? null,
        padding: styles ? {
          top: parseFloat(styles.paddingTop),
          right: parseFloat(styles.paddingRight),
          bottom: parseFloat(styles.paddingBottom),
          left: parseFloat(styles.paddingLeft),
        } : null,
        overflowX: tableWrap ? tableWrap.scrollWidth > tableWrap.clientWidth + 1 && tableWrap.clientWidth === 0 : false,
      };
    })()`;
    const snapshot = () => evaluate<PageSnapshot>(snapshotScript);

    async function click(selector: string): Promise<void> {
      await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!(element instanceof HTMLButtonElement) || element.disabled) throw new Error('Button unavailable: ' + ${JSON.stringify(selector)}); element.click(); })()`);
    }

    async function setSearch(placeholder: string, value: string): Promise<void> {
      await evaluate(`(() => { const input = document.querySelector('input[placeholder=${JSON.stringify(placeholder)}]'); if (!(input instanceof HTMLInputElement)) throw new Error('Missing search'); input.value = ${JSON.stringify(value)}; input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    }

    await call('Network.enable');
    await call('Network.setBlockedURLs', { urls: ['ws://*', 'wss://*'] });
    await call('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
    await call('Page.enable');
    await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await call('Page.addScriptToEvaluateOnNewDocument', {
      source: `localStorage.setItem('nutrimate-auth-user', ${JSON.stringify(JSON.stringify(admin))}); localStorage.setItem('nutrimate-access-token', ${JSON.stringify(token)});`,
    });

    async function expectPaged(path: string, pageNumber: number, start: number, end: number, total: number, label: string, rowCount: number): Promise<PageSnapshot> {
      const expectedSummary = `Hiển thị ${start} - ${end} trong tổng số ${total} ${label}`;
      await until(`(() => { const state = ${snapshotScript}; return state.path === ${JSON.stringify(path)} && state.summary === ${JSON.stringify(expectedSummary)} && state.rows.length === ${rowCount}; })()`);
      const state = await snapshot();
      assert.equal(state.path, path);
      assert.equal(state.summary, expectedSummary);
      assert.equal(state.rows.length, rowCount);
      assert.equal(state.previousDisabled, pageNumber === 1);
      assert.equal(state.nextDisabled, pageNumber === Math.ceil(total / 8));
      return state;
    }

    await call('Page.navigate', { url: `${origin}/admin/categories` });
    const firstCategories = await expectPaged('/admin/categories', 1, 1, 8, 17, 'danh mục', 8);
    assert.deepEqual(firstCategories.pageButtons, ['1', '2', '3']);
    assert.equal(firstCategories.rows[0], 'Danh mục 1');
    await click('button[title="Trang tiếp theo"]');
    await expectPaged('/admin/categories', 2, 9, 16, 17, 'danh mục', 8);
    await setSearch('Tìm theo mã danh mục, tên, mô tả...', 'unique');
    await expectPaged('/admin/categories', 1, 1, 1, 1, 'danh mục', 1);
    await evaluate(`(() => { const button = [...document.querySelectorAll('button')].find(item => item.textContent.includes('Đặt lại')); if (button) button.click(); })()`);
    await expectPaged('/admin/categories', 1, 1, 8, 17, 'danh mục', 8);

    await call('Emulation.setDeviceMetricsOverride', { width: 320, height: 720, deviceScaleFactor: 1, mobile: true });
    await until(`(() => { const nav = document.querySelector('nav[aria-label="Phân trang"]'); if (!nav) return false; const box = nav.getBoundingClientRect(); return box.width > 0 && box.width <= 320; })()`);
    const mobileFooter = await snapshot();
    assert.ok(mobileFooter.padding);
    assert.ok(mobileFooter.padding!.top >= 16);
    assert.ok(mobileFooter.padding!.bottom >= 16);
    assert.ok(mobileFooter.padding!.left >= 16);
    assert.ok(mobileFooter.padding!.right >= 16);
    const overflow = await evaluate<{ navOverflow: boolean; bodyOverflow: boolean }>(`(() => {
      const nav = document.querySelector('nav[aria-label="Phân trang"]');
      const navOverflow = nav ? nav.scrollWidth > nav.clientWidth + 1 : true;
      return { navOverflow, bodyOverflow: document.documentElement.scrollWidth > 320 + 2 };
    })()`);
    assert.equal(overflow.navOverflow, false, 'Pagination footer must not overflow at 320px');

    await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

    await call('Page.navigate', { url: `${origin}/admin/customers` });
    await expectPaged('/admin/customers', 1, 1, 8, 17, 'khách hàng', 8);
    const customerListCalls = apiCalls.filter(item => item.method === 'GET' && item.pathname === '/api/admin/customers' && item.search.includes('limit=8'));
    assert.ok(customerListCalls.length >= 1, 'Customers page must request limit=8');
    assert.match(customerListCalls[customerListCalls.length - 1]!.search, /limit=8/);
    await click('button[title="Trang tiếp theo"]');
    await expectPaged('/admin/customers', 2, 9, 16, 17, 'khách hàng', 8);
    const pagedCall = apiCalls.filter(item => item.method === 'GET' && item.pathname === '/api/admin/customers' && item.search.includes('page=2'));
    assert.ok(pagedCall.some(item => item.search.includes('limit=8') && item.search.includes('page=2')));
    const beforeSearch = apiCalls.filter(item => item.method === 'GET' && item.pathname === '/api/admin/customers').length;
    await setSearch('Tên, SĐT, email hoặc mã...', 'unique');
    const filteredCustomers = await expectPaged('/admin/customers', 1, 1, 1, 1, 'khách hàng', 1);
    assert.deepEqual(filteredCustomers.rows, ['Lan Unique']);
    await delay(300);
    const searchCalls = apiCalls.filter(item => item.method === 'GET' && item.pathname === '/api/admin/customers').slice(beforeSearch);
    assert.equal(searchCalls.length, 1, 'Changing filters on page 2 should send one customer request');
    assert.match(searchCalls[0]!.search, /search=unique/);
    await setSearch('Tên, SĐT, email hoặc mã...', '');
    await expectPaged('/admin/customers', 1, 1, 8, 17, 'khách hàng', 8);

    await call('Page.navigate', { url: `${origin}/admin/vouchers` });
    await expectPaged('/admin/vouchers', 1, 1, 8, 17, 'mã giảm giá', 8);
    await click('button[title="Trang tiếp theo"]');
    await expectPaged('/admin/vouchers', 2, 9, 16, 17, 'mã giảm giá', 8);
    await setSearch('Tìm theo mã hoặc tiêu đề...', 'UNIQ20');
    await expectPaged('/admin/vouchers', 1, 1, 1, 1, 'mã giảm giá', 1);
    await setSearch('Tìm theo mã hoặc tiêu đề...', '');
    await expectPaged('/admin/vouchers', 1, 1, 8, 17, 'mã giảm giá', 8);

    await call('Page.navigate', { url: `${origin}/admin/knowledge-base` });
    await expectPaged('/admin/knowledge-base', 1, 1, 8, 17, 'tri thức', 8);
    await click('button[title="Trang tiếp theo"]');
    await expectPaged('/admin/knowledge-base', 2, 9, 16, 17, 'tri thức', 8);
    await setSearch('Tìm câu hỏi, câu trả lời, danh mục...', 'unique');
    await expectPaged('/admin/knowledge-base', 1, 1, 1, 1, 'tri thức', 1);
    await evaluate(`(() => { document.querySelector('button[title="Xóa bộ lọc"]')?.click(); })()`);
    await expectPaged('/admin/knowledge-base', 1, 1, 8, 17, 'tri thức', 8);

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
        await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
      }
    }
  }
});
