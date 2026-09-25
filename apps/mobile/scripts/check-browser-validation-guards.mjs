import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyBrowserResults } from './check-browser-results.mjs';

const mobile = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const integrityOnly = process.argv.includes('--integrity-only');
const argument = (name) => { const index = process.argv.indexOf(name); return index < 0 ? undefined : process.argv[index + 1]; };
if (integrityOnly) assert.ok(argument('--artifacts') && argument('--revision'), 'Offline integrity validation requires a downloaded artifact directory and explicit CI revision');
const artifacts = integrityOnly ? resolve(argument('--artifacts')) : resolve(mobile, '.browser-results');
const revision = integrityOnly ? argument('--revision') : undefined;
const require = createRequire(import.meta.url), cli = resolve(dirname(require.resolve('playwright/package.json')), 'cli.js');
const read = (file) => JSON.parse(readFileSync(file, 'utf8'));
const results = [];
const allTests = (suites) => suites.flatMap((suite) => [...(suite.specs ?? []).flatMap((spec) => spec.tests), ...allTests(suite.suites ?? [])]);
const original = verifyBrowserResults({ artifacts, revision }); // CI requires a fresh current suite; offline audit binds an explicit downloaded revision.
const pointer = read(resolve(artifacts, 'suite-run.json'));
const fullDirectory = resolve(artifacts, 'runs', pointer.runId);

for (const [probe, target] of [['missing-engine', 'NOMAD_E2E_REQUIRED_MATRIX'], ['missing-scenario', 'NOMAD_E2E_REQUIRED_MATRIX'],
  ['skipped-case', 'NOMAD_E2E_CASE_FAILED'], ['missing-visual-attachment', 'NOMAD_E2E_VISUAL_ATTACHMENT']]) {
  const directory = resolve(artifacts, 'integrity-probes', `${probe}-${randomUUID()}`);
  const run = resolve(directory, 'runs', pointer.runId); mkdirSync(run, { recursive: true });
  copyFileSync(resolve(artifacts, 'suite-run.json'), resolve(directory, 'suite-run.json'));
  copyFileSync(resolve(artifacts, 'environment.json'), resolve(directory, 'environment.json'));
  copyFileSync(resolve(fullDirectory, 'source-manifest.json'), resolve(run, 'source-manifest.json'));
  const manifest = read(resolve(fullDirectory, 'source-manifest.json'));
  if (manifest.productDirectory) cpSync(resolve(artifacts, manifest.productDirectory), resolve(directory, manifest.productDirectory), { recursive: true });
  if (existsSync(resolve(fullDirectory, 'test-results'))) cpSync(resolve(fullDirectory, 'test-results'), resolve(run, 'test-results'), { recursive: true });
  const report = read(resolve(fullDirectory, 'report.json'));
  const change = (suites) => {
    for (const suite of suites) {
      for (const spec of suite.specs ?? []) {
        if (probe === 'missing-engine') spec.tests = spec.tests.filter((test) => test.projectName !== 'webkit');
        if (probe === 'missing-scenario' && spec.title.startsWith('B08 ')) spec.tests = spec.tests.filter((test) => test.projectName !== 'chromium');
        if (probe === 'skipped-case' && spec.title.startsWith('B08 ')) for (const test of spec.tests) if (test.projectName === 'chromium') {
          test.status = 'skipped'; test.results[0].status = 'skipped';
        }
        if (probe === 'missing-visual-attachment' && spec.title.startsWith('V03 ')) for (const test of spec.tests) if (test.projectName === 'chromium') {
          test.results[0].attachments = [];
        }
      }
      change(suite.suites ?? []);
    }
  };
  change(report.suites); writeFileSync(resolve(run, 'report.json'), JSON.stringify(report));
  const child = spawnSync(process.execPath, ['scripts/check-browser-results.mjs', '--artifacts', directory, ...(revision ? ['--revision', revision] : [])], { cwd: mobile, encoding: 'utf8', timeout: 30_000, maxBuffer: 2 * 1024 * 1024 });
  writeFileSync(resolve(directory, 'console.log'), child.stdout + child.stderr);
  assert.equal(child.error, undefined); assert.notEqual(child.status, 0); assert.ok((child.stdout + child.stderr).includes(target));
  results.push({ probe, category: 'fresh-report-integrity-negative', sourceRunId: pointer.runId, directory: directory.replace(mobile + '/', ''), exitCode: child.status, target });
}

if (integrityOnly) {
  writeFileSync(resolve(artifacts, 'integrity-counterexamples.json'), JSON.stringify({ kind: 'downloaded-report-integrity-counterexamples', original, results, productFlowsExecuted: false }, null, 2) + '\n');
  console.log(JSON.stringify({ result: 'downloaded-report-integrity-counterexamples-passed', sourceRevision: revision, probes: results.length, productFlowsExecuted: false }));
  process.exit(0);
}

