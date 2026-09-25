import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { createHash, randomUUID } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '../../..'), mobile = resolve(root, 'apps/mobile');
const puppeteer = createRequire(resolve(root, 'apps/server/package.json'))('puppeteer');
const origin = 'http://127.0.0.1:5191', nonce = randomUUID();
const files = ['apps/mobile/src/telemetry/dictionary.ts', 'apps/mobile/src/telemetry/runtime.ts', 'apps/mobile/src/auth/analytics.ts', 'apps/mobile/scripts/telemetry-browser-probe.mjs'];
const hashes = async () => Object.fromEntries(await Promise.all(files.map(async (file) => [file, createHash('sha256').update(await readFile(resolve(root, file))).digest('hex')])));
const sourceSha256 = await hashes();
const config = resolve(await mkdtemp('/tmp/nomad-telemetry-vite-'), 'config.mjs');
await writeFile(config, `import base from ${JSON.stringify(resolve(mobile, 'vite.config.ts'))}; export default {...base,root:${JSON.stringify(mobile)},plugins:[...base.plugins,{name:'telemetry-owner',configureServer(server){server.middlewares.use((req,res,next)=>{if(req.url==='/__telemetry_identity'){res.end(${JSON.stringify(nonce)});return;}next();});}}]};`);
const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', config, '--host', '127.0.0.1', '--port', '5191', '--strictPort'], { cwd: mobile, stdio: 'ignore' });
let browser;
try {
  let ready = false;
  for (let i = 0; i < 50; i++) {
    if (child.exitCode !== null) throw new Error('TELEMETRY_PROBE_SERVER_EXITED');
    try { if (await (await fetch(origin + '/__telemetry_identity')).text() === nonce) { ready = true; break; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(ready, 'TELEMETRY_PROBE_SERVER_NOT_OWNED');
  browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage(); const envelopes = [], pageErrors = []; let externalRequests = 0;
  page.on('pageerror', () => pageErrors.push('PAGE_ERROR')); await page.setRequestInterception(true);
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin !== origin) { externalRequests++; return request.abort(); }
    if (url.href === origin + '/') return request.respond({ status: 200, contentType: 'text/html', body: '<html lang="zh"><body>Explicit telemetry adapter fixture</body></html>' });
    if (url.pathname === '/__telemetry_fixture') {
      assert.equal(request.method(), 'POST'); envelopes.push(JSON.parse(request.postData()));
      return request.respond({ status: 200, contentType: 'application/json', body: '{"accepted":true}' });
    }
    return request.continue();
  });
  await page.goto(origin);
  const result = await page.evaluate(async () => {
    const { createTelemetryRuntime } = await import('/src/telemetry/runtime.ts');
    const pause = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));
    const context = { consent: 'granted', policyVersion: 'fixture-privacy-v1', authEpoch: 1, phase: 'authenticated', host: 'web' };
    let opens = 0, closes = 0;
    const session = () => ({
      async send(envelope, signal) { if (signal.aborted) return 'rejected'; await fetch('/__telemetry_fixture', { method: 'POST', body: JSON.stringify(envelope), signal }); return 'accepted'; },
      close() { closes++; },
    });
    const runtime = createTelemetryRuntime({ requiredPolicyVersion: 'fixture-privacy-v1', sink: { async open() { opens++; return session(); } } });
    runtime.updateContext({ ...context, consent: 'unknown' }); runtime.bind().track('home_view', { source_page: 'home' }); await pause();
    if (opens !== 0) throw new Error('CONSENT_BYPASS');
    runtime.updateContext(context); const bound = runtime.bind();
    const firstId = '00000000-0000-4000-8000-000000000001';
    bound.trackWithId('auth_otp_verify_fail', { method: 'phone', reason_code: 'PRIVATE_SENTINEL', phone: '13800138000', url: 'https://private.invalid/token' }, firstId);
    bound.trackWithId('home_view', { source_page: 'home', method: 'PRIVATE_SENTINEL', nested: { token: 'PRIVATE_SENTINEL' } }, '00000000-0000-4000-8000-000000000002');
    bound.trackWithId('auth_otp_verify_fail', { method: 'phone' }, firstId);
    bound.track('auth_method_tap', { method: 'PRIVATE_SENTINEL' }); bound.track('feedback_submit_success', {});
    for (let i = 0; i < 100 && runtime.snapshot().counters.accepted < 2; i++) await pause(20);
    const first = runtime.snapshot(); runtime.close(); await pause();
    if (first.counters.accepted !== 2 || first.counters.duplicate !== 1 || first.counters.invalid !== 2) throw new Error('PRIVACY_ENVELOPE_COVERAGE_INVALID');
    let release, init = 0, oldCloses = 0;
    const delayed = createTelemetryRuntime({ requiredPolicyVersion: 'fixture-privacy-v1', sink: { open() { init++; return init === 1 ? new Promise((resolve) => { release = resolve; }) : Promise.resolve(session()); } } });
    delayed.updateContext(context); const stale = delayed.bind(); stale.track('home_view', { source_page: 'home' }); await pause();
    delayed.updateContext({ ...context, consent: 'denied' }); delayed.updateContext({ ...context, authEpoch: 3 });
    release({ ...session(), close() { oldCloses++; } }); await pause(); stale.track('home_view', { source_page: 'home' });
    delayed.bind().trackWithId('home_view', { source_page: 'home' }, '00000000-0000-4000-8000-000000000003');
    for (let i = 0; i < 100 && delayed.snapshot().counters.accepted < 1; i++) await pause(20);
    const rebound = delayed.snapshot(); delayed.close(); await pause();
    if (init !== 2 || oldCloses !== 1 || rebound.counters.accepted !== 1 || rebound.counters.abandoned !== 1 || rebound.counters.blocked !== 1) throw new Error('LATE_CONTEXT_COVERAGE_INVALID');
    return { first, rebound, opens, closes, oldCloses };
  });
  assert.equal(envelopes.length, 3); assert.equal(externalRequests, 0); assert.deepEqual(pageErrors, []);
  const network = JSON.stringify(envelopes);
  for (const sentinel of ['PRIVATE_SENTINEL', '13800138000', 'private.invalid', 'ownerId', 'sessionId']) assert.ok(!network.includes(sentinel), 'PRIVATE_VALUE_REACHED_NETWORK');
  assert.deepEqual(envelopes.map((row) => row.props), [{ method: 'phone' }, { source_page: 'home' }, { source_page: 'home' }]);
  assert.deepEqual(await hashes(), sourceSha256); assert.equal(child.exitCode, null);
  const output = resolve(root, '_bmad-output/implementation-artifacts/evidence/story-1-6-telemetry-2026-09-19'); await mkdir(output, { recursive: true });
  await writeFile(resolve(output, 'browser-report.json'), JSON.stringify({ result: 'passed', sourceSha256, browser: await browser.version(),
    actualBrowser: true, explicitHttpSinkFixture: true, rawNetworkEnvelopesChecked: envelopes.length, externalRequests,
    realSdkInitialized: false, realProviderQueryVerified: false, nativeConsentVerified: false,
    checks: ['unknown-consent-no-initialize', 'safe-serialized-network-envelope', 'value-level-private-sentinels-removed', 'stable-event-id-dedupe', 'obsolete-event-disabled', 'late-initialize-closed', 'old-bound-emitter-isolated', 'old-queue-abandoned', 'owned-vite-and-unchanged-source'], counters: result }, null, 2) + '\n');
  console.log(JSON.stringify({ result: 'telemetry-browser-probe-passed', output, fixtureEnvelopes: envelopes.length, realProviderCalls: 0 }));
} finally { await browser?.close(); child.kill('SIGTERM'); }
