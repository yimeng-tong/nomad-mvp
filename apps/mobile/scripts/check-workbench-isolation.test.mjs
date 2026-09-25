import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkIsolation } from './check-workbench-isolation.mjs';

const mobile = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(mobile, '../..');
const temp = mkdtempSync(join(tmpdir(), 'nomad-product-isolation-'));
const copy = join(temp, 'apps/mobile');
mkdirSync(copy, { recursive: true });
symlinkSync(join(root, 'node_modules'), join(temp, 'node_modules'));
symlinkSync(join(root, 'packages'), join(temp, 'packages'));
symlinkSync(join(mobile, 'node_modules'), join(copy, 'node_modules'));
cpSync(join(mobile, 'src'), join(copy, 'src'), { recursive: true });
for (const file of ['dist', 'public', 'index.html', '.workbench-results/product-graph.json', '.storybook/public/mockServiceWorker.js',
  'android/app/src/main/assets/public', 'ios/App/App/public']) {
  mkdirSync(dirname(join(copy, file)), { recursive: true });
  cpSync(join(mobile, file), join(copy, file), { recursive: true });
}
after(() => rmSync(temp, { recursive: true, force: true }));

test('accepts the actual product graph and both complete native copies', () => {
  const result = checkIsolation({ mobile: copy });
  assert.ok(result.moduleCount > 10);
  assert.equal(result.realDeviceAssessed, false);
});

test('rejects product-public worker, Web worker, and native-only leftover worker independently', () => {
  for (const file of ['public/mockServiceWorker.js', 'dist/mockServiceWorker.js', 'android/app/src/main/assets/public/mockServiceWorker.js', 'ios/App/App/public/mockServiceWorker.js']) {
    const path = join(copy, file);
    writeFileSync(path, 'synthetic contamination');
    try { assert.throws(() => checkIsolation({ mobile: copy }), /Tool resource|Unexpected|Product output bytes/); }
    finally { rmSync(path); }
  }
});

test('rejects entry/module contamination, a stale native copy and incorrect bridge bytes', () => {
  const path = join(copy, '.workbench-results/product-graph.json');
  const original = readFileSync(path, 'utf8');
  const graph = JSON.parse(original);
  graph.modules.push({ id: 'workbench/scenario.ts', sha256: null });
  writeFileSync(path, JSON.stringify(graph));
  assert.throws(() => checkIsolation({ mobile: copy }), /Tool module/);
  writeFileSync(path, original);
  const index = join(copy, 'android/app/src/main/assets/public/index.html');
  const content = readFileSync(index);
  writeFileSync(index, 'stale');
  assert.throws(() => checkIsolation({ mobile: copy }), /stale\/missing/);
  writeFileSync(index, content);
  const bridge = join(copy, 'ios/App/App/public/cordova.js');
  writeFileSync(bridge, 'WORKBENCH_WORKER');
  assert.throws(() => checkIsolation({ mobile: copy }), /bridge content/);
  writeFileSync(bridge, '');
});

test('rejects a wrong or missing workbench worker before claiming product isolation', () => {
  const path = join(copy, '.storybook/public/mockServiceWorker.js');
  const original = readFileSync(path);
  writeFileSync(path, 'wrong worker');
  assert.throws(() => checkIsolation({ mobile: copy }), /worker must match/);
  rmSync(path);
  assert.throws(() => checkIsolation({ mobile: copy }));
  writeFileSync(path, original);
});

test('rejects a changed entry and same-named tampered output even if both native copies agree', () => {
  const entry = join(copy, 'src/main.tsx');
  const original = readFileSync(entry);
  writeFileSync(entry, Buffer.concat([original, Buffer.from('\nimport "../workbench/fixture";\n')]));
  assert.throws(() => checkIsolation({ mobile: copy }), /entry changed/);
  writeFileSync(entry, original);
  const graph = JSON.parse(readFileSync(join(copy, '.workbench-results/product-graph.json'), 'utf8'));
  const name = Object.keys(graph.outputs).find((name) => name.endsWith('.js'));
  assert.ok(name);
  const targets = ['dist', 'android/app/src/main/assets/public', 'ios/App/App/public'].map((dir) => join(copy, dir, name));
  const contents = targets.map((file) => readFileSync(file));
  targets.forEach((file) => writeFileSync(file, 'console.log("unrelated build");'));
  try { assert.throws(() => checkIsolation({ mobile: copy }), /Product output bytes/); }
  finally { targets.forEach((file, index) => writeFileSync(file, contents[index])); }
});
