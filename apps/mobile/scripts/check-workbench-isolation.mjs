import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const mobileRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const forbidden = /(?:^|\/)(?:workbench|e2e|\.browser-results|\.storybook|storybook[^/]*|@storybook[^/]*|msw(?:@[^/]*)?|msw-storybook-addon[^/]*|@vitest[^/]*|vitest[^/]*|@playwright[^/]*|playwright(?:-core)?(?:@[^/]*)?)(?:\/|$)|mockServiceWorker|\.stories\.|nomad-e2e-|(?:^|\/)scripts\/(?:browser-environment|serve-browser-product|browser-mutations|check-browser-[^/]+)\./i;
export function inventory(directory, prefix = '') {
  return Object.fromEntries(readdirSync(join(directory, prefix), { withFileTypes: true }).flatMap((entry) => {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    assert.ok(!entry.isSymbolicLink(), `Product asset cannot be a symlink: ${name}`);
    return entry.isDirectory() ? Object.entries(inventory(directory, name)) : [[name, hash(readFileSync(join(directory, name)))]];
  }).sort(([a], [b]) => a.localeCompare(b)));
}

export function checkIsolation({ mobile = mobileRoot, native = true } = {}) {
  const graph = JSON.parse(readFileSync(resolve(mobile, '.workbench-results/product-graph.json'), 'utf8'));
  assert.equal(graph.kind, 'actual-product-module-graph');
  assert.equal(graph.entry, 'src/main.tsx');
  assert.equal(graph.entrySha256, hash(readFileSync(resolve(mobile, graph.entry))), 'Product entry changed since build');
  assert.ok(graph.modules.length > 0, 'Empty module graph is not proof');
  for (const name of ['src/main.tsx', 'src/platform/HostBootstrap.tsx', 'src/auth/transport.ts']) {
    assert.ok(graph.modules.some((item) => item.id === name), `Production module missing: ${name}`);
  }
  for (const item of graph.modules) {
    assert.ok(!forbidden.test(item.id.replaceAll('\\', '/')), `Tool module in product: ${item.id}`);
    if (item.sha256) assert.equal(hash(readFileSync(resolve(mobile, item.id.split('?')[0]))), item.sha256, `Source changed since product build: ${item.id}`);
  }
  const worker = resolve(mobile, '.storybook/public/mockServiceWorker.js');
  assert.equal(hash(readFileSync(worker)), hash(readFileSync(resolve(mobile, 'node_modules/msw/lib/mockServiceWorker.js'))), 'Workbench worker must match the locked package');
  const web = inventory(resolve(mobile, 'dist'));
  assert.ok(graph.outputs && !Array.isArray(graph.outputs), 'Product graph needs emitted output digests');
  assert.deepEqual(web, graph.outputs, 'Product output bytes do not match the recorded module graph');
  assert.ok(web['index.html'], 'Product index missing');
  for (const [name] of Object.entries(web)) {
    assert.ok(!forbidden.test(name), `Tool resource in product: ${name}`);
    if (/\.(?:html|js|css|json)$/.test(name)) {
      const source = readFileSync(resolve(mobile, 'dist', name), 'utf8');
      assert.doesNotMatch(source, /mockServiceWorker|WORKBENCH_|workbench-synthetic|msw-storybook-addon|STORYBOOK_DISABLE_TELEMETRY|NOMAD_E2E_|NOMAD_BROWSER_TEST/, `Test bytes in product: ${name}`);
    }
  }
  for (const name of Object.keys(inventory(resolve(mobile, 'public')))) assert.ok(!forbidden.test(name), `Tool resource in product public: ${name}`);
  const nativeAssets = {};
  if (native) for (const [platform, path] of [['android', 'android/app/src/main/assets/public'], ['ios', 'ios/App/App/public']]) {
    const all = inventory(resolve(mobile, path));
    // Capacitor supplies these two bridge files. No arbitrary extra files are accepted.
    const extras = Object.keys(all).filter((name) => !Object.hasOwn(web, name));
    for (const name of extras) {
      assert.ok(['cordova.js', 'cordova_plugins.js'].includes(name), `Unexpected ${platform} resource: ${name}`);
      assert.equal(all[name], hash(''), `Unexpected ${platform} bridge content: ${name}`);
    }
    for (const [name, digest] of Object.entries(web)) assert.equal(all[name], digest, `${platform} stale/missing product asset: ${name}`);
    nativeAssets[platform] = all;
  }
  return { kind: 'product-resource-isolation', moduleCount: graph.modules.length, web, nativeAssets,
    sourceEntry: graph.entrySha256, workerSha256: hash(readFileSync(worker)), productGraphSha256: hash(JSON.stringify(graph)), realDeviceAssessed: false };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = checkIsolation({ native: !process.argv.includes('--web-only') });
  mkdirSync(resolve(mobileRoot, '.workbench-results'), { recursive: true });
  writeFileSync(resolve(mobileRoot, '.workbench-results/product-isolation.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
}
