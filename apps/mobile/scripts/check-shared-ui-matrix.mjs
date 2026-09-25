import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';

const mobile = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url), cli = resolve(dirname(require.resolve('vitest/package.json')), 'vitest.mjs');
const output = resolve(mobile, '.browser-results/shared-ui-matrix'); mkdirSync(output, { recursive: true });
const expected = ['身份恢复 · 隐式触发器', '身份恢复 · 私有提示与迟到回调'];
const results = [];
for (const [engine, runtime] of Object.entries({ chromium, firefox, webkit })) {
  const reportPath = resolve(output, `${engine}.json`);
  const child = spawnSync(process.execPath, [cli, 'run', 'workbench/SharedModal.stories.tsx', '--config', 'vitest.storybook.config.ts', '-t', '身份恢复 ·', '--reporter=json', '--outputFile', reportPath], {
    cwd: mobile, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024, timeout: 90000,
    env: { ...process.env, STORYBOOK_DISABLE_TELEMETRY: '1', NOMAD_WORKBENCH_BROWSER: engine, NOMAD_WORKBENCH_PUBLIC_BROWSER: engine, NOMAD_WORKBENCH_MUTATION: '' },
  });
  writeFileSync(resolve(output, `${engine}.log`), child.stdout + child.stderr);
  assert.equal(child.error, undefined, 'The actual browser runner must finish');
  assert.equal(child.status, 0, `Shared UI ${engine} failed`);
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  assert.equal(report.success, true); assert.equal(report.numPassedTests, expected.length); assert.equal(report.numFailedTests, 0);
  const cases = report.testResults.flatMap((file) => file.assertionResults).filter((test) => test.status !== 'pending' && test.status !== 'skipped');
  assert.equal(cases.length, expected.length);
  for (const name of expected) assert.equal(cases.filter((test) => test.fullName.includes(name) && test.status === 'passed').length, 1, 'Both selected contracts must actually pass');
  assert.ok(!report.testResults.some((file) => file.status === 'failed'));
  results.push({ engine, executable: runtime.executablePath(), executed: cases.length, tests: cases.map((test) => test.fullName), result: 'passed' });
}
writeFileSync(resolve(output, 'verification.json'), JSON.stringify({ kind: 'actual-shared-component-browser-matrix', results, executed: 6,
  scope: 'Actual shared PrivateUiBoundary/Toast/Dialog on isolated Storybook fixture; not a new business Toast entry or native-device acceptance' }, null, 2) + '\n');
console.log(JSON.stringify({ result: 'shared-ui-matrix-passed', engines: 3, cases: 6 }));
