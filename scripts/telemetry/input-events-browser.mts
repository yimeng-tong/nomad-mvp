import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createHash, randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import type { HTTPRequest, Page } from 'puppeteer';
import type { components } from '../../packages/types/src/api-types.js';
import type { TelemetryEnvelope } from '../../apps/mobile/src/telemetry/runtime.js';
type RuntimeModule = typeof import('../../apps/mobile/src/telemetry/runtime.js');
type InputModule = typeof import('../../apps/mobile/src/telemetry/input-events.js');
type ProbeSnapshot = { runtime: ReturnType<ReturnType<RuntimeModule['createTelemetryRuntime']>['snapshot']>; producer: ReturnType<InputModule['inputTelemetry']['snapshot']> };
declare global { interface Window { __inputTelemetryProbe: { consent: (value: 'granted' | 'denied' | 'unknown') => void; snapshot: () => ProbeSnapshot; close: () => void } } }
type Snapshot = components['schemas']['IngestSnapshot'];
const root = resolve(import.meta.dirname, '../..'), mobile = resolve(root, 'apps/mobile');
const puppeteer = createRequire(resolve(root, 'apps/server/package.json'))('puppeteer') as typeof import('puppeteer');
const output = resolve(root, process.env.INPUT_TELEMETRY_OUTPUT ?? `.telemetry-results/input-${randomUUID()}`);
await mkdir(dirname(output), { recursive: true }); await mkdir(output, { recursive: false });
const sourceFiles = ['scripts/telemetry/input-events-browser.mts', 'scripts/telemetry/tsconfig.json', 'apps/mobile/vite.config.ts', 'apps/mobile/package.json',
  'apps/server/package.json', 'packages/types/src/api-types.ts', 'docs/api/openapi.yaml', 'pnpm-lock.yaml',
  ...execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', 'apps/mobile/src', 'packages/native-auth/src'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean)];
const hashes = async () => Object.fromEntries(await Promise.all(sourceFiles.map(async (file) => [file, createHash('sha256').update(await readFile(resolve(root, file))).digest('hex')] as const)));
const sourceSha256 = await hashes(), origin = 'http://127.0.0.1:5196', nonce = randomUUID();
const config = resolve(await mkdtemp('/tmp/nomad-input-telemetry-vite-'), 'config.mjs');
await writeFile(config, `import base from ${JSON.stringify(resolve(mobile, 'vite.config.ts'))}; export default {...base,root:${JSON.stringify(mobile)},envDir:false,plugins:[...base.plugins,{name:'input-telemetry-owner',configureServer(server){server.middlewares.use((req,res,next)=>{if(req.url==='/__input_telemetry_identity'){res.end(${JSON.stringify(nonce)});return;}next();});}}]};`);
const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', config, '--host', '127.0.0.1', '--port', '5196', '--strictPort'], {
  cwd: mobile, env: { ...process.env, VITE_API_BASE_URL: `${origin}/api` }, stdio: 'ignore',
});
const user = (owner: 'A' | 'B') => ({ user_id: `fixture-input-owner-${owner}`, user: { id: `fixture-input-owner-${owner}`, phone: null },
  session: { id: `fixture-input-session-${owner}`, device_id: 'fixture-browser', expires_at: '2030-01-01T00:00:00Z' } });
let identity: 'A' | 'B' = 'A', holdResult = false, holdParse = false, externalRequests = 0, writes = 0;
let releaseResult: (() => void) | undefined, releaseParse: (() => void) | undefined;
let heldParseRequest: HTTPRequest | undefined;
const intentionalAborts = new WeakSet<HTTPRequest>();
const jobId = `ing_${randomUUID()}`, stream = randomUUID(), timestamp = '2026-09-26T00:00:00Z';
let operation = '', snapshot: Snapshot = { ingest_id: jobId, head_cursor: `i1:${stream}:1`, attempt: 1, state_version: 0, state: 'fetching', source_title: 'PRIVATE_SOURCE_TITLE',
  result: null, partial: false, retriable: false, fetched_count: null, parsed_count: null, candidate_count: null, stored_count: null, actions: { retry: false, view: false }, updated_at: timestamp };
