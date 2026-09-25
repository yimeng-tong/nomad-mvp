import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createAuthMeasurementReport, type AuthMeasurementManifest } from '../../packages/types/src/auth-measurements.js';

const root = resolve(import.meta.dirname, '../..');
const output = resolve(root, process.env.AUTH_MEASUREMENT_GUARD_OUTPUT ?? '.measurement-results/auth/guards');
await mkdir(dirname(output), { recursive: true }); await mkdir(output, { recursive: false });
const results: Array<Record<string, unknown>> = [];
async function run(name: string, env: Record<string, string>, timeout = 30000) {
  const directory = resolve(output, name), started = performance.now();
  const child = spawn(process.execPath, ['--import', 'tsx', 'scripts/measurements/run-auth.mts', 'matrix'], {
    cwd: root, env: { ...process.env, AUTH_MEASUREMENT_OUTPUT: directory, AUTH_MEASUREMENT_TEST_FAULT: '', AUTH_MEASUREMENT_PORT: '5194', ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '', timedOut = false;
  child.stdout.on('data', (data: Buffer) => { log += data.toString(); }); child.stderr.on('data', (data: Buffer) => { log += data.toString(); });
  const timer = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); }, timeout);
  const completion = await new Promise<{ code: number | null; signal: string | null }>((resolve, reject) => {
    child.once('error', reject); child.once('close', (code, signal) => resolve({ code, signal }));
  }).finally(() => clearTimeout(timer));
  await writeFile(resolve(output, `${name}.log`), log);
  assert.equal(timedOut, false, 'The runner must fail within its own bound'); assert.equal(completion.signal, null); assert.equal(completion.code, 1);
  const status = JSON.parse(await readFile(resolve(directory, 'run-status.json'), 'utf8')) as { status: string; captureAvailable: boolean; failure: { code: string; scenario?: string } };
  assert.equal(status.status, 'failed');
  return { directory, elapsedMs: performance.now() - started, status, exitCode: completion.code };
}
let requests = 0;
const server = createServer((_request, response) => { requests++; response.writeHead(200, { 'Content-Type': 'text/plain' }); response.write('partial-body'); });
await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
try {
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const result = await run('owned-port-stalled-body', { AUTH_MEASUREMENT_PORT: String(address.port) }, 15000);
  assert.ok(requests > 0); assert.equal(result.status.captureAvailable, false); assert.equal(result.status.failure.code, 'AUTH_MEASUREMENT_SETUP_FAILED');
  results.push({ fault: 'owned-port-stalled-body', exitCode: result.exitCode, bodyStarted: true, elapsedMs: result.elapsedMs, result: 'rejected-within-bound' });
} finally { server.closeAllConnections(); await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }

for (const fault of ['between-cases', 'hidden-home', 'integrity-failure', 'source-read-failure']) {
  const result = await run(fault, { AUTH_MEASUREMENT_TEST_FAULT: fault });
  assert.equal(result.status.captureAvailable, true);
  const dataset = JSON.parse(await readFile(resolve(result.directory, 'samples.json'), 'utf8')) as { manifest: AuthMeasurementManifest; samples: unknown[] };
  const saved = JSON.parse(await readFile(resolve(result.directory, 'report.json'), 'utf8')) as { overall: unknown; scenarios: unknown; provenance: { runStatus: string; actualHttpWriteAttempts: number; sourceReadable: boolean; sourceUnchanged: boolean | null } };
  const computed = createAuthMeasurementReport(dataset.manifest, dataset.samples);
  assert.deepEqual({ overall: saved.overall, scenarios: saved.scenarios }, computed); assert.equal(saved.provenance.runStatus, 'failed');
  if (fault === 'between-cases') {
    assert.equal(computed.overall.coverage.observedLogicalRequests, 1); assert.equal(computed.overall.outcomes.success, 1);
    assert.equal(computed.overall.coverage.missingLogicalRequests, 11); assert.equal(saved.provenance.actualHttpWriteAttempts, 2);
  } else if (fault === 'hidden-home') {
    assert.equal(result.status.failure.scenario, 'login'); assert.equal(computed.overall.metrics.successElapsedMs.n, 0);
    assert.equal(computed.overall.outcomes.unfinished, 1); assert.equal(computed.overall.phases['protected-home'].successMs.n, 0);
  } else { assert.equal(computed.overall.coverage.observedLogicalRequests, 12); assert.equal(computed.overall.coverage.missingLogicalRequests, 0); }
  if (fault === 'source-read-failure') { assert.equal(saved.provenance.sourceReadable, false); assert.equal(saved.provenance.sourceUnchanged, null); }
  results.push({ fault, exitCode: result.exitCode, retainedSamples: dataset.samples.length, missing: computed.overall.coverage.missingLogicalRequests,
    result: 'failed-run-retained-and-recomputed', elapsedMs: result.elapsedMs });
}
const sourceSha256 = Object.fromEntries(await Promise.all(['scripts/measurements/check-auth-guards.mts', 'scripts/measurements/run-auth.mts',
  'apps/mobile/scripts/auth-measurement-harness.tsx', 'packages/types/src/auth-measurements.ts', 'packages/types/src/measurement-common.ts']
  .map(async (file) => [file, createHash('sha256').update(await readFile(resolve(root, file))).digest('hex')] as const)));
await writeFile(resolve(output, 'verification.json'), JSON.stringify({ kind: 'actual-auth-measurement-counterexamples', sourceSha256, results }, null, 2) + '\n');
console.log(JSON.stringify({ result: 'auth-measurement-guards-passed', counterexamples: results.length, output }));
