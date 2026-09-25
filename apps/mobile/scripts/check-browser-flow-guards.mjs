import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const mobile = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url), cli = resolve(dirname(require.resolve('playwright/package.json')), 'cli.js');
const cases = (suites) => suites.flatMap((suite) => [...(suite.specs ?? []).flatMap((spec) => spec.tests), ...cases(suite.suites ?? [])]);
const results = [];
const flowsOnly = process.argv.includes('--flows-only');
const matrix = [
  ['', 'B11|B13|B15', null], ['private-portal', 'B13', 'NOMAD_E2E_PRIVATE_VISIBLE'],
  ['late-result', 'B15', 'NOMAD_E2E_PRIVATE_VISIBLE'], ['duplicate-start', 'B11', 'NOMAD_E2E_DUPLICATE_START'],
  ...(!flowsOnly ? [['', 'V02', null], ['cta-shift', 'V02', 'toHaveScreenshot'], ['', 'V02', null]] : []),
  ['', 'B11|B13|B15', null],
];
for (const [fault, pattern, target] of matrix) {
  const runId = `flow-${fault || 'control'}-${randomUUID()}`, directory = resolve(mobile, '.browser-results/runs', runId);
  mkdirSync(directory, { recursive: true });
  const child = spawnSync(process.execPath, [cli, 'test', '--config', 'playwright.config.ts', '--project', 'chromium', '--grep', pattern], {
    cwd: mobile, env: { ...process.env, NOMAD_BROWSER_RUN_ID: runId, NOMAD_BROWSER_RUN_KIND: 'counterexample', NOMAD_BROWSER_FAULT: fault },
    timeout: 60_000, maxBuffer: 3 * 1024 * 1024, encoding: 'utf8',
  });
  const output = child.stdout + child.stderr; writeFileSync(resolve(directory, 'console.log'), output);
  assert.equal(child.error, undefined, 'Counterexample must finish normally');
  const report = JSON.parse(readFileSync(resolve(directory, 'report.json'), 'utf8'));
  assert.deepEqual(report.errors, [], 'Startup failures are not product counterexamples');
  assert.equal(report.stats.skipped, 0); assert.equal(report.stats.flaky, 0);
  const tests = cases(report.suites); assert.equal(tests.length, pattern.split('|').length, 'All selected cases must execute');
  const attachments = tests.flatMap((test) => test.results.flatMap((result) => result.attachments ?? []));
  if (target) {
    assert.notEqual(child.status, 0); assert.equal(report.stats.unexpected, 1);
    assert.ok(output.includes(target), `Missing targeted failure ${target}`);
    assert.ok(attachments.some((item) => item.name === 'trace' && existsSync(item.path)), 'First failure trace required');
    if (fault === 'cta-shift') for (const suffix of ['-actual.png', '-expected.png', '-diff.png']) {
      assert.ok(attachments.some((item) => item.path?.endsWith(suffix) && existsSync(item.path)), `Missing visual artifact ${suffix}`);
    }
  } else { assert.equal(child.status, 0); assert.equal(report.stats.expected, tests.length); }
  results.push({ fault: fault || 'control', pattern, runId, exitCode: child.status, target,
    executed: report.stats.expected + report.stats.unexpected, attachments: attachments.map((item) => ({ name: item.name, path: item.path?.replace(mobile + '/', '') })) });
  console.log(JSON.stringify(results.at(-1)));
}
writeFileSync(resolve(mobile, flowsOnly ? '.browser-results/flow-counterexamples-local.json' : '.browser-results/flow-counterexamples.json'),
  JSON.stringify({ kind: 'actual-product-browser-counterexamples', flowsOnly, injection: 'isolated browser init script; no product writes', results }, null, 2) + '\n');