const envelopes: TelemetryEnvelope[] = [], errors: string[] = [], pending = new Set<Promise<void>>();
const json = (request: HTTPRequest, body: unknown, status = 200) => request.respond({ status, contentType: 'application/json', headers: { 'Cache-Control': 'no-store' }, body: JSON.stringify(body) });
const receipt = () => ({ operation_id: operation, ingest_id: jobId, state: snapshot.state, disposition: 'created', snapshot, sse_url: `/ingest/${jobId}/events` });
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
async function instrument(page: Page) {
  page.on('pageerror', () => errors.push('PAGE_ERROR')); await page.setRequestInterception(true);
  page.on('request', (request) => {
    const work = (async () => {
      const url = new URL(request.url());
      if (url.origin !== origin && !['data:', 'about:'].includes(url.protocol)) { externalRequests++; await request.abort(); return; }
      if (url.pathname === '/__input_telemetry_fixture') {
        assert.equal(request.method(), 'POST'); envelopes.push(JSON.parse(request.postData()!) as TelemetryEnvelope); await json(request, { accepted: true }); return;
      }
      if (!url.pathname.startsWith('/api/')) { await request.continue(); return; }
      const path = url.pathname.slice(4), owner = identity, body = request.postData() ? JSON.parse(request.postData()!) as Record<string, unknown> : {};
      if (path === '/me') { await json(request, user(owner)); return; }
      const supplied = path.endsWith('/events') ? url.searchParams.get('auth_user_id') : request.headers()['x-auth-user-id'];
      if (supplied !== user(owner).user_id) { await json(request, { error_code: 'AUTH_CONTEXT_CHANGED' }, 409); return; }
      if (path === '/library/cities') { await json(request, { cities: [], unlocated_count: 0 }); return; }
      if (path === '/library/inspirations') { await json(request, { items: [] }); return; }
      if (path === '/user-key') { await json(request, { configured: false, provider: null, key_ref: null }); return; }
      if (path === '/home/input/parse') {
        assert.equal(typeof body.text, 'string'); const text = body.text as string;
        const links = [...text.matchAll(/https:\/\/xhslink\.com\/[a-z]+/g)].map((m) => ({ url: m[0], position: m.index }));
        const result = links.length ? { type: 'xhs_link', original_text: text, links, link_occurrences: links, unrecognized: [{ text: 'PRIVATE_UNRECOGNIZED', reason: 'not_a_link' }] }
          : { type: 'trip_params', original_text: text, trip_params: { city: 'PRIVATE_CITY', days: 3 } };
        if (holdParse) { heldParseRequest = request; await new Promise<void>((resolve) => { releaseParse = resolve; }); }
        await json(request, result); return;
      }
      if (path === '/ingest/xhs') {
        writes++; assert.equal(owner, 'A'); assert.equal(typeof body.operation_id, 'string'); operation = body.operation_id as string;
        await json(request, receipt()); return;
      }
      if (owner !== 'A') { await json(request, { error_code: 'INGEST_JOB_NOT_FOUND' }, 404); return; }
      if (path === `/ingest/commands/${operation}`) { await json(request, receipt()); return; }
      if (path === `/ingest/${jobId}`) { await json(request, snapshot); return; }
      if (path === `/ingest/${jobId}/recovery`) {
        const seq = snapshot.head_cursor!.split(':').at(-1)!;
        await json(request, { mode: 'resync', reason: 'checkpoint_missing', ingest_id: jobId, cursor: snapshot.head_cursor, head_cursor: snapshot.head_cursor, head_seq: seq, replay_floor: seq, snapshot }); return;
      }
      if (path === `/ingest/${jobId}/events`) {
        const body = snapshot.state === 'done' ? `event: complete\ndata: ${JSON.stringify({ kind: 'complete', ingest_id: jobId, cursor: snapshot.head_cursor, attempt: snapshot.attempt, state_version: snapshot.state_version })}\n\n` : ': fixture idle\n\n';
        await request.respond({ status: 200, contentType: 'text/event-stream', body }); return;
      }
      if (path === `/ingest/${jobId}/result`) {
        const result = { id: 'private-result', title: 'PRIVATE_RESULT_TITLE', summary: 'PRIVATE_RESULT_SUMMARY', locate_status: 'pending', asset_count: 2, candidate_count: 0, created_at: timestamp };
        if (holdResult) await new Promise<void>((resolve) => { releaseResult = resolve; });
        await json(request, result); return;
      }
      errors.push('UNDECLARED_FIXTURE_API'); await json(request, { error_code: 'FEATURE_NOT_AVAILABLE' }, 503);
    })().catch(() => { if (!intentionalAborts.has(request) && !/abort|cancel/i.test(request.failure()?.errorText ?? '')) errors.push('FIXTURE_HANDLER_ERROR'); request.abort().catch(() => undefined); });
    pending.add(work); work.finally(() => pending.delete(work)).catch(() => undefined);
  });
}
async function setInput(page: Page, text: string) { await page.click('textarea[aria-label="统一输入"]'); await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control'); await page.keyboard.type(text); }
async function clickText(page: Page, label: string) {
  await page.evaluate(`(() => { const button = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === ${JSON.stringify(label)}); if (!button) throw new Error('PROBE_BUTTON_MISSING'); button.click(); })()`);
}
async function until(check: () => boolean) { for (let n = 0; n < 200; n++) { if (check()) return; await wait(25); } assert.ok(check(), 'INPUT_TELEMETRY_EXPECTATION_FAILED'); }
let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
try {
  let ready = false;
  for (let n = 0; n < 50; n++) {
    if (child.exitCode !== null) throw new Error('INPUT_TELEMETRY_SERVER_EXITED');
    try { if (await (await fetch(origin + '/__input_telemetry_identity', { signal: AbortSignal.timeout(250) })).text() === nonce) { ready = true; break; } } catch { /* Owned server is still starting. */ }
    await wait(100);
  }
  assert.ok(ready, 'INPUT_TELEMETRY_SERVER_NOT_OWNED');
  browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage(); await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 }); await instrument(page); await page.goto(origin);
  await page.waitForSelector('.home-shell', { visible: true });
  await page.evaluate(`(async () => {
    const auth = await import('/src/auth/session-context.ts');
    const { inputTelemetry } = await import('/src/telemetry/input-events.ts');
    const { createTelemetryRuntime } = await import('/src/telemetry/runtime.ts');
    let consent = 'unknown';
    const runtime = createTelemetryRuntime({ requiredPolicyVersion: 'fixture-input-v1', sink: { open: async () => ({
      send: async (event, signal) => { if (signal.aborted) return 'rejected'; const response = await fetch('/__input_telemetry_fixture', { method: 'POST', body: JSON.stringify(event), signal }); return response.ok ? 'accepted' : 'rejected'; },
      close: () => undefined,
    }) } });
    const sync = () => { const state = auth.getAuthSnapshot(); runtime.updateContext({ consent, policyVersion: 'fixture-input-v1', authEpoch: state.epoch, phase: state.phase, host: 'web' }); };
    const removeAuth = auth.subscribeAuth(sync), uninstall = inputTelemetry.install(() => runtime.bind()); sync();
    window.__inputTelemetryProbe = { consent: (value) => { consent = value; sync(); }, snapshot: () => ({ runtime: runtime.snapshot(), producer: inputTelemetry.snapshot() }),
      close: () => { uninstall(); removeAuth(); runtime.close(); } };
  })()`);
  await setInput(page, 'PRIVATE_BEFORE_CONSENT'); await page.click('button[aria-label="发送"]');
  await page.waitForSelector('.home-recognized'); await wait(100); assert.equal(envelopes.length, 0);
  await page.evaluate("window.__inputTelemetryProbe.consent('granted')");
  await setInput(page, 'https://xhslink.com/private PRIVATE_INPUT_TEXT'); await page.click('button[aria-label="发送"]');
  await until(() => envelopes.some((e) => e.name === 'ingest_job_created'));
  assert.equal(writes, 1);
  await page.click('button[aria-label="菜单"]'); await page.waitForSelector('button[aria-label="返回首页"]');
  snapshot = { ...snapshot, state: 'done', state_version: 1, head_cursor: `i1:${stream}:2`, stored_count: 2,
    result: { inspiration_id: 'private-result', asset_count: 2, locate_status: 'pending', city_name: 'PRIVATE_CITY' }, actions: { retry: false, view: true } };
  await wait(150); assert.equal(envelopes.filter((e) => e.name === 'ingest_presented').length, 0);
  await page.evaluate(`(() => {
    const cover = document.createElement('div'); cover.id = 'input-telemetry-cover';
    Object.assign(cover.style, { position: 'fixed', inset: '0', zIndex: '2147483647', background: 'rgba(0,0,0,.1)' });
    document.body.append(cover);
    document.querySelector('button[aria-label="返回首页"]').click();
  })()`);
  await page.waitForSelector('.dock-completion', { visible: true });
  const coveredBy = await page.evaluate(`(() => { const bounds = document.querySelector('.dock-completion').getBoundingClientRect(); return document.elementFromPoint((bounds.left + bounds.right) / 2, (bounds.top + bounds.bottom) / 2)?.id; })()`);
  assert.equal(coveredBy, 'input-telemetry-cover'); await wait(150);
  assert.equal(envelopes.filter((e) => e.name === 'ingest_presented').length, 0);
  await page.evaluate("document.getElementById('input-telemetry-cover').remove()");
  await until(() => envelopes.some((e) => e.name === 'ingest_presented'));
  holdResult = true; await clickText(page, '查看已保存内容'); await until(() => !!releaseResult);
  assert.equal(envelopes.filter((e) => e.name === 'import_record_opened').length, 0);
  holdResult = false; releaseResult!(); releaseResult = undefined;
  await until(() => envelopes.filter((e) => e.name === 'import_record_opened').length === 1);
  await page.screenshot({ path: resolve(output, 'actual-opened-result.png'), fullPage: true });
  await clickText(page, '关闭'); await page.waitForFunction("!document.querySelector('[role=dialog]')");
  await page.waitForFunction('window.__inputTelemetryProbe.snapshot().runtime.counters.duplicate >= 1');
  assert.equal(envelopes.filter((e) => e.name === 'ingest_presented').length, 1);
  // A new permission generation cannot adopt a result request captured before revocation.
  holdResult = true; await clickText(page, '查看已保存内容'); await until(() => !!releaseResult);
  await page.evaluate("window.__inputTelemetryProbe.consent('denied'); window.__inputTelemetryProbe.consent('granted')");
  holdResult = false; releaseResult!(); releaseResult = undefined;
  await page.waitForFunction("document.querySelector('[role=dialog]')?.textContent?.includes('PRIVATE_RESULT_TITLE')"); await wait(400);
  assert.equal(envelopes.filter((e) => e.name === 'import_record_opened').length, 1);
  await clickText(page, '关闭'); await page.waitForFunction("!document.querySelector('[role=dialog]')");
  // Freeze an old owner's classification, switch actual App identity, then release the old response.
  holdParse = true; await setInput(page, 'PRIVATE_OLD_OWNER_REQUEST'); await page.click('button[aria-label="发送"]'); await until(() => !!releaseParse);
  const before = envelopes.filter((e) => e.name === 'home_input_classified').length;
  assert.ok(heldParseRequest); intentionalAborts.add(heldParseRequest);
  identity = 'B'; await page.evaluate("window.dispatchEvent(new Event('focus'))");
  await page.waitForFunction("document.querySelector('textarea')?.value === ''");
  holdParse = false; releaseParse!(); releaseParse = undefined; await wait(200);
  assert.equal(envelopes.filter((e) => e.name === 'home_input_classified').length, before); assert.equal(writes, 1);
  const counters = await page.evaluate('window.__inputTelemetryProbe.snapshot()') as ProbeSnapshot; await page.evaluate('window.__inputTelemetryProbe.close()');
  const network = JSON.stringify(envelopes);
  for (const secret of ['PRIVATE', 'fixture-input-owner', 'fixture-input-session', 'xhslink.com', jobId, jobId.slice(4)]) assert.ok(!network.includes(secret), 'PRIVATE_VALUE_IN_NETWORK');
  assert.deepEqual(errors, []); assert.equal(externalRequests, 0); assert.deepEqual(await hashes(), sourceSha256); assert.equal(child.exitCode, null);
  assert.equal(new Set(envelopes.filter((e) => e.name === 'ingest_presented').map((e) => e.eventId)).size, 1);
  const counts = Object.fromEntries([...new Set(envelopes.map((e) => e.name))].map((name) => [name, envelopes.filter((e) => e.name === name).length]));
  assert.equal(counts.home_input_submit, 2); assert.equal(counts.home_input_classified, 1);
  assert.equal(counts.ingest_job_created, 1); assert.equal(counts.ingest_presented, 2); assert.equal(counts.import_record_opened, 1);
  await writeFile(resolve(output, 'report.json'), JSON.stringify({ kind: 'actual-app-input-telemetry-probe', result: 'passed', sourceSha256,
    baselineCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), browser: await browser.version(), counts, envelopes, counters,
    realIndexedDb: true, explicitHttpAndIdentityFixture: true, realAuthenticationVerified: false, realSdkInitialized: false, realProviderQueryVerified: false, realProviderCalls: 0, nativeConsentVerified: false,
    writes, externalRequests, checks: ['pre-consent-not-exported', 'classification-vs-admission-vs-render', 'created-only-confirmed-mutation', 'background-terminal-not-presentation', 'occluded-completion-not-presentation',
      'actual-result-visibility', 'same-presentation-id-after-coverage', 'old-consent-result-not-rebound', 'old-owner-classification-not-rebound', 'serialized-private-sentinels-absent', 'owned-server-and-unchanged-sources'] }, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ result: 'input-telemetry-browser-passed', output, counts, writes, externalRequests }));
} catch (error) {
  await writeFile(resolve(output, 'failure.json'), JSON.stringify({ kind: 'actual-app-input-telemetry-probe', result: 'failed',
    errorType: error instanceof Error ? error.name : 'unknown', errors, externalRequests, writes }, null, 2) + '\n', { flag: 'wx' });
  throw error;
} finally {
  releaseResult?.(); releaseParse?.(); await browser?.close(); await Promise.allSettled([...pending]); child.kill('SIGTERM');
}
