import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createAuthMeasurementReport, validateAuthMeasurementManifest, type AuthMeasurementManifest, type AuthMeasurementSample } from '../../packages/types/src/auth-measurements.js';

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const manifest = (count = 1): AuthMeasurementManifest => ({ measurementVersion: 'nomad.auth.v1', workload: 'WL-AUTH', mode: 'fixture', clockId: id(999),
  scenarioPlan: [{ scenario: 'login', count }], plannedLogicalRequests: count, windowStartMs: 0, windowEndMs: 1000, deadlineMs: 1000,
  fixtureVersion: 'auth-ui-v1', sampling: 1, concurrency: 1, retryPolicy: 'explicit-only', cacheMode: 'one-browser-app-remount' });
const sample = (n = 1, elapsed = 20): AuthMeasurementSample => ({ logicalId: id(n), clockId: id(999), scenario: 'login', outcome: 'success', startedMs: 10, observedUntilMs: 10 + elapsed,
  apiRequests: 2, recoveredOriginalOperation: null, phases: [
    { phase: 'proof-verify', attempt: 1, startedMs: 10, endedMs: 15, outcome: 'success' },
    { phase: 'identity-read', attempt: 1, startedMs: 15, endedMs: 20, outcome: 'success' },
    { phase: 'protected-home', attempt: 1, startedMs: 10, endedMs: 10 + elapsed, outcome: 'success' },
  ] });

await test('uses nearest-rank per scenario and phase, preserves sample N and null empty pools', () => {
  const report = createAuthMeasurementReport(manifest(3), [sample(1, 20), sample(2, 30), sample(3, 100)]);
  assert.deepEqual(report.overall.metrics.successElapsedMs, { n: 3, p50: 30, p95: 100 });
  assert.deepEqual(report.overall.phases['proof-verify'].responseMs, { n: 3, p50: 5, p95: 5 });
  assert.deepEqual(report.overall.phases['otp-send'].responseMs, { n: 0, p50: null, p95: null });
  assert.equal(report.overall.cost.amount, null);
  assert.equal(report.overall.apiRequests, 6);
});

await test('failure, unknown, unfinished and missing cases remain in their denominators', () => {
  const m = manifest(4);
  const rejected = { ...sample(1), outcome: 'rejected', phases: [{ phase: 'proof-verify', attempt: 1, startedMs: 10, endedMs: 20, outcome: 'rejected' }] };
  const unknown = { ...sample(2), outcome: 'unknown', phases: [{ phase: 'otp-send', attempt: 1, startedMs: 10, endedMs: 20, outcome: 'unknown' }] };
  const pending = { ...sample(3), outcome: 'unfinished', phases: [{ phase: 'proof-verify', attempt: 1, startedMs: 10, endedMs: null, outcome: 'unfinished' }] };
  const r = createAuthMeasurementReport(m, [rejected, unknown, pending]).overall;
  assert.equal(r.coverage.plannedLogicalRequests, 4); assert.equal(r.coverage.missingLogicalRequests, 1);
  assert.deepEqual(r.outcomes, { success: 0, rejected: 1, unknown: 1, unavailable: 0, unfinished: 1 });
  assert.equal(r.metrics.successElapsedMs.n, 0); assert.equal(r.unfinished.length, 2);
  assert.equal(r.phases['proof-verify'].unfinished, 1);
});

await test('canonical duplicates collapse; conflicting variants are excluded in every scenario', () => {
  const m = manifest(2); m.scenarioPlan = [{ scenario: 'login', count: 1 }, { scenario: 'restore', count: 1 }];
  const a = sample(); const b = { ...a, scenario: 'restore' };
  const r = createAuthMeasurementReport(m, [a, a, b, sample(2)]);
  assert.equal(r.overall.coverage.duplicateSamples, 1); assert.equal(r.overall.coverage.conflictingSamples, 1);
  assert.equal(r.overall.metrics.successElapsedMs.n, 1);
  assert.equal(r.scenarios[1].report.metrics.successElapsedMs.n, 0);
  assert.equal(r.scenarios[1].report.coverage.conflictingSamples, 1);
});

