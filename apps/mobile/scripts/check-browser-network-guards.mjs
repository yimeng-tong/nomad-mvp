import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const mobile = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const cli = resolve(dirname(require.resolve('playwright/package.json')), 'cli.js');
const results = [];
for (const [probe, expected] of [
  ['', null], ['unknown', 'NOMAD_E2E_UNDECLARED_REQUEST'], ['static', 'NOMAD_E2E_UNDECLARED_REQUEST'],
  ['external', 'NOMAD_E2E_EXTERNAL_REQUEST'], ['retired', 'NOMAD_E2E_LATE_REQUEST'], ['websocket', 'NOMAD_E2E_WEBSOCKET_FORBIDDEN'], ['', null],
]) {
  const runId = `network-${probe || 'control'}-${randomUUID()}`;
  const directory = resolve(mobile, '.browser-results/runs', runId);
  mkdirSync(directory, { recursive: true });
  const result = spawnSync(process.execPath, [cli, 'test', '--config', 'playwright.config.ts', '--project', 'chromium', '--grep', 'B02'], {
    cwd: mobile, env: { ...process.env, NOMAD_BROWSER_RUN_ID: runId, NOMAD_BROWSER_RUN_KIND: 'counterexample', NOMAD_BROWSER_NET_PROBE: probe },
    timeout: 60_000, maxBuffer: 2 * 1024 * 1024, encoding: 'utf8',
  });
  writeFileSync(resolve(directory, 'console.log'), result.stdout + result.stderr);
  assert.equal(result.error, undefined, 'Counterexample process must run normally');
  const report = JSON.parse(readFileSync(resolve(directory, 'report.json'), 'utf8'));
  assert.equal(report.stats.skipped, 0);
  assert.equal(report.errors.length, 0, 'Startup/resource errors are not counterexample proof');
  assert.equal(report.stats.expected + report.stats.unexpected, 1, 'The selected actual test must execute');
  if (expected) {
    assert.notEqual(result.status, 0, 'A caught undeclared request must fail fixture teardown');
    assert.equal(report.stats.unexpected, 1);
    assert.ok((result.stdout + result.stderr).includes(expected), `Missing targeted failure: ${expected}`);
  } else {
    assert.equal(result.status, 0);
    assert.equal(report.stats.expected, 1);
  }
  results.push({ probe: probe || 'control', runId, exitCode: result.status, expectedFailure: expected });
}
writeFileSync(resolve(mobile, '.browser-results/network-counterexamples.json'), JSON.stringify({ kind: 'actual-browser-network-guard-counterexamples', results }, null, 2) + '\n');
console.log(JSON.stringify({ result: 'network-guard-counterexamples-passed', failures: 5, controls: 2 }));
