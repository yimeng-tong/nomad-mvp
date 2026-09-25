/** Real Chromium rendering with explicit HTTP/SSE fixtures; never contacts an import provider. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
const puppeteer = createRequire(new URL('../../server/package.json', import.meta.url))('puppeteer');
const root = resolve(import.meta.dirname, '../../..');
const output = resolve(root, process.env.DOCK_PROBE_OUTPUT ?? '_bmad-output/implementation-artifacts/evidence/story-1-6-browser-2026-09-19');
await mkdir(output, { recursive: true });
const origin = 'http://127.0.0.1:5188';
const profile = await mkdtemp('/tmp/nomad-dock-restart-');
const nonce = randomUUID(), proofConfig = resolve(await mkdtemp('/tmp/nomad-dock-vite-'), 'config.mjs');
await writeFile(proofConfig, `import base from ${JSON.stringify(resolve(root, 'apps/mobile/vite.config.ts'))}; export default {...base, root:${JSON.stringify(resolve(root, 'apps/mobile'))}, plugins:[...base.plugins,{name:'dock-proof-identity',configureServer(server){server.middlewares.use((req,res,next)=>{if(req.url==='/__dock_probe_identity'){res.end(${JSON.stringify(nonce)});return;}next();});}}]};`);
const sourceFiles = ['apps/mobile/src/App.tsx','apps/mobile/src/home/dock-controller.ts','apps/mobile/src/home/dock-model.ts','apps/mobile/src/home/HomeImportDock.tsx','apps/mobile/src/home/HomeScreen.tsx','apps/mobile/src/home/HomeSheet.tsx','apps/mobile/src/auth/stream.ts','apps/mobile/src/styles.css','apps/mobile/src/home/clipboard.ts','apps/mobile/src/home/input-inbox.ts','apps/mobile/src/home/input-runtime.ts','apps/mobile/src/home/operation-journal.ts'];
const hashSources = async () => Object.fromEntries(await Promise.all(sourceFiles.map(async (path) => [path, createHash('sha256').update(await readFile(resolve(root,path))).digest('hex')])));
const sourceHashes = await hashSources();
const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', proofConfig, '--host', '127.0.0.1', '--port', '5188', '--strictPort'], {
  cwd: resolve(root, 'apps/mobile'), env: { ...process.env, VITE_API_BASE_URL: `${origin}/api` }, stdio: 'ignore',
});
let browser;
const errors = [], jobs = new Map(), commands = new Map(), submissions = [], reads = [];
const jobOwners = new Map(), commandOwners = new Map();
let dropNextAck = false, blockReceipt = false;
const user = { user_id: 'synthetic-dock-owner', user: { id: 'synthetic-dock-owner', phone: null }, session: { id: 'synthetic-dock-session', device_id: 'browser-fixture', expires_at: '2030-01-01T00:00:00Z' } };
let identity = user;
const snapshot = (id, n) => ({ ingest_id: id, attempt: 1, state_version: 0, state: 'fetching', source_title: `厦门旅行收藏 ${n}`, result: null,
  partial: false, retriable: false, fetched_count: null, parsed_count: null, candidate_count: null, stored_count: null,
  actions: { retry: false, view: false }, updated_at: '2026-09-19T00:00:00Z' });
const finish = (job, state = 'done') => Object.assign(job, { state, state_version: job.state_version + 1, partial: state === 'failed', retriable: state === 'failed',
  stored_count: 1, fetched_count: 3, actions: { retry: state === 'failed', view: true }, result: { inspiration_id: `result-${job.ingest_id}`, asset_count: 3, city_name: null, locate_status: 'pending' } });
const receipt = (id, job, disposition = 'created') => ({ operation_id: id, ingest_id: job.ingest_id, state: job.state, snapshot: job, disposition, sse_url: `/ingest/${job.ingest_id}/events` });
const json = (request, body, status = 200) => request.respond({ status, contentType: 'application/json', headers: { 'Cache-Control': 'no-store' }, body: JSON.stringify(body) });
async function instrument(page) {
  await page.evaluateOnNewDocument(() => {
    window.__clipboardFixture = { reads: 0, denied: false, text: '主动粘贴的旅行想法' };
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { async readText() {
      const fixture = window.__clipboardFixture; fixture.reads++;
      if (fixture.denied) throw new DOMException('fixture denied', 'NotAllowedError');
      return fixture.text;
    } } });
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', async (request) => {
    const url = new URL(request.url());
    if (url.origin !== origin && !['data:', 'about:'].includes(url.protocol)) return request.abort();
    if (!url.pathname.startsWith('/api/')) return request.continue();
    const path = url.pathname.slice(4), body = request.postData() ? JSON.parse(request.postData()) : {};
    if (path === '/me') return json(request, identity);
    const requestOwner = identity.user_id, suppliedOwner = path.endsWith('/events') ? url.searchParams.get('auth_user_id') : request.headers()['x-auth-user-id'];
    if (suppliedOwner !== requestOwner) return json(request, { error_code: 'AUTH_CONTEXT_CHANGED' }, 409);
    reads.push({ path, owner: requestOwner });
    if (path === '/library/cities') return json(request, { cities: [], unlocated_count: 0 });
    if (path === '/library/inspirations') return json(request, { items: [] });
    if (path === '/user-key') return json(request, { configured: false, provider: null, key_ref: null });
    if (path === '/home/input/parse') {
      const links = [...body.text.matchAll(/https:\/\/xhslink\.com\/[a-z]+/g)].map((match) => ({ url: match[0], position: match.index }));
      return json(request, { type: links.length ? 'xhs_link' : 'unknown', original_text: body.text, links, link_occurrences: links, unrecognized: body.text.includes('其他内容') ? [{ text: '其他内容', reason: 'not_a_link' }] : [] });
    }
    if (path === '/ingest/xhs') {
      submissions.push(body.operation_id);
      if (!commands.has(body.operation_id)) { const job = snapshot(`ing_${randomUUID()}`, jobs.size + 1); jobs.set(job.ingest_id, job); jobOwners.set(job.ingest_id, requestOwner); commands.set(body.operation_id, receipt(body.operation_id, job)); commandOwners.set(body.operation_id, requestOwner); }
      if (dropNextAck) { dropNextAck = false; return request.abort('failed'); }
      return json(request, commands.get(body.operation_id));
    }
    const command = path.match(/^\/ingest\/commands\/([^/]+)$/);
    if (command) {
      if (blockReceipt && command[1] === submissions.at(-1)) return json(request, { error_code: 'INGEST_AUTHORITY_UNAVAILABLE' }, 503);
      const owned = commandOwners.get(command[1]) === requestOwner;
      return json(request, owned ? commands.get(command[1]) : { error_code: 'NOT_FOUND' }, owned ? 200 : 404);
    }
    const match = path.match(/^\/ingest\/([^/]+)(?:\/(events|result|retry))?$/);
    if (match) {
      const job = jobs.get(match[1]); if (!job || jobOwners.get(match[1]) !== requestOwner) return json(request, {}, 404);
      if (match[2] === 'events') return request.respond({ status: 200, contentType: 'text/event-stream', body: `event: ingest\ndata: ${JSON.stringify({ snapshot: job })}\n\n` });
      if (match[2] === 'retry') {
        assert.equal(body.expected_attempt, job.attempt); assert.equal(body.expected_state_version, job.state_version);
        Object.assign(job, { attempt: job.attempt + 1, state_version: job.state_version + 1, state: 'fetching', actions: { retry: false, view: true } });
        const ack = receipt(body.operation_id, job, 'retried'); commands.set(body.operation_id, ack); commandOwners.set(body.operation_id, requestOwner); return json(request, ack);
      }
      if (match[2] === 'result') return json(request, { id: job.result.inspiration_id, title: job.source_title, summary: '已确认保存的旅行内容，地点仍待核实。',
        locate_status: 'pending', city_id: null, city_name: null, poi_id: null, poi_name: null, poi_address: null, asset_count: 3, candidate_count: 0, created_at: job.updated_at });
      return json(request, job);
    }
    return json(request, { error_code: 'FEATURE_NOT_AVAILABLE' }, 503);
  });
}
const waitText = (page, value) => page.waitForFunction((text) => document.body.innerText.includes(text), { polling: 100, timeout: 15000 }, value);
const clickText = (page, value) => page.evaluate((text) => { const node = [...document.querySelectorAll('button')].find((button) => button.textContent.trim() === text); if (!node) throw new Error('Missing button: ' + text); node.click(); }, value);
async function setInput(page, text) { await page.click('textarea[aria-label="统一输入"]'); await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control'); await page.keyboard.type(text); }
try {
  let ready = false;
  for (let i = 0; i < 50; i++) {
    if (child.exitCode !== null) throw new Error('Owned Home proof server exited');
    try { if (await (await fetch(origin + '/__dock_probe_identity')).text() === nonce) { ready = true; break; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(ready, 'Owned Home proof server not ready');
  browser = await puppeteer.launch({ headless: true, userDataDir: profile, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage(); await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 }); await instrument(page);
  await page.goto(origin); await page.waitForSelector('textarea');
  assert.equal(await page.evaluate(() => window.__clipboardFixture.reads), 0);
  await page.click('button[aria-label="从剪贴板粘贴"]'); await page.waitForFunction(() => document.querySelector('textarea').value === '主动粘贴的旅行想法');
  assert.equal(submissions.length, 0);
  await page.evaluate(() => { window.__clipboardFixture.denied = true; });
  await page.click('button[aria-label="从剪贴板粘贴"]'); await waitText(page, '暂时无法读取剪贴板');
  assert.equal(await page.$eval('textarea', (node) => node.value), '主动粘贴的旅行想法');
  const handle = await page.$eval('.dock-drag-target', (node) => { const rect = node.getBoundingClientRect(); return { x: rect.x + rect.width / 2, y: rect.y + 10 }; });
  await page.mouse.move(handle.x, handle.y); await page.mouse.down(); await page.mouse.move(handle.x, handle.y + 55, { steps: 5 }); await page.mouse.up();
  await page.waitForSelector('button[aria-label="展开队列"]'); await page.click('button[aria-label="展开队列"]');
  await setInput(page, 'https://xhslink.com/first https://xhslink.com/second 其他内容'); await page.click('button[aria-label="发送"]');
  await waitText(page, '已添加2个链接，部分内容未识别'); assert.equal(submissions.length, 2);
  await setInput(page, '未提交的下一段旅行想法');
  await page.click('button[aria-label="菜单"]'); await waitText(page, '设置'); await page.click('button[aria-label="返回首页"]');
  assert.equal(await page.$eval('textarea', (node) => node.value), '未提交的下一段旅行想法');
  finish([...jobs.values()][1]); finish([...jobs.values()][0], 'failed');
  await waitText(page, '部分内容已保存'); await page.waitForSelector('.dock-completion');
  assert.equal(await page.$eval('.dock-completion .dock-title', (node) => node.textContent), '厦门旅行收藏 2');
  assert.match(await page.$eval('.home-import-dock .visually-hidden', (node) => node.textContent), /第2条，共2条/);
  await page.screenshot({ path: resolve(output, 'mobile-queue-partial-completion.png'), fullPage: true });
  await clickText(page, '查看已保存内容'); await waitText(page, '已确认保存的旅行内容');
  assert.equal(await page.$eval('.home-body', (node) => node.inert), true);
  // Longer than the entire completion window: a covered Dock must not count this time.
  await new Promise(resolve=>setTimeout(resolve,11000));
  const coveredDone=await page.evaluate(async owner=>{const {operationJournal}=await import('/src/home/operation-journal.ts');return (await operationJournal.list({ownerId:owner,valid:()=>true})).map(row=>row.observedDoneAttempt??0);},user.user_id);
  assert.ok(coveredDone.every(attempt=>attempt===0));
  await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
  await clickText(page, '重试这条导入'); await waitText(page, '获取内容');
  finish([...jobs.values()][0]); await waitText(page, '灵感已保存');
  await page.waitForFunction(() => document.querySelector('.dock-completion .dock-title')?.textContent === '厦门旅行收藏 1', { timeout: 20000 });
  assert.match(await page.$eval('.home-import-dock .visually-hidden', (node) => node.textContent), /第1条，共2条/);
  dropNextAck = true; blockReceipt = true; await setInput(page, 'https://xhslink.com/third'); await page.click('button[aria-label="发送"]');
  await waitText(page, '受理结果尚未确认'); blockReceipt = false;
  await page.evaluate(() => [...document.querySelectorAll('button')].find((button) => button.textContent.trim() === '确认受理结果')?.click());
  await waitText(page, '已添加1个链接');
  assert.equal(submissions.length, 3); assert.equal(new Set(submissions).size, 3);
  const geometry = await page.$$eval('.home-import-dock button, .home-import-dock textarea', (nodes) => nodes.filter((node) => node.getBoundingClientRect().height > 0).map((node) => ({ label: node.getAttribute('aria-label') || node.textContent.trim(), width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height })));
  assert.ok(geometry.every((item) => item.width >= 44 && item.height >= 44));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  assert.equal(await page.$eval('.dock-send-glyph', (node) => getComputedStyle(node).transitionDuration), '0s');
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  await page.screenshot({ path: resolve(output, 'desktop-queue-reconciled.png'), fullPage: true });
  assert.deepEqual(errors, []);
  const deepUrl = 'dev.nomad.mvp://input?v=1&text=' + encodeURIComponent('https://xhslink.com/fourth') + '&click_id=synthetic-confirmed-click';
  const inputDelivery = await page.evaluate(async ([url, owner]) => {
    const { inputInbox } = await import('/src/home/input-runtime.ts');
    const { getAuthSnapshot } = await import('/src/auth/session-context.ts');
    const before = getAuthSnapshot();
    const received = await inputInbox.receive(url, { appId: 'dev.nomad.mvp', httpsOrigins: [] }, owner);
    return { received, count: inputInbox.getSnapshot().pending.length, notice: inputInbox.getSnapshot().notice,
      before, after: getAuthSnapshot(), route: { protocol: new URL(url).protocol, host: new URL(url).hostname },
      modules: performance.getEntriesByType('resource').map((item) => item.name).filter((name) => /input-runtime|session-context/.test(name)) };
  }, [deepUrl, user.user_id]);
  assert.equal(inputDelivery.received, true, JSON.stringify(inputDelivery));
  await page.waitForSelector('.dock-incoming button', { visible: true });
  await clickText(page, '放入输入框'); dropNextAck = true; blockReceipt = true;
  await page.click('button[aria-label="发送"]'); await waitText(page, '受理结果尚未确认');
  assert.equal(submissions.length, 4); const retainedOperation = submissions[3];
  await browser.close(); browser = undefined; blockReceipt = false;
  browser = await puppeteer.launch({ headless: true, userDataDir: profile, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const resumed = await browser.newPage(); await resumed.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 }); await instrument(resumed);
  await resumed.goto(origin); await waitText(resumed, '厦门旅行收藏 4');
  assert.equal(submissions.length, 4);
  assert.ok(reads.some((read) => read.path === '/ingest/commands/' + retainedOperation));
  assert.equal(await resumed.evaluate(() => window.__clipboardFixture.reads), 0);
  await resumed.evaluate(async ([url, owner]) => {
    const { inputInbox } = await import('/src/home/input-runtime.ts');
    await inputInbox.receive(url, { appId: 'dev.nomad.mvp', httpsOrigins: [] }, owner);
  }, [deepUrl, user.user_id]);
  await waitText(resumed, '这份分享已有确认记录');
  await resumed.waitForFunction(() => !document.body.innerText.includes('正在读取本机导入记录'));
  assert.equal(await resumed.$('.dock-incoming'), null); assert.equal(submissions.length, 4);
  await resumed.screenshot({ path: resolve(output, 'mobile-recovered-original-operations.png'), fullPage: true });
  identity = { user_id: 'synthetic-other-owner', user: { id: 'synthetic-other-owner', phone: null }, session: { ...user.session, id: 'synthetic-other-session' } };
  await resumed.evaluate(() => window.dispatchEvent(new Event('focus')));
  await resumed.waitForFunction(() => !document.querySelector('.auth-private')?.hidden && document.querySelectorAll('.dock-items li').length === 0);
  assert.equal(submissions.length, 4);
  assert.equal(reads.filter((read) => read.owner === identity.user_id && read.path.startsWith('/ingest/commands/')).length, 0);
  assert.deepEqual(errors, []);
  assert.equal(child.exitCode, null); assert.equal(await (await fetch(origin + '/__dock_probe_identity')).text(), nonce);
  assert.deepEqual(await hashSources(), sourceHashes, 'Source changed during browser proof');
  await writeFile(resolve(output, 'report.json'), JSON.stringify({ result: 'passed', sourceHashes, browser: await browser.version(), actualBrowser: true, explicitHttpAndSseFixtures: true, realAuthenticationVerified: false,
    realProviderCalls: 0, nativeDeviceVerified: false, completedStory: false, clipboardUsesExplicitFixture: true, deepLinkDeliveryUsesExplicitFixture: true, browserProcesses: 2, controllerJournalIntegrationVerified: true,
    checks: ['explicit-paste-only', 'clipboard-denial-keeps-input', 'downward-drag-collapse', 'ordered-batch-acceptance', 'editable-draft', 'settings-navigation-draft-retained', 'true-partial-copy', 'safe-result-sheet', 'sheet-focus-escape','covered-sheet-eleven-seconds-does-not-complete-presentation', 'same-job-retry', 'fifo-completion-and-distinct-announcement', 'unknown-command-recovery-without-repost', '44px-targets', 'no-horizontal-overflow', 'reduced-motion', 'confirmed-deep-input-persisted', 'lost-ack-recovers-original-command-after-browser-restart', 'confirmed-link-replay-does-not-resubmit', 'changed-owner-does-not-read-old-commands', 'owned-server-and-unchanged-source'], geometry }, null, 2));
  console.log(JSON.stringify({ result: 'home-dock-browser-probe-passed', output, realProviderCalls: 0 }));
} finally { await browser?.close(); child.kill('SIGTERM'); }
