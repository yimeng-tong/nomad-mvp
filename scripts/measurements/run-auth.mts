import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { availableParallelism, platform, release } from 'node:os';
import type { HTTPRequest, Page } from 'puppeteer';
import { createAuthMeasurementReport, type AuthMeasurementManifest, type AuthMeasurementSample, type AuthOutcome } from '../../packages/types/src/auth-measurements.js';

type Harness = typeof import('../../apps/mobile/scripts/auth-measurement-harness.js');
declare global { interface Window { __authMeasurement: Harness } }
const root = resolve(import.meta.dirname, '../..'), mobile = resolve(root, 'apps/mobile');
const puppeteer = createRequire(resolve(root, 'apps/server/package.json'))('puppeteer') as typeof import('puppeteer');
const profile = process.argv[2] ?? 'matrix';
if (!['matrix', 'deadline-cutoff'].includes(profile)) throw new Error('AUTH_MEASUREMENT_PROFILE_INVALID');
const testFault = process.env.AUTH_MEASUREMENT_TEST_FAULT ?? '';
if (!['', 'between-cases', 'hidden-home', 'integrity-failure', 'source-read-failure'].includes(testFault)) throw new Error('AUTH_MEASUREMENT_FAULT_INVALID');
const port = Number(process.env.AUTH_MEASUREMENT_PORT ?? 5194);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('AUTH_MEASUREMENT_PORT_INVALID');
const plan: AuthMeasurementManifest['scenarioPlan'] = [
  { scenario: 'login', count: 3 }, { scenario: 'send-rejected', count: 1 }, { scenario: 'send-unknown', count: 1 },
  { scenario: 'verify-rejected', count: 1 }, { scenario: 'restore', count: 1 }, { scenario: 'invalid-session', count: 1 },
  { scenario: 'authority-unavailable', count: 1 }, { scenario: 'logout', count: 1 }, { scenario: 'logout-recovery', count: 1 }, { scenario: 'missing-terminal', count: 1 },
];
const cases = plan.flatMap((p) => Array.from({ length: p.count }, () => p.scenario));
const runId = randomUUID(), output = resolve(root, process.env.AUTH_MEASUREMENT_OUTPUT ?? `.measurement-results/auth/${profile}-${runId}`);
await mkdir(dirname(output), { recursive: true }); await mkdir(output, { recursive: false });
const sources = ['scripts/measurements/run-auth.mts', 'scripts/measurements/auth-report.mts', 'scripts/measurements/tsconfig.json',
  'packages/types/src/auth-measurements.ts', 'packages/types/src/measurement-common.ts', 'apps/mobile/scripts/auth-measurement-harness.tsx',
  'apps/mobile/vite.config.ts', 'apps/mobile/package.json', 'apps/server/package.json', 'packages/types/package.json', 'packages/types/src/api-types.ts', 'docs/api/openapi.yaml', 'pnpm-lock.yaml',
  ...execFileSync('git', ['ls-files', '--', 'apps/mobile/src', 'packages/native-auth/src'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean)];
let injectUnreadableSource = false;
const hashes = async () => {
  // A missing file in this fresh probe directory exercises ENOENT without altering repository sources.
  if (injectUnreadableSource) await readFile(resolve(output, 'absent-source-read-counterexample'));
  return Object.fromEntries(await Promise.all(sources.map(async (path) => [path, createHash('sha256').update(await readFile(resolve(root, path))).digest('hex')] as const)));
};
const sourceSha256 = await hashes(), nonce = randomUUID(), origin = `http://127.0.0.1:${port}`;
const config = resolve(await mkdtemp('/tmp/nomad-auth-measurement-vite-'), 'config.mjs');
await writeFile(config, `import base from ${JSON.stringify(resolve(mobile, 'vite.config.ts'))}; export default {...base,root:${JSON.stringify(mobile)},envDir:false,plugins:[...base.plugins,{name:'auth-measurement-owner',configureServer(server){server.middlewares.use((req,res,next)=>{if(req.url==='/__measurement_identity'){res.end(${JSON.stringify(nonce)});return;}next();});}}]};`);
const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', config, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  cwd: mobile, env: { ...process.env, VITE_API_BASE_URL: `${origin}/api` }, stdio: 'ignore',
});
let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
let page: Page | undefined, collectorStarted = false, evidenceCaptured = false, dataset: ReturnType<Harness['finishRun']> | undefined;
let browserVersion: string | null = null, startedAt: string | null = null;
let failure: { code: string; scenario?: Scenario; step?: string } | null = null;
const writeStatus = (status: 'running' | 'passed' | 'failed', captureAvailable: boolean) => writeFile(resolve(output, 'run-status.json'), JSON.stringify({
  kind: 'auth-measurement-run-status', runId, profile, testFault, status, failure, captureAvailable }, null, 2) + '\n');
