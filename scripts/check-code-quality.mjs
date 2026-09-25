import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

export const baselinePath = '_bmad-output/implementation-artifacts/evidence/story-9-4-workbench-2026-09-25/development-baseline.json';
const baselineDigest = 'ac821d66f5727a14b43735224bdb4f5122c39ebd5bdb7bb43c09468e7f3eb845';
const exemptionsPath = 'scripts/code-quality-exceptions.json';
const sourcePattern = /\.(?:[cm]?[jt]sx?)$/;
const required = ['apps/mobile/src/home/HomeSheet.tsx', 'apps/mobile/src/auth/LoginScreen.tsx', 'eslint.config.mjs'];
const always = /^(?:apps\/mobile\/(?:workbench\/|\.storybook\/|src\/ui\/|vitest\.[^/]+\.config\.ts$|scripts\/[^/]*workbench[^/]*\.mjs$)|scripts\/check-code-quality[^/]*\.mjs$)/;
const vendorWorker = 'apps/mobile/.storybook/public/mockServiceWorker.js';
export const hash = (input) => createHash('sha256').update(input).digest('hex');
const readJson = (root, file) => JSON.parse(readFileSync(resolve(root, file), 'utf8'));

function git(root, args) { return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
export function comparison(root, baseline, env = process.env, explicitBase) {
  const head = env.CODE_QUALITY_HEAD || 'HEAD';
  const event = env.GITHUB_EVENT_NAME;
  if (env.CI === 'true' && ['pull_request', 'push'].includes(event)) {
    assert.ok(env.CODE_QUALITY_BASE && env.CODE_QUALITY_HEAD, 'CI comparison base/head must be explicit');
  }
  const base = explicitBase ?? env.CODE_QUALITY_BASE ?? baseline.commit;
  const resolvedHead = git(root, ['rev-parse', '--verify', `${head}^{commit}`]);
  assert.equal(resolvedHead, git(root, ['rev-parse', 'HEAD']), 'Lint must inspect the checked-out commit');
  if (/^0{40}$/.test(base)) {
    assert.equal(event, 'push', 'Zero base is only valid for a first push');
    return { base: null, head: resolvedHead, mode: 'first-push-full-cohort', changed: [] };
  }
  const resolvedBase = git(root, ['rev-parse', '--verify', `${base}^{commit}`]);
  return { base: resolvedBase, head: resolvedHead, mode: 'explicit-comparison', changed: git(root, ['diff', '--no-ext-diff', '--name-only', '-z', resolvedBase, resolvedHead]).split('\0').filter(Boolean) };
}

export function selectFiles(root, baseline, changed) {
  const files = git(root, ['ls-files', '--cached', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean);
  const candidates = [...new Set(files)].filter((file) => sourcePattern.test(file) && existsSync(resolve(root, file)) && file !== vendorWorker);
  const delta = new Set(changed);
  const selected = candidates.filter((file) => required.includes(file) || always.test(file) || delta.has(file) || !baseline.source_files[file] || hash(readFileSync(resolve(root, file))) !== baseline.source_files[file]);
  for (const file of required) assert.ok(selected.includes(file), `Required lint file missing: ${file}`);
  assert.ok(selected.length, 'Empty lint cohort is forbidden');
  return { selected: selected.sort(), inheritedUnchanged: candidates.filter((file) => !selected.includes(file)).sort() };
}

export function diagnosticFingerprint(file, message, source) {
  const lines = source.split(/\r?\n/);
  const context = lines.slice(Math.max(0, message.line - 2), (message.endLine ?? message.line) + 1).join('\n');
  return hash(JSON.stringify({ file, ruleId: message.ruleId, message: message.message, nodeType: message.nodeType, line: message.line, column: message.column, endLine: message.endLine, endColumn: message.endColumn, context }));
}

export function classify(root, results, exceptions, baseline) {
  const used = new Set();
  const failures = [];
  for (const result of results) {
    const file = relative(root, result.filePath).replaceAll('\\', '/');
    const source = readFileSync(result.filePath, 'utf8');
    for (const message of result.messages) {
      const fingerprint = diagnosticFingerprint(file, message, source);
      const index = exceptions.findIndex((entry, i) => !used.has(i) && entry.path === file && entry.ruleId === message.ruleId
        && entry.fingerprint === fingerprint && entry.approved_file_sha256 === hash(source)
        && entry.original_file_sha256 === baseline.source_files[file]
        && entry.count === 1 && entry.reason && entry.owner && entry.exit_condition);
      if (!message.fatal && message.ruleId && index !== -1) used.add(index);
      else failures.push({ file, line: message.line, column: message.column, ruleId: message.ruleId ?? 'CONFIG_OR_PARSE', message: message.message });
    }
  }
  return { failures, matchedExceptions: used.size, retiredExceptions: exceptions.length - used.size };
}

export async function checkCodeQuality({ root = process.cwd(), base, env = process.env } = {}) {
  root = resolve(root);
  assert.equal(hash(readFileSync(resolve(root, baselinePath))), baselineDigest, 'Bootstrap coverage baseline cannot be rebuilt');
  const baseline = readJson(root, baselinePath);
  const exceptions = readJson(root, exemptionsPath);
  assert.ok(Array.isArray(exceptions), 'Exception manifest must be an array');
  assert.ok(!existsSync(resolve(root, '.eslintrc.json')), 'Retire the legacy lint entrypoint');
  const compare = comparison(root, baseline, env, base);
  let previousExceptions = [];
  if (compare.base && git(root, ['ls-tree', '--name-only', compare.base, exemptionsPath]) === exemptionsPath) {
    previousExceptions = JSON.parse(git(root, ['show', `${compare.base}:${exemptionsPath}`]));
  }
  for (const entry of exceptions) assert.ok(previousExceptions.some((old) => JSON.stringify(old) === JSON.stringify(entry)), 'Historical exceptions may shrink but cannot grow or change');
  const cohort = selectFiles(root, baseline, compare.changed);
  const eslint = new ESLint({ cwd: root, errorOnUnmatchedPattern: true });
  for (const file of cohort.selected) {
    assert.equal(await eslint.isPathIgnored(file), false, `Lint ignored a required file: ${file}`);
    const config = await eslint.calculateConfigForFile(file);
    assert.ok(config, `Missing lint configuration: ${file}`);
    assert.equal(config.linterOptions.noInlineConfig, true, `Inline disable can bypass lint: ${file}`);
    const checks = /\.[cm]?tsx?$/.test(file) ? ['@typescript-eslint/no-floating-promises', '@typescript-eslint/no-misused-promises', '@typescript-eslint/no-unsafe-assignment', '@typescript-eslint/no-unsafe-call', '@typescript-eslint/no-unsafe-member-access', '@typescript-eslint/no-unsafe-return'] : ['no-undef', 'no-empty'];
    if (/\.[jt]sx$/.test(file)) checks.push('react-hooks/rules-of-hooks', 'react-hooks/exhaustive-deps', 'jsx-a11y/control-has-associated-label');
    for (const rule of checks) assert.equal(config.rules[rule]?.[0], 2, `Required rule disabled: ${file} ${rule}`);
    if (/\.[cm]?tsx?$/.test(file)) assert.equal(config.rules['@typescript-eslint/no-floating-promises']?.[1]?.ignoreVoid, false, `A void expression must not hide rejection: ${file}`);
  }
  const results = await eslint.lintFiles(cohort.selected);
  assert.deepEqual(results.map((r) => relative(root, r.filePath).replaceAll('\\', '/')).sort(), cohort.selected, 'Lint result coverage differs from cohort');
  const report = classify(root, results, exceptions, baseline);
  return { ...report, ...cohort, comparison: compare, success: report.failures.length === 0 };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const at = process.argv.indexOf('--base');
    const report = await checkCodeQuality({ base: at === -1 ? undefined : process.argv[at + 1] });
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.success ? 0 : 1;
  } catch (error) {
    console.error('CODE_QUALITY_CONFIGURATION_FAILED', error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  }
}