await test('unplanned variants still taint the matching planned logical case', () => {
  const a = sample(); const r = createAuthMeasurementReport(manifest(), [a, { ...a, scenario: 'restore' }]);
  assert.equal(r.overall.coverage.unplannedScenario, 1); assert.equal(r.overall.metrics.successElapsedMs.n, 0);
  assert.equal(r.scenarios[0].report.metrics.successElapsedMs.n, 0);
});

await test('wrong clocks, outside-window and backwards phases never enter latency pools', () => {
  const wrong = { ...sample(1), clockId: id(44) };
  const outside = { ...sample(2), observedUntilMs: 1001 };
  const inverse = sample(3); inverse.phases[0].endedMs = 5;
  const late = sample(4); late.phases[0].endedMs = 31;
  const r = createAuthMeasurementReport(manifest(4), [wrong, outside, inverse, late]).overall;
  assert.equal(r.coverage.invalidClock, 1); assert.equal(r.coverage.outsideWindow, 1); assert.equal(r.coverage.invalidTiming, 2);
  assert.equal(r.metrics.successElapsedMs.n, 0); assert.equal(r.phases['proof-verify'].responseMs.n, 0);
});

await test('untrusted objects and private extra fields are rejected without echo or invoking getters', () => {
  let invoked = false;
  const getter = { ...sample() }; Object.defineProperty(getter, 'logicalId', { enumerable: true, get() { invoked = true; return id(1); } });
  const secret = 'PRIVATE_SENTINEL_phone_cookie_url';
  const r = createAuthMeasurementReport(manifest(3), [getter, { ...sample(2), phone: secret }, { ...sample(3), phases: [{ ...sample().phases[0], rawError: secret }] }]);
  assert.equal(invoked, false); assert.equal(r.overall.coverage.invalidSamples, 3); assert.ok(!JSON.stringify(r).includes(secret));
});

await test('missing or repeated attempts, terminal shape and request counter inconsistency are invalid', () => {
  const repeated = sample(1); repeated.phases.push({ ...repeated.phases[0] });
  const gapped = sample(2); gapped.phases[0].attempt = 2;
  const hidden = sample(3); hidden.apiRequests = 0;
  const unfinished = sample(4); unfinished.phases[0].endedMs = null;
  const r = createAuthMeasurementReport(manifest(4), [repeated, gapped, hidden, unfinished]).overall;
  assert.equal(r.coverage.invalidSamples, 4); assert.equal(r.coverage.missingLogicalRequests, 4);
});

await test('explicit logout retry retains its logical denominator and actual HTTP attempts', () => {
  const m = manifest(); m.scenarioPlan = [{ scenario: 'logout-recovery', count: 1 }];
  const a: AuthMeasurementSample = { ...sample(), scenario: 'logout-recovery', recoveredOriginalOperation: true,
    phases: [{ phase: 'logout', attempt: 1, startedMs: 10, endedMs: 15, outcome: 'unknown' },
      { phase: 'logout', attempt: 2, startedMs: 20, endedMs: 25, outcome: 'success' },
      { phase: 'logout-recovery', attempt: 1, startedMs: 15, endedMs: 30, outcome: 'success' }] };
  const r = createAuthMeasurementReport(m, [a]).overall;
  assert.equal(r.coverage.observedLogicalRequests, 1); assert.equal(r.phases.logout.attempts, 2);
  assert.equal(r.phases.logout.retryAttempts, 1); assert.equal(r.originalLogoutRecoveries, 1);
});

await test('manifest constrains full sampling, planned totals and bounded observation windows', () => {
  for (const patch of [{ sampling: 0 }, { sampling: 1.1 }, { plannedLogicalRequests: 4 }, { windowEndMs: 1001 }, { clockId: 'not-a-clock' }, { concurrency: 2 }, { arbitrary: 'private' }]) {
    assert.throws(() => validateAuthMeasurementManifest({ ...manifest(), ...patch }), /AUTH_MEASUREMENT_MANIFEST_INVALID/);
  }
  const m = manifest(0); m.scenarioPlan = []; validateAuthMeasurementManifest(m);
  assert.equal(createAuthMeasurementReport(m, []).overall.metrics.successElapsedMs.p95, null);
});

