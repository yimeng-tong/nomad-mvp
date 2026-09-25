import assert from 'node:assert/strict';
import { after, afterEach, test } from 'node:test';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { baselinePath, classify, diagnosticFingerprint, hash } from './check-code-quality.mjs';

const root = process.cwd();
const fixture = mkdtempSync(join(tmpdir(), 'nomad-code-quality-'));
const copy = (file) => { mkdirSync(dirname(join(fixture, file)), { recursive: true }); cpSync(resolve(root, file), join(fixture, file), { recursive: true }); };
for (const file of ['eslint.config.mjs', 'tsconfig.lint.json', 'scripts/check-code-quality.mjs', 'scripts/code-quality-exceptions.json', baselinePath,
  'apps/mobile/src', 'apps/mobile/tsconfig.json', 'apps/mobile/tsconfig.workbench.json', 'apps/mobile/.storybook/vite.config.ts', 'apps/mobile/scripts/product-build-proof.ts', 'apps/mobile/vite.config.ts', 'apps/mobile/package.json']) copy(file);
symlinkSync(join(root, 'node_modules'), join(fixture, 'node_modules'));
symlinkSync(join(root, 'apps/mobile/node_modules'), join(fixture, 'apps/mobile/node_modules'));
writeFileSync(join(fixture, '.gitignore'), 'node_modules\n');
const git = (...args) => execFileSync('git', ['-C', fixture, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
git('init', '-q');
git('add', '.');
git('-c', 'user.name=Quality test', '-c', 'user.email=quality@example.invalid', 'commit', '-qm', 'Synthetic comparison base');
const base = git('rev-parse', 'HEAD');
const probe = 'apps/mobile/src/quality-probe.tsx';
const write = (file, text) => { mkdirSync(dirname(join(fixture, file)), { recursive: true }); writeFileSync(join(fixture, file), text); };
const run = (extraEnv = {}, options = {}) => {
  const result = spawnSync(process.execPath, ['scripts/check-code-quality.mjs'], { cwd: fixture, encoding: 'utf8', timeout: 60000,
    env: { ...process.env, CI: 'true', GITHUB_EVENT_NAME: 'pull_request', CODE_QUALITY_BASE: base, CODE_QUALITY_HEAD: git('rev-parse', 'HEAD'), ...extraEnv }, ...options });
  assert.equal(result.error, undefined);
  return { ...result, report: result.stdout.startsWith('{') ? JSON.parse(result.stdout) : null };
};
after(() => rmSync(fixture, { recursive: true, force: true }));
afterEach(() => rmSync(join(fixture, probe), { force: true }));

test('actual CI gate fails on Promise, void Promise, conditional Hook and unnamed field, then passes each repaired case', () => {
  const cases = [
    ['@typescript-eslint/no-floating-promises', 'export function Probe() { Promise.resolve(1); return null; }', 'export async function Probe() { await Promise.resolve(1); return null; }'],
    ['@typescript-eslint/no-floating-promises', 'export function Probe() { void Promise.reject(new Error("probe")); return null; }', 'export function Probe() { Promise.resolve(1).catch(() => console.error("bounded failure")); return null; }'],
    ['react-hooks/rules-of-hooks', 'import { useState } from "react"; export function Probe({active}:{active:boolean}) { if (active) useState(0); return null; }', 'import { useState } from "react"; export function Probe() { const [value] = useState(0); return <span>{value}</span>; }'],
    ['jsx-a11y/control-has-associated-label', 'export function Probe() { return <input />; }', 'export function Probe() { return <input aria-label="合成字段" />; }'],
  ];
  for (const [rule, bad, good] of cases) {
    write(probe, bad);
    const rejected = run();
    assert.equal(rejected.status, 1, rejected.stderr);
    assert.ok(rejected.report.selected.includes(probe));
    assert.ok(rejected.report.failures.some((f) => f.file === probe && f.ruleId === rule));
    assert.ok(rejected.report.failures.every((f) => f.ruleId !== 'CONFIG_OR_PARSE'));
    write(probe, good);
    const accepted = run();
    assert.equal(accepted.status, 0, accepted.stdout + accepted.stderr);
  }
  rmSync(join(fixture, probe));
});

test('browser globals reject Node-only APIs and valid JSX reaches accessibility rules', () => {
  for (const expression of ['Buffer.from("x")', 'process.exit(1)', 'globalThis.process.exit(1)']) {
    write(probe, `export function Probe() { ${expression}; return null; }`);
    const rejected = run();
    assert.equal(rejected.status, 1);
    assert.ok(rejected.report.failures.some((item) => ['no-restricted-globals', 'no-restricted-properties'].includes(item.ruleId)));
  }
  rmSync(join(fixture, probe));
  const jsx = 'apps/mobile/src/quality-jsx-probe.jsx';
  try {
    write(jsx, 'export function Probe() { return <input aria-label="字段" />; }');
    const clean = run(); assert.equal(clean.status, 0, clean.stdout + clean.stderr);
    write(jsx, 'export function Probe() { return <input />; }');
    const rejected = run(); assert.equal(rejected.status, 1);
    assert.ok(rejected.report.failures.some((item) => item.ruleId === 'jsx-a11y/control-has-associated-label'));
    assert.ok(rejected.report.failures.every((item) => item.ruleId !== 'CONFIG_OR_PARSE'));
  } finally { rmSync(join(fixture, jsx), { force: true }); }
});

test('new, changed inherited and renamed source files enter the cohort', () => {
  const inherited = 'apps/mobile/src/quality-inherited.ts';
  write(inherited, 'export const initial = 1;\n');
  git('add', inherited); git('-c', 'user.name=Quality test', '-c', 'user.email=quality@example.invalid', 'commit', '-qm', 'Synthetic inherited file');
  write(inherited, 'Promise.resolve(1);\n');
  assert.equal(run().status, 1);
  const renamed = 'apps/mobile/src/quality-renamed.ts';
  git('mv', inherited, renamed);
  const rejected = run();
  assert.equal(rejected.status, 1);
  assert.ok(rejected.report.selected.includes(renamed));
  assert.ok(rejected.report.failures.some((f) => f.file === renamed));
  rmSync(join(fixture, renamed));
});

test('unknown/missing comparison commits and a shallow checkout fail, first push runs the full cohort', () => {
  assert.equal(run({ CODE_QUALITY_BASE: 'f'.repeat(40) }).status, 2);
  assert.equal(run({ CODE_QUALITY_BASE: '' }).status, 2);
  const first = run({ GITHUB_EVENT_NAME: 'push', CODE_QUALITY_BASE: '0'.repeat(40) });
  assert.equal(first.status, 0, first.stdout + first.stderr);
  assert.equal(first.report.comparison.mode, 'first-push-full-cohort');
  assert.ok(first.report.selected.includes('apps/mobile/src/auth/LoginScreen.tsx'));
  // A real depth-one clone omits the comparison ancestor.
  const shallow = mkdtempSync(join(tmpdir(), 'nomad-quality-shallow-'));
  try {
    execFileSync('git', ['clone', '--depth=1', `file://${fixture}`, shallow], { stdio: 'pipe' });
    assert.throws(() => execFileSync('git', ['-C', shallow, 'rev-parse', '--verify', `${base}^{commit}`], { stdio: 'pipe' }));
    const validation = spawnSync(process.execPath, ['--input-type=module', '-e', `import { comparison } from ${JSON.stringify(new URL('./check-code-quality.mjs', import.meta.url).href)}; comparison(process.argv[1], {commit: process.argv[2]}, {}, process.argv[2]);`, shallow, base], { encoding: 'utf8' });
    assert.notEqual(validation.status, 0);
  } finally { rmSync(shallow, { recursive: true, force: true }); }
});

test('ignored coverage, disabled rules, parse errors and baseline/exception growth cannot go green', () => {
  const config = readFileSync(join(fixture, 'eslint.config.mjs'), 'utf8');
  write(probe, 'export const probe = 1;');
  write('eslint.config.mjs', config.replace("'**/node_modules/**'", "'**/node_modules/**', '**/quality-probe.tsx'"));
  assert.equal(run().status, 2);
  write('eslint.config.mjs', config.replace("'react-hooks/rules-of-hooks': 'error'", "'react-hooks/rules-of-hooks': 'off'"));
  assert.equal(run().status, 2);
  write('eslint.config.mjs', config);
  write(probe, 'export const = ;');
  const broken = run();
  assert.equal(broken.status, 1);
  assert.ok(broken.report.failures.some((f) => f.ruleId === 'CONFIG_OR_PARSE'));
  rmSync(join(fixture, probe));
  write('scripts/code-quality-exceptions.json', '[{"path":"invented"}]');
  assert.equal(run().status, 2);
  write('scripts/code-quality-exceptions.json', '[]');
  const original = readFileSync(join(fixture, baselinePath), 'utf8');
  write(baselinePath, original + '\n');
  assert.equal(run().status, 2);
  write(baselinePath, original);
});

test('frozen diagnostic matching rejects equal-count replacements, moves, copies and parser failures', () => {
  const file = 'apps/mobile/src/legacy.ts';
  const old = 'Promise.resolve(1);\n';
  const message = { line: 1, column: 1, endLine: 1, endColumn: 20, ruleId: '@typescript-eslint/no-floating-promises', nodeType: 'ExpressionStatement', message: 'Promise must be handled' };
  write(file, old);
  const entry = { path: file, ruleId: message.ruleId, fingerprint: diagnosticFingerprint(file, message, old), approved_file_sha256: hash(old), original_file_sha256: hash(old), count: 1, reason: 'Synthetic only', owner: '9.4 counterexample', exit_condition: 'Remove synthetic fixture' };
  const baseline = { source_files: { [file]: hash(old) } };
  const classifyOne = (messages) => classify(fixture, [{ filePath: join(fixture, file), messages }], [entry], baseline);
  assert.equal(classifyOne([message]).failures.length, 0);
  for (const replacement of ['Promise.resolve(2);\n', '\n' + old, old + old]) {
    write(file, replacement); assert.equal(classifyOne([message]).failures.length, 1);
  }
  write(file, old); assert.equal(classifyOne([{ ...message, fatal: true }]).failures.length, 1);
  rmSync(join(fixture, file));
});
