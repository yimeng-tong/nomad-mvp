import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const mobile = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(mobile, '../..');
const json = (path) => JSON.parse(readFileSync(path, 'utf8'));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const git = (args) => execFileSync('git', args, { cwd: root, maxBuffer: 8 * 1024 * 1024 });
const contract = json(resolve(mobile, 'e2e/run-contract.json'));
const policy = json(resolve(mobile, 'e2e/visual/policy.json'));

function cases(suites) {
  return suites.flatMap((suite) => [...(suite.specs ?? []).flatMap((spec) => spec.tests.map((test) => ({ spec, test }))), ...cases(suite.suites ?? [])]);
}

/** Default verifies the current checkout; explicit downloaded runs must name their known CI SHA. */
export function verifyBrowserResults({ artifacts = resolve(mobile, '.browser-results'), candidate = false,
  revision = git(['rev-parse', 'HEAD']).toString().trim(), pointerFile = candidate ? 'latest-run.json' : 'suite-run.json' } = {}) {
  const pointer = json(resolve(artifacts, pointerFile));
  assert.match(pointer.runId, /^[a-zA-Z0-9_-]{1,80}$/);
  const directory = resolve(artifacts, 'runs', pointer.runId);
  const report = json(resolve(directory, 'report.json'));
  const manifest = json(resolve(directory, 'source-manifest.json'));
  const environment = json(resolve(artifacts, 'environment.json'));
  assert.equal(manifest.sourceRevision, revision, 'NOMAD_E2E_SOURCE_REVISION');
  assert.equal(environment.sourceRevision, revision, 'NOMAD_E2E_ENVIRONMENT_STALE');
  assert.equal(environment.fingerprint, policy.environmentFingerprint, 'NOMAD_E2E_ENVIRONMENT_MISMATCH');
  assert.equal(hash(JSON.stringify(environment.environment)), environment.fingerprint, 'NOMAD_E2E_ENVIRONMENT_HASH');
  assert.equal(report.config.metadata.runId, pointer.runId, 'NOMAD_E2E_RUN_ID');
  assert.equal(report.config.metadata.runKind, candidate ? 'candidate' : 'suite', 'NOMAD_E2E_RUN_KIND');
  assert.equal(manifest.runKind, report.config.metadata.runKind);
  assert.equal(manifest.snapshotUpdates, 'none', 'NOMAD_E2E_AUTO_UPDATE_FORBIDDEN');
  const inputs = git(['ls-tree', '-r', '--name-only', revision, '--', ...contract.sourceInputs]).toString().trim().split('\n').filter(Boolean).sort();
  assert.deepEqual(Object.keys(manifest.sourceHashes).sort(), inputs, 'NOMAD_E2E_SOURCE_INVENTORY');
  for (const file of inputs) assert.equal(manifest.sourceHashes[file], hash(git(['show', `${revision}:${file}`])), `NOMAD_E2E_SOURCE_HASH ${file}`);
  const expectedIds = candidate ? contract.visualIds : [...contract.flowIds, ...contract.visualIds];
  const expected = contract.engines.flatMap((engine) => expectedIds.map((id) => `${engine}:${id}`)).sort();
  const all = cases(report.suites);
  const actual = all.map(({ spec, test }) => `${test.projectName}:${/^([BV]\d\d)\s/.exec(spec.title)?.[1] ?? 'UNREGISTERED'}`).sort();
  assert.deepEqual(actual, expected, 'NOMAD_E2E_REQUIRED_MATRIX');
  assert.deepEqual(report.errors, [], 'NOMAD_E2E_RUN_ERRORS');
  for (const { spec, test } of all) {
    assert.equal(test.status, 'expected', `NOMAD_E2E_CASE_FAILED ${spec.title}`);
    assert.equal(test.results.length, 1, 'NOMAD_E2E_RETRIES_FORBIDDEN');
    assert.equal(test.results[0].status, 'passed', 'NOMAD_E2E_CASE_NOT_PASSED');
    assert.equal(test.results[0].retry, 0);
  }
  assert.equal(report.stats.expected, expected.length);
  for (const key of ['unexpected', 'skipped', 'flaky']) assert.equal(report.stats[key], 0, `NOMAD_E2E_${key.toUpperCase()}`);
  const visualFiles = {};
  if (candidate) {
    for (const engine of contract.engines) for (const scene of policy.scenes) {
      const file = `${engine}/${scene}.png`, path = resolve(artifacts, 'visual-candidate', file), record = json(path + '.json');
      assert.equal(record.kind, 'unapproved-visual-candidate');
      assert.equal(record.file, file); assert.equal(record.sourceRevision, revision);
      assert.equal(record.environmentFingerprint, environment.fingerprint);
      assert.equal(record.policyHash, hash(JSON.stringify(policy)));
      assert.equal(record.sha256, hash(readFileSync(path)), 'NOMAD_E2E_CANDIDATE_HASH');
      visualFiles[file] = record.sha256;
    }
  }
  return { kind: candidate ? 'unapproved-canonical-candidates-verified' : 'complete-canonical-browser-suite', sourceRevision: revision,
    runId: pointer.runId, requiredCases: expected.length, skipped: 0, environmentFingerprint: environment.fingerprint,
    reportHash: hash(readFileSync(resolve(directory, 'report.json'))), sourceManifestHash: hash(readFileSync(resolve(directory, 'source-manifest.json'))),
    visualFiles, nativeDeviceAcceptance: false };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const candidate = process.argv.includes('--candidate');
  const value = (name) => { const index = process.argv.indexOf(name); return index < 0 ? undefined : process.argv[index + 1]; };
  const artifacts = value('--artifacts') ?? resolve(mobile, '.browser-results');
  const result = verifyBrowserResults({ artifacts, candidate, revision: value('--revision') });
  writeFileSync(resolve(artifacts, candidate ? 'candidate-verification.json' : 'suite-verification.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
}