await test('extra cases in one scenario cannot hide missing cases in another', () => {
  const m = manifest(2); m.scenarioPlan = [{ scenario: 'login', count: 1 }, { scenario: 'restore', count: 1 }];
  const r = createAuthMeasurementReport(m, [sample(1), sample(2)]).overall;
  assert.equal(r.coverage.observedLogicalRequests, 2); assert.equal(r.coverage.missingLogicalRequests, 1); assert.equal(r.coverage.extraLogicalRequests, 1);
});

await test('missing phase events remain explicit and do not become zero latency', () => {
  const r = createAuthMeasurementReport(manifest(), [{ ...sample(), phases: [] }]).overall;
  assert.equal(r.phases['proof-verify'].plannedCases, 1); assert.equal(r.phases['proof-verify'].observedCases, 0);
  assert.equal(r.phases['proof-verify'].notObservedCases, 1); assert.equal(r.phases['proof-verify'].responseMs.p95, null);
});

await test('CLI recomputes the public report and refuses to overwrite evidence or echo invalid input', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'nomad-auth-report-test-')), input = join(dir, 'input.json'), output = join(dir, 'output.json');
  const data = { manifest: manifest(), samples: [sample()], provenance: { private: 'PRIVATE_SENTINEL' } };
  await writeFile(input, JSON.stringify(data));
  const run = () => spawnSync(process.execPath, ['--import', 'tsx', 'scripts/measurements/auth-report.mts', input, output], { encoding: 'utf8' });
  assert.equal(run().status, 0);
  assert.deepEqual(JSON.parse(await readFile(output, 'utf8')) as unknown, createAuthMeasurementReport(data.manifest, data.samples));
  const original = await readFile(output, 'utf8'); assert.equal(run().status, 1); assert.equal(await readFile(output, 'utf8'), original);
  await writeFile(input, 'PRIVATE_SENTINEL'); const result = run();
  assert.equal(result.status, 1); assert.equal(result.stderr, 'AUTH_MEASUREMENT_REPORT_INPUT_INVALID\n'); assert.equal(result.stdout, '');
});

await test('exact fractional deadline endpoints are valid without widening the deadline', () => {
  const m = { ...manifest(), windowStartMs: 1000.4, windowEndMs: 1000.4 + 250, deadlineMs: 250 };
  validateAuthMeasurementManifest(m);
  assert.throws(() => validateAuthMeasurementManifest({ ...m, windowEndMs: m.windowEndMs + 0.000001 }), /MANIFEST_INVALID/);
  assert.throws(() => validateAuthMeasurementManifest({ ...m, clockId: '00000000-0000-7000-8000-000000000999' }), /MANIFEST_INVALID/);
});

await test('conflict coverage and duplicate counts do not depend on variant order', () => {
  const m = manifest(2); m.scenarioPlan = [{ scenario: 'login', count: 1 }, { scenario: 'restore', count: 1 }];
  const a = sample(), b = { ...a, scenario: 'restore' }, c = sample(2);
  const first = createAuthMeasurementReport(m, [a, a, b, c]), second = createAuthMeasurementReport(m, [b, a, c, a]);
  assert.deepEqual(first, second);
  assert.equal(first.overall.coverage.observedLogicalRequests, 1);
  assert.equal(first.overall.coverage.conflictingSamples, 1);
  assert.equal(first.overall.coverage.missingLogicalRequests, 1); assert.equal(first.overall.coverage.extraLogicalRequests, 0);
});

await test('unexpected phase observations cannot cover another scenario missing that phase', () => {
  const m = manifest(2); m.scenarioPlan = [{ scenario: 'login', count: 1 }, { scenario: 'restore', count: 1 }];
  const r = createAuthMeasurementReport(m, [{ ...sample(), phases: [] }, { ...sample(2), scenario: 'restore' }]).overall;
  assert.equal(r.phases['proof-verify'].notObservedCases, 1);
  assert.equal(r.phases['proof-verify'].unexpectedCases, 1);
});
