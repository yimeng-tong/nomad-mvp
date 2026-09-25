import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createHash, randomUUID } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { availableParallelism, release, platform } from 'node:os';
import { createImportMeasurementReport, type ImportMeasurementManifest, type ImportMeasurementSample } from '../../packages/types/src/import-measurements.js';
type ImportHarness = typeof import('../../apps/mobile/scripts/import-measurement-harness.js');

const root = resolve(import.meta.dirname, '../..'), mobile = resolve(root, 'apps/mobile');
const puppeteer = createRequire(resolve(root, 'apps/server/package.json'))('puppeteer') as typeof import('puppeteer');
const profile = process.argv[2] ?? 'matrix';
if (profile !== 'matrix' && profile !== 'fixed-single' && profile !== 'deadline-cutoff') throw new Error('MEASUREMENT_PROFILE_INVALID');
const output = resolve(root, process.env.IMPORT_MEASUREMENT_OUTPUT ?? '_bmad-output/implementation-artifacts/evidence/story-1-6-measurement-2026-09-19', profile);
await mkdir(output, { recursive: true });
const sources = ['scripts/measurements/run-import-dock.mts', 'scripts/measurements/tsconfig.json', 'packages/types/package.json', 'pnpm-lock.yaml', 'apps/mobile/vite.config.ts', 'packages/types/src/import-measurements.ts', 'packages/types/src/measurement-common.ts', 'apps/mobile/scripts/import-measurement-harness.tsx', 'apps/mobile/src/home/dock-controller.ts', 'apps/mobile/src/home/dock-model.ts', 'apps/mobile/src/home/HomeImportDock.tsx', 'apps/mobile/src/home/operation-journal.ts'];
const hashes = async () => Object.fromEntries(await Promise.all(sources.map(async (file) => [file, createHash('sha256').update(await readFile(resolve(root, file))).digest('hex')] as const)));
const sourceSha256 = await hashes(), nonce = randomUUID(), origin = 'http://127.0.0.1:5190';
const config = resolve(await mkdtemp('/tmp/nomad-measurement-vite-'), 'config.mjs');
await writeFile(config, `import base from ${JSON.stringify(resolve(mobile, 'vite.config.ts'))}; export default {...base,root:${JSON.stringify(mobile)},plugins:[...base.plugins,{name:'measurement-owner',configureServer(server){server.middlewares.use((req,res,next)=>{if(req.url==='/__measurement_identity'){res.end(${JSON.stringify(nonce)});return;}next();});}}]};`);
const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', config, '--host', '127.0.0.1', '--port', '5190', '--strictPort'], { cwd: mobile, stdio: 'ignore' });
let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
try {
  let ready = false;
  for (let i = 0; i < 50; i++) { if (child.exitCode !== null) throw new Error('MEASUREMENT_SERVER_EXITED'); try { if (await (await fetch(origin + '/__measurement_identity', { signal: AbortSignal.timeout(250) })).text() === nonce) { ready = true; break; } } catch { /* Owned loopback server is still starting or another service owns the port. */ } await new Promise((r) => setTimeout(r, 100)); }
  assert.ok(ready, 'MEASUREMENT_SERVER_NOT_OWNED');
  browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage(); await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  let blockedExternalRequests = 0; const pageErrors: string[] = [];
  page.on('pageerror', () => pageErrors.push('BROWSER_PAGE_ERROR')); await page.setRequestInterception(true);
  page.on('request', (request) => { (async () => {
    const url = new URL(request.url());
    if (url.origin !== origin && !['data:', 'about:'].includes(url.protocol)) { blockedExternalRequests++; return request.abort(); }
    if (url.href === origin + '/') return request.respond({ status: 200, contentType: 'text/html', body: '<html lang="zh"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => (type) => type; window.__vite_plugin_react_preamble_installed__ = true;</script></body></html>' });
    return request.continue();
  })().catch(() => { pageErrors.push('BROWSER_REQUEST_ERROR'); }); });
  const startedAt = new Date().toISOString(); await page.goto(origin);
  const dataset = await page.evaluate(async (selected) => {
    if (selected !== 'matrix' && selected !== 'fixed-single' && selected !== 'deadline-cutoff') throw new Error('MEASUREMENT_PROFILE_INVALID');
    // This harness is a diagnostic module served by this owned Vite instance, not part of the app entry.
    const { runImportMeasurement } = await import(/* @vite-ignore */ '/scripts/' + 'import-measurement-harness.tsx') as ImportHarness;
    return runImportMeasurement(selected);
  }, profile) as { manifest: ImportMeasurementManifest; samples: ImportMeasurementSample[]; fixturePlan: Array<{ scenario: string; count: number }> };
  assert.deepEqual(pageErrors, []); assert.equal(blockedExternalRequests, 0); assert.equal(child.exitCode, null);
  assert.deepEqual(await hashes(), sourceSha256, 'SOURCE_CHANGED_DURING_MEASUREMENT');
  const { overall, scenarios } = createImportMeasurementReport(dataset.manifest, dataset.samples);
  if (profile === 'deadline-cutoff') { assert.equal(overall.coverage.observedLogicalRequests, 0); assert.equal(overall.coverage.missingLogicalRequests, 15); assert.equal(overall.commandRequests, 0); }
  const provenance = {
    measurementVersion: dataset.manifest.measurementVersion, startedAt, endedAt: new Date().toISOString(),
    baselineCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), sourceSha256,
    fixtureSha256: sourceSha256['apps/mobile/scripts/import-measurement-harness.tsx'], fixturePlan: dataset.fixturePlan,
    browser: await browser.version(), node: process.version, os: { platform: platform(), release: release(), availableCpuCount: availableParallelism(), cpuPinned: false },
    viewport: { width: 390, height: 844 }, network: 'in-process-api-fixture; external requests blocked', actualIndexedDb: true,
    serviceClockCalibration: 'not-applicable-fixture', routesModelsPrompts: null, routesModelsPromptsReason: 'no-real-provider-execution',
    externalProviderCalls: 0, blockedExternalRequests, usage: null, cost: null, productionPerformanceVerified: false, nativeDeviceVerified: false,
  };
  await writeFile(resolve(output, 'samples.json'), JSON.stringify(dataset, null, 2) + '\n');
  await writeFile(resolve(output, 'report.json'), JSON.stringify({ provenance, overall, scenarios }, null, 2) + '\n');
  console.log(JSON.stringify({ result: 'import-measurement-recorded', profile, output, logicalRequests: overall.coverage.observedLogicalRequests, firstFactMs: overall.metrics.firstFactMs, nativeOrProviderProof: false }));
} finally { await browser?.close(); child.kill('SIGTERM'); }
