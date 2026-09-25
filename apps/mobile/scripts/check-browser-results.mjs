import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkIsolation, inventory } from './check-workbench-isolation.mjs';

const mobile = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(mobile, '../..');
const json = (path) => JSON.parse(readFileSync(path, 'utf8'));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const git = (args) => execFileSync('git', args, { cwd: root, maxBuffer: 8 * 1024 * 1024 });

function cases(suites) {
  return suites.flatMap((suite) => [...(suite.specs ?? []).flatMap((spec) => spec.tests.map((test) => ({ spec, test }))), ...cases(suite.suites ?? [])]);
}

/** Default verifies the current checkout; explicit downloaded runs must name their known CI SHA. */
export function verifyBrowserResults({ artifacts = resolve(mobile, '.browser-results'), candidate = false,
  revision, pointerFile = candidate ? 'latest-run.json' : 'suite-run.json' } = {}) {
  const checkCurrentCheckout = revision === undefined;
  revision ??= git(['rev-parse', 'HEAD']).toString().trim();
  assert.match(revision, /^[a-f0-9]{40}$/, 'Explicit full Git revision required');
  const committedJson = (file) => JSON.parse(git(['show', `${revision}:apps/mobile/e2e/${file}`]).toString());
  const contract = checkCurrentCheckout ? json(resolve(mobile, 'e2e/run-contract.json')) : committedJson('run-contract.json');
  if (checkCurrentCheckout) assert.equal(contract.version, 2, 'NOMAD_E2E_CURRENT_CONTRACT_VERSION');
  const policy = checkCurrentCheckout ? json(resolve(mobile, 'e2e/visual/policy.json')) : committedJson('visual/policy.json');
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
  if (checkCurrentCheckout && process.env.GITHUB_RUN_ID) {
    assert.equal(environment.githubRunId, process.env.GITHUB_RUN_ID, 'NOMAD_E2E_STALE_CI_ENVIRONMENT');
    assert.equal(manifest.githubRunId, process.env.GITHUB_RUN_ID, 'NOMAD_E2E_STALE_CI_MANIFEST');
  }
  assert.equal(report.config.metadata.runId, pointer.runId, 'NOMAD_E2E_RUN_ID');
  assert.equal(report.config.metadata.runKind, candidate ? 'candidate' : 'suite', 'NOMAD_E2E_RUN_KIND');
  assert.equal(manifest.runKind, report.config.metadata.runKind);
  assert.equal(manifest.snapshotUpdates, 'none', 'NOMAD_E2E_AUTO_UPDATE_FORBIDDEN');
  const inputs = git(['ls-tree', '-r', '--name-only', revision, '--', ...contract.sourceInputs]).toString().trim().split('\n').filter(Boolean).sort();
  assert.deepEqual(Object.keys(manifest.sourceHashes).sort(), inputs, 'NOMAD_E2E_SOURCE_INVENTORY');
  for (const file of inputs) assert.equal(manifest.sourceHashes[file], hash(git(['show', `${revision}:${file}`])), `NOMAD_E2E_SOURCE_HASH ${file}`);
  if (checkCurrentCheckout) {
    const live = git(['ls-files', '--cached', '--others', '--exclude-standard', '--', ...contract.sourceInputs]).toString().trim().split('\n').filter(Boolean).sort();
    assert.deepEqual(live, inputs, 'NOMAD_E2E_CHECKOUT_INVENTORY_CHANGED');
    for (const file of inputs) assert.equal(hash(readFileSync(resolve(root, file))), manifest.sourceHashes[file], `NOMAD_E2E_CHECKOUT_CHANGED ${file}`);
  }
  if (contract.version >= 2) {
    assert.equal(manifest.productDirectory, `products/${manifest.productGraphHash}`, 'NOMAD_E2E_PRODUCT_PATH');
    assert.match(manifest.productGraphHash, /^[a-f0-9]{64}$/);
    const product = resolve(artifacts, manifest.productDirectory), graphBytes = readFileSync(resolve(product, 'product-graph.json'));
    assert.equal(hash(graphBytes), manifest.productGraphHash, 'NOMAD_E2E_COMPILED_GRAPH_HASH');
    const graph = JSON.parse(graphBytes);
    assert.deepEqual(inventory(resolve(product, 'dist')), graph.outputs, 'NOMAD_E2E_ARCHIVED_PRODUCT_BYTES');
    for (const module of graph.modules) {
      if (!module.sha256 || module.id.includes('node_modules/')) continue;
      const file = relative(root, resolve(mobile, module.id.split('?')[0])).replaceAll('\\', '/');
      assert.equal(manifest.sourceHashes[file], module.sha256, `NOMAD_E2E_UNBOUND_PRODUCT_SOURCE ${file}`);
    }
    if (checkCurrentCheckout) {
      assert.equal(hash(readFileSync(resolve(mobile, '.workbench-results/product-graph.json'))), manifest.productGraphHash, 'NOMAD_E2E_COMPILED_GRAPH_CHANGED');
      const isolation = checkIsolation({ native: false });
      assert.deepEqual(isolation.web, graph.outputs, 'NOMAD_E2E_CURRENT_PRODUCT_BYTES');
    }
  }
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
  const visualArtifacts = [];
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
  } else {
    for (const { spec, test } of all.filter(({ spec }) => /^V\d\d /.test(spec.title))) {
      const images = (test.results[0].attachments ?? []).filter((attachment) => attachment.name === 'visual-actual');
      assert.equal(images.length, 1, `NOMAD_E2E_VISUAL_ATTACHMENT ${test.projectName}:${spec.title}`);
      const image = images[0]; let bytes, artifact;
      if (image.path) {
        const normalized = image.path.replaceAll('\\', '/'), marker = '/.browser-results/';
        assert.ok(normalized.includes(marker), 'NOMAD_E2E_VISUAL_ARTIFACT_PATH');
        artifact = normalized.slice(normalized.indexOf(marker) + marker.length);
        const path = resolve(artifacts, artifact);
        assert.ok(path.startsWith(resolve(artifacts, 'runs', pointer.runId) + sep), 'NOMAD_E2E_VISUAL_ARTIFACT_PATH');
        bytes = readFileSync(path);
      } else {
        assert.ok(!contract.version && typeof image.body === 'string', 'NOMAD_E2E_VISUAL_FILE_REQUIRED');
        bytes = Buffer.from(image.body, 'base64'); artifact = 'legacy-inline-report';
      }
      assert.ok(bytes.length > 45 && bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
        && bytes.subarray(-12).equals(Buffer.from('0000000049454e44ae426082', 'hex')), 'NOMAD_E2E_VISUAL_PNG');
      assert.ok(bytes.readUInt32BE(16) > 0 && bytes.readUInt32BE(20) > 0, 'NOMAD_E2E_VISUAL_DIMENSIONS');
      const id = spec.title.slice(0, 3), scene = policy.scenes.find((name) => name.startsWith(id + '-'));
      assert.ok(scene); visualFiles[`${test.projectName}/${scene}.png`] = hash(bytes);
      visualArtifacts.push({ engine: test.projectName, scene, artifact, bytes: bytes.length, sha256: hash(bytes) });
    }
  }
  return { kind: candidate ? 'unapproved-canonical-candidates-verified' : 'complete-canonical-browser-suite', sourceRevision: revision,
    runId: pointer.runId, requiredCases: expected.length, skipped: 0, environmentFingerprint: environment.fingerprint,
    reportHash: hash(readFileSync(resolve(directory, 'report.json'))), sourceManifestHash: hash(readFileSync(resolve(directory, 'source-manifest.json'))),
    contractVersion: contract.version ?? 1, compiledProductVerified: contract.version >= 2, visualFiles, visualArtifacts, nativeDeviceAcceptance: false };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const candidate = process.argv.includes('--candidate');
  const value = (name) => { const index = process.argv.indexOf(name); return index < 0 ? undefined : process.argv[index + 1]; };
  const artifacts = value('--artifacts') ?? resolve(mobile, '.browser-results');
  const result = verifyBrowserResults({ artifacts, candidate, revision: value('--revision') });
  writeFileSync(resolve(artifacts, candidate ? 'candidate-verification.json' : 'suite-verification.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
}
