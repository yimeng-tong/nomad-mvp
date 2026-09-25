import assert from 'node:assert/strict';
import { stripVTControlCharacters } from 'node:util';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const mobile = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const results = [];
const sentinel = 'nomad-private-sentinel-94';
const run = (label, mutation, pattern, expected, success = false) => {
  const result = spawnSync(process.execPath, [join(mobile, 'node_modules/vitest/vitest.mjs'), 'run', '--config', 'vitest.storybook.config.ts', '-t', pattern], {
    cwd: mobile, encoding: 'utf8', timeout: 90000, maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, STORYBOOK_DISABLE_TELEMETRY: '1', NOMAD_WORKBENCH_MUTATION: mutation },
  });
  assert.equal(result.error, undefined, `${label}: runner did not finish`);
  const output = stripVTControlCharacters(result.stdout + result.stderr);
  assert.ok(!output.includes(sentinel), `${label}: private sentinel reached captured output`);
  mkdirSync(join(mobile, '.workbench-results'), { recursive: true });
  writeFileSync(join(mobile, '.workbench-results', `counterexample-${label.replaceAll(' ', '-')}.log`), output);
  assert.equal(result.status === 0, success, `${label}: wrong exit status ${result.status}`);
  assert.match(output, expected, `${label}: expected outcome was not observed`);
  if (success) assert.match(output, /Tests\s+[1-9]\d* passed/, 'No tests cannot count as a passing control');
  results.push({ label, mutation, exitCode: result.status, expectedOutcome: success ? 'passed' : 'failed', sentinelLeaked: false });
  console.log(JSON.stringify(results.at(-1)));
};

run('unaltered workbench', '', '正常 · 键盘|403 · 文字错误', /passed/, true);
run('focus-return defect', 'focus', '正常 · 键盘', /toHaveFocus/);
run('keyboard-close defect', 'keyboard', '正常 · 键盘', /toBeInTheDocument/);
run('field-error association defect', 'association', '403 · 文字错误', /toHaveAccessibleDescription/);
run('missing textual error defect', 'text', '403 · 文字错误', /当前登录方式暂不可用/);
run('axe unnamed control defect', 'axe', '空', /button-name|accessible name|accessibility/i);
run('business catch cannot hide undeclared API', 'undeclared', '正常 · 键盘', /WORKBENCH_NETWORK_VIOLATION/);
run('late previous scene cannot pass the next ledger', 'late', '正常 · 键盘', /LATE_PREVIOUS_SCENE/);
run('worker loss blocks API before dispatch', 'workerLost', '正常 · 键盘', /WORKER_LOST/);
run('passthrough request is blocked', 'passthrough', '正常 · 键盘', /PASSTHROUGH_FORBIDDEN/);
run('static-looking raw fetch is blocked', 'staticFetch', '正常 · 键盘', /UNSCOPED_OR_UNDECLARED_REQUEST/);
run('stopped mocking still registered is blocked', 'stopped', '正常 · 键盘', /WORKER_NOT_READY/);
run('mocking stop during registration lookup is fenced', 'stoppedDuringLookup', '正常 · 键盘', /WORKER_NOT_READY/);
run('raw fetch after cleanup is recorded', 'rawAfterClose', '正常 · 键盘', /LATE_REQUEST/);
run('late raw URL cannot adopt a new scene', 'rawPrevious', '正常 · 键盘', /UNSCOPED_OR_UNDECLARED_REQUEST/);
run('real captcha rejected before render', 'provider', '正常 · 真实字段', /WORKBENCH_REAL_PROVIDER_REJECTED/);
run('worker startup failure blocks rendering', 'workerMissing', '正常 · 真实字段', /WORKBENCH_WORKER_START_FAILED/);
run('repaired workbench', '', '正常 · 键盘|403 · 文字错误|正常 · 真实字段', /passed/, true);
writeFileSync(join(mobile, '.workbench-results/counterexamples.json'), JSON.stringify({ kind: 'actual-component-counterexamples', mutations: 'in-memory Vite transform only; no source writes', results }, null, 2) + '\n');