await writeStatus('running', false);
type Scenario = AuthMeasurementSample['scenario'];
type Identity = { user_id: string; user: { id: string; phone: null }; session: { id: string; device_id: string; expires_at: string } };
const user = (n: number): Identity => ({ user_id: `synthetic-auth-${n}`, user: { id: `synthetic-auth-${n}`, phone: null }, session: { id: `synthetic-session-${n}`, device_id: 'synthetic-browser', expires_at: '2030-01-01T00:00:00Z' } });
let serial = 0;
function state(scenario: Scenario) { serial++; return { scenario, identity: ['restore', 'authority-unavailable', 'logout', 'logout-recovery'].includes(scenario) ? user(serial) : null as Identity | null,
  nextIdentity: user(serial), logoutOperations: [] as string[], writes: 0 }; }
let fixture = state('login'); const fixtureHistory = [fixture];
const pageErrors: string[] = [], requestErrors: string[] = [];
let blockedExternalRequests = 0;
const json = (request: HTTPRequest, body: unknown, status = 200) => request.respond({ status, contentType: 'application/json', headers: { 'Cache-Control': 'no-store' }, body: JSON.stringify(body) });
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
async function instrument(page: Page) {
  page.on('pageerror', () => pageErrors.push('BROWSER_PAGE_ERROR'));
  await page.setRequestInterception(true);
  page.on('request', (request) => { void (async () => {
    const url = new URL(request.url());
    if (url.origin !== origin && !['data:', 'about:'].includes(url.protocol)) { blockedExternalRequests++; return request.abort(); }
    if (url.href === origin + '/') return request.respond({ status: 200, contentType: 'text/html', body: '<html lang="zh"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => (type) => type; window.__vite_plugin_react_preamble_installed__ = true;</script></body></html>' });
    if (!url.pathname.startsWith('/api/')) return request.continue();
    const f = fixture, path = url.pathname.slice(4), body = request.postData() ? JSON.parse(request.postData()!) as Record<string, unknown> : {};
    if (request.method() === 'POST') f.writes++;
    if (path === '/auth/config') return json(request, { availability: 'ready', privacy_url: `${origin}/fixture/privacy`, user_agreement_url: `${origin}/fixture/terms`,
      enabled_methods: [{ id: 'phone', label: '手机号', type: 'phone', enabled: true }], ios_equal_weight_order: ['phone'], captcha: { provider: 'fixture', mode: 'off' } });
    if (path === '/me') return f.scenario === 'authority-unavailable' ? json(request, { error_code: 'AUTH_AUTHORITY_UNAVAILABLE', message: '合成权威不可用' }, 503)
      : f.identity ? json(request, f.identity) : json(request, { error_code: 'AUTH_SESSION_EXPIRED', message: '合成会话失效' }, 401);
    if (path === '/auth/otp/start') {
      assert.equal(body.phone, '13800138000');
      if (profile === 'deadline-cutoff') await delay(400);
      if (f.scenario === 'send-rejected') return json(request, { error_code: 'AUTH_SEND_REJECTED', message: '合成发送被拒绝' }, 403);
      return json(request, { sent: f.scenario !== 'send-unknown', delivery_state: f.scenario === 'send-unknown' ? 'unknown' : 'sent', challenge_id: 'synthetic-challenge', captcha_required: false, retry_after_sec: 0 });
    }
    if (path === '/auth/otp/verify') {
      assert.equal(body.challenge_id, 'synthetic-challenge');
      if (f.scenario === 'missing-terminal') return;
      if (f.scenario === 'verify-rejected') return json(request, { error_code: 'AUTH_OTP_INVALID', message: '合成验证被拒绝' }, 401);
      f.identity = f.nextIdentity; return json(request, f.identity);
    }
    if (path === '/logout') {
      assert.equal(typeof body.operation_id, 'string'); f.logoutOperations.push(body.operation_id as string);
      if (f.scenario === 'logout-recovery' && f.logoutOperations.length === 1) return json(request, { error_code: 'AUTH_AUTHORITY_UNAVAILABLE', message: '合成退出响应未知' }, 503);
      f.identity = null; return json(request, { ok: true });
    }
    if (!f.identity) return json(request, { error_code: 'AUTH_SESSION_EXPIRED' }, 401);
    assert.equal(request.headers()['x-auth-user-id'], f.identity.user_id);
    if (path === '/library/cities') return json(request, { cities: [], unlocated_count: 0 });
    if (path === '/library/inspirations') return json(request, { items: [] });
    if (path === '/user-key') return json(request, { configured: false, provider: null, key_ref: null });
    return json(request, { error_code: 'FEATURE_NOT_AVAILABLE' }, 503);
  })().catch(() => { requestErrors.push('FIXTURE_HTTP_HANDLER_FAILED'); void request.abort().catch(() => undefined); }); });
}
async function text(page: Page, value: string, timeout = 5000) {
  await page.waitForFunction((phrase) => document.body.innerText.includes(phrase), { timeout, polling: 20 }, value);
}
async function click(page: Page, value: string) {
  await page.evaluate((label) => {
    if (window.__authMeasurement.remaining() === 0) throw new Error('AUTH_MEASUREMENT_WINDOW_CLOSED');
    const button = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === label);
    if (!button || button.disabled) throw new Error('AUTH_MEASUREMENT_ACTION_MISSING'); button.click();
  }, value);
}
async function preserve(data: ReturnType<Harness['finishRun']>, status: 'passed' | 'failed') {
  // Save safe raw observations before report generation: malformed timing must not erase a run.
  await writeFile(resolve(output, 'samples.json'), JSON.stringify(data, null, 2) + '\n', { flag: 'wx' });
  let currentHashes: Record<string, string> | null = null;
  try { currentHashes = await hashes(); } catch { /* Unreadable source invalidates acceptance, never the retained observations. */ }
  const sourceUnchanged = currentHashes ? JSON.stringify(currentHashes) === JSON.stringify(sourceSha256) : null;
  const effectiveStatus = sourceUnchanged === true ? status : 'failed';
  if (effectiveStatus !== status) failure = { code: 'AUTH_MEASUREMENT_SOURCE_CHANGED_OR_UNREADABLE' };
  const report = createAuthMeasurementReport(data.manifest, data.samples);
  const provenance = { runId, profile, testFault, runStatus: effectiveStatus, baselineCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), sourceSha256, sourceUnchanged, sourceReadable: currentHashes !== null,
    fixtureSha256: sourceSha256['scripts/measurements/run-auth.mts'], environment: { os: platform(), release: release(), availableParallelism: availableParallelism(), node: process.version, browser: browserVersion, viewport: { width: 390, height: 844, deviceScaleFactor: 1 } },
    startedAt, endedAt: new Date().toISOString(), clock: 'one browser performance.now; no client/server subtraction', network: 'owned loopback Vite; explicit browser HTTP interception; external blocked',
    providerCalls: 0, routesModelsPrompts: null, routesModelsPromptsReason: 'no-real-provider-execution', usage: null, cost: null,
    realAuthenticationVerified: false, realProviderVerified: false, nativeDeviceVerified: false, productionPerformanceVerified: false,
    actualHttpWriteAttempts: fixtureHistory.reduce((n, f) => n + f.writes, 0), sharedWindowAndQuantiles: 'packages/types/src/measurement-common.ts' };
  await writeFile(resolve(output, 'report.json'), JSON.stringify({ provenance, ...report }, null, 2) + '\n', { flag: 'wx' });
  evidenceCaptured = true;
  await writeStatus(effectiveStatus, true);
  assert.equal(effectiveStatus, status, 'AUTH_MEASUREMENT_SOURCE_CHANGED_OR_UNREADABLE');
  return report;
}
try {
  let ready = false;
  for (let i = 0; i < 50; i++) {
    if (child.exitCode !== null) throw new Error('AUTH_MEASUREMENT_SERVER_EXITED');
    try { if (await (await fetch(origin + '/__measurement_identity', { signal: AbortSignal.timeout(250) })).text() === nonce) { ready = true; break; } } catch { /* Owned server may still be starting or another service owns the port. */ }
    await delay(100);
  }
  assert.ok(ready, 'AUTH_MEASUREMENT_SERVER_NOT_OWNED');
  browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  browserVersion = await browser.version(); page = await browser.newPage(); await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 }); await instrument(page); await page.goto(origin);
  await page.evaluate(async () => { window.__authMeasurement = await import(/* @vite-ignore */ '/scripts/' + 'auth-measurement-harness.tsx') as Harness; window.__authMeasurement.mount(); });
  await text(page, '获取验证码'); await page.type('input[name="phone"]', '13800138000');
  if (testFault === 'hidden-home') await page.addStyleTag({ content: '.home-shell { display: none !important; }' });
  startedAt = new Date().toISOString();
  await page.evaluate((parameters) => window.__authMeasurement.beginRun(parameters.plan, parameters.deadline), { plan, deadline: profile === 'deadline-cutoff' ? 250 : testFault === 'between-cases' ? 5000 : 60000 });
  collectorStarted = true;
  for (const [index, scenario] of cases.entries()) {
    if (!await page.evaluate(() => window.__authMeasurement.remaining())) break;
    const restore = ['restore', 'invalid-session', 'authority-unavailable'].includes(scenario), logout = scenario.startsWith('logout');
    let outcome: AuthOutcome = 'success', step = 'prepare';
    try {
    if (index > 0) {
      if (testFault === 'between-cases' && index === 1) await delay(5100);
      fixture = state(scenario); fixtureHistory.push(fixture);
      if (restore) await page.evaluate((name) => { const h = window.__authMeasurement; h.beginCase(name); h.beginUiPhase('protected-home'); }, scenario);
      await page.evaluate(() => window.__authMeasurement.mount());
      if (!restore) {
        if (logout) await page.waitForSelector('.home-shell', { visible: true }); else await text(page, '获取验证码');
        if (logout) { await page.click('button[aria-label="菜单"]'); await text(page, '退出当前登录'); await click(page, '退出当前登录'); await text(page, '确认退出'); }
        else await page.type('input[name="phone"]', '13800138000');
      }
    }
    if (!restore) await page.evaluate((name) => window.__authMeasurement.beginCase(name), scenario);
      if (restore) {
        step = 'restore';
        if (scenario === 'restore') await page.waitForSelector('.home-shell', { visible: true, timeout: 5000 });
        else { await text(page, scenario === 'invalid-session' ? '获取验证码' : '暂时无法确认登录状态'); outcome = scenario === 'invalid-session' ? 'rejected' : 'unavailable'; }
      } else if (logout) {
        step = 'logout';
        await click(page, '确认退出');
        if (scenario === 'logout-recovery') { await text(page, '退出结果尚未确认'); await page.evaluate(() => window.__authMeasurement.beginUiPhase('logout-recovery')); await click(page, '重试确认'); }
        await text(page, '获取验证码');
      } else {
        step = 'send';
        await click(page, '获取验证码');
        await text(page, scenario === 'send-rejected' ? '验证码未发送' : scenario === 'send-unknown' ? '发送结果尚未确认' : '验证码已发送', profile === 'deadline-cutoff' ? 500 : 5000);
        if (scenario === 'send-rejected' || scenario === 'send-unknown') outcome = scenario === 'send-rejected' ? 'rejected' : 'unknown';
        else {
          step = 'verify';
          await page.type('input[name="otp"]', '123456'); await page.evaluate(() => window.__authMeasurement.beginUiPhase('protected-home')); await click(page, '登录');
          if (scenario === 'verify-rejected') { await text(page, '验证码不正确，请检查后重试'); outcome = 'rejected'; }
          else if (scenario === 'missing-terminal') { await delay(300); outcome = 'unfinished'; }
          else await page.waitForSelector('.home-shell', { visible: true, timeout: 5000 });
        }
      }
    } catch {
      if (await page.evaluate(() => window.__authMeasurement.remaining()) > 0) {
        await page.screenshot({ path: resolve(output, 'failure.png'), fullPage: true });
        failure = { code: 'AUTH_MEASUREMENT_SCENARIO_FAILED', scenario, step };
        throw new Error(JSON.stringify({ code: 'AUTH_MEASUREMENT_SCENARIO_FAILED', scenario, step, pageErrors, requestErrors, writes: fixture.writes }));
      }
      await page.evaluate(() => window.__authMeasurement.finishCase('unfinished'));
      break;
    }
    const recovered = scenario === 'logout-recovery' ? fixture.logoutOperations.length === 2 && fixture.logoutOperations[0] === fixture.logoutOperations[1] : null;
    if (scenario === 'logout-recovery') assert.equal(recovered, true);
    await page.evaluate((result) => window.__authMeasurement.finishCase(result.outcome, result.recovered), { outcome, recovered });
  }
  dataset = await page.evaluate(() => window.__authMeasurement.finishRun());
  const report = createAuthMeasurementReport(dataset.manifest, dataset.samples);
  if (testFault === 'source-read-failure') injectUnreadableSource = true;
  assert.deepEqual(pageErrors, []); assert.deepEqual(requestErrors, []); assert.equal(blockedExternalRequests, 0); assert.deepEqual(await hashes(), sourceSha256);
  for (const key of ['invalidSamples', 'conflictingSamples', 'unplannedScenario', 'invalidClock', 'outsideWindow', 'invalidTiming'] as const) assert.equal(report.overall.coverage[key], 0);
  if (profile === 'matrix') {
    assert.equal(report.overall.coverage.observedLogicalRequests, 12); assert.equal(report.overall.coverage.missingLogicalRequests, 0); assert.equal(report.overall.originalLogoutRecoveries, 1);
    assert.deepEqual(report.overall.outcomes, { success: 6, rejected: 3, unknown: 1, unavailable: 1, unfinished: 1 });
    assert.equal(fixtureHistory.reduce((n, f) => n + f.writes, 0), 15);
    for (const phase of Object.values(report.overall.phases)) assert.equal(phase.notObservedCases, 0);
  }
  else { assert.equal(report.overall.coverage.observedLogicalRequests, 1); assert.equal(report.overall.coverage.missingLogicalRequests, 11); assert.equal(report.overall.outcomes.unfinished, 1); assert.equal(fixtureHistory.reduce((n, f) => n + f.writes, 0), 1); assert.equal(dataset.samples[0].phases[0].endedMs, null); }
  if (testFault === 'integrity-failure') assert.fail('AUTH_MEASUREMENT_TEST_INTEGRITY_FAILURE');
  await preserve(dataset, 'passed');
  console.log(JSON.stringify({ result: 'auth-measurement-recorded', profile, output, logicalRequests: report.overall.coverage.observedLogicalRequests, missing: report.overall.coverage.missingLogicalRequests, providerCalls: 0 }));
} catch {
  failure ??= { code: collectorStarted ? 'AUTH_MEASUREMENT_INTEGRITY_OR_DEADLINE_FAILED' : 'AUTH_MEASUREMENT_SETUP_FAILED' };
  let captureAvailable = evidenceCaptured;
  try {
    if (!dataset && page && collectorStarted) dataset = await page.evaluate(() => window.__authMeasurement.finishRun());
    if (dataset && !evidenceCaptured) { await preserve(dataset, 'failed'); captureAvailable = true; }
  } catch { /* The safe run status still records an unavailable report; raw samples, if written, stay intact. */ }
  await writeStatus('failed', captureAvailable);
  process.stderr.write('AUTH_MEASUREMENT_RUN_FAILED\n'); process.exitCode = 1;
} finally { await browser?.close(); child.kill('SIGTERM'); }