for (const [probe, file, target] of [
  ['html-changed', resolve(mobile, 'index.html'), 'NOMAD_E2E_CHECKOUT_CHANGED'],
  ['public-asset-changed', resolve(mobile, 'public/webview-unavailable.html'), 'NOMAD_E2E_CHECKOUT_CHANGED'],
  ['workspace-dependency-changed', resolve(mobile, '../../packages/native-auth/src/index.ts'), 'NOMAD_E2E_CHECKOUT_CHANGED'],
  ['compiled-output-changed', resolve(mobile, 'dist/index.html'), 'Product output bytes do not match'],
  ['compiled-graph-changed', resolve(mobile, '.workbench-results/product-graph.json'), 'NOMAD_E2E_COMPILED_GRAPH_CHANGED'],
]) {
  const directory = resolve(artifacts, 'integrity-probes', `${probe}-${randomUUID()}`); mkdirSync(directory, { recursive: true });
  const bytes = readFileSync(file); let child;
  try {
    writeFileSync(file, Buffer.concat([bytes, Buffer.from('\n ')]));
    child = spawnSync(process.execPath, ['scripts/check-browser-results.mjs'], { cwd: mobile, encoding: 'utf8', timeout: 30_000, maxBuffer: 2 * 1024 * 1024 });
    writeFileSync(resolve(directory, 'console.log'), child.stdout + child.stderr);
  } finally { writeFileSync(file, bytes); }
  assert.equal(child.error, undefined); assert.notEqual(child.status, 0); assert.ok((child.stdout + child.stderr).includes(target));
  results.push({ probe, category: 'current-build-binding-negative', file: file.replace(mobile + '/', ''), exitCode: child.status, target });
}

const baseline = resolve(mobile, 'e2e/visual/baselines/chromium/V02-home.png');
const environmentPath = resolve(artifacts, 'environment.json'), environmentBytes = readFileSync(environmentPath);
for (const [probe, target] of [['visual-control-before', null], ['missing-baseline', 'NOMAD_E2E_MISSING_BASELINE'],
  ['wrong-environment', 'NOMAD_E2E_ENVIRONMENT_MISMATCH'], ['automatic-update', 'NOMAD_E2E_AUTO_UPDATE_FORBIDDEN'], ['visual-control-after', null]]) {
  const runId = `validation-${probe}-${randomUUID()}`, directory = resolve(artifacts, 'runs', runId);
  mkdirSync(directory, { recursive: true });
  const backup = resolve(directory, 'baseline-backup.png');
  let child;
  try {
    if (probe === 'missing-baseline') renameSync(baseline, backup);
    if (probe === 'wrong-environment') {
      const environment = JSON.parse(environmentBytes); environment.fingerprint = 'deliberate-mismatch';
      writeFileSync(environmentPath, JSON.stringify(environment));
    }
    child = spawnSync(process.execPath, [cli, 'test', '--config', 'playwright.config.ts', '--project', 'chromium', '--grep', 'V02',
      ...(probe === 'automatic-update' ? ['--update-snapshots', 'all'] : [])], {
      cwd: mobile, env: { ...process.env, NOMAD_BROWSER_RUN_ID: runId, NOMAD_BROWSER_RUN_KIND: 'counterexample', NOMAD_BROWSER_FAULT: '' },
      encoding: 'utf8', timeout: 60_000, maxBuffer: 3 * 1024 * 1024,
    });
    writeFileSync(resolve(directory, 'console.log'), child.stdout + child.stderr);
  } finally {
    if (existsSync(backup)) renameSync(backup, baseline);
    writeFileSync(environmentPath, environmentBytes);
  }
  assert.equal(child.error, undefined);
  const report = read(resolve(directory, 'report.json'));
  const text = child.stdout + child.stderr;
  if (target) { assert.notEqual(child.status, 0); assert.ok(text.includes(target), `Target guard did not fail: ${probe}`); }
  else { assert.equal(child.status, 0); assert.equal(report.stats.expected, 1); }
  if (probe === 'automatic-update') {
    // This is an explicit configuration rejection, never counted as a product defect assertion.
    assert.equal(report.stats.expected + report.stats.unexpected, 0);
    assert.ok(report.errors.some((error) => error.message.includes(target)));
  } else {
    assert.equal(report.errors.length, 0); assert.equal(report.stats.skipped, 0);
    assert.equal(report.stats.expected + report.stats.unexpected, 1);
    if (target) assert.ok(allTests(report.suites).flatMap((test) => test.results).flatMap((result) => result.attachments ?? [])
      .some((attachment) => attachment.name === 'trace' && existsSync(attachment.path)), 'Actual visual failure must retain its trace');
  }
  results.push({ probe, category: probe === 'automatic-update' ? 'configuration-rejected-before-execution' : 'actual-visual-test-validation',
    runId, exitCode: child.status, target, executed: report.stats.expected + report.stats.unexpected });
}
const repaired = verifyBrowserResults(); assert.equal(repaired.reportHash, original.reportHash, 'Counterexamples must preserve the full suite');
writeFileSync(resolve(artifacts, 'validation-counterexamples.json'), JSON.stringify({ kind: 'browser-validation-guard-counterexamples', original, repaired, results }, null, 2) + '\n');
console.log(JSON.stringify({ result: 'browser-validation-guard-counterexamples-passed', integrityNegatives: 4, buildBindingNegatives: 5, validationNegatives: 3, visualControls: 2 }));
