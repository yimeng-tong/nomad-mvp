import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, type Locator, type Page, type TestInfo } from 'playwright/test';
import policy from './policy.json' with { type: 'json' };

const mobile = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const hash = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');
const source = () => execFileSync('git', ['rev-parse', 'HEAD'], { cwd: mobile, encoding: 'utf8' }).trim();

export async function capture(page: Page, info: TestInfo, scene: string, surface: Page | Locator = page) {
  assert.ok(policy.scenes.includes(scene), 'Unregistered visual scene');
  assert.equal(info.config.updateSnapshots, 'none', 'NOMAD_E2E_AUTO_UPDATE_FORBIDDEN');
  const environment = JSON.parse(readFileSync(resolve(mobile, '.browser-results/environment.json'), 'utf8')) as { fingerprint: string; sourceRevision: string };
  assert.equal(environment.fingerprint, policy.environmentFingerprint, 'NOMAD_E2E_ENVIRONMENT_MISMATCH');
  assert.equal(environment.sourceRevision, source(), 'NOMAD_E2E_ENVIRONMENT_STALE');
  const use = info.project.use;
  for (const key of ['viewport', 'deviceScaleFactor', 'locale', 'timezoneId', 'colorScheme', 'reducedMotion', 'headless'] as const) {
    assert.deepEqual(use[key], policy[key], `Visual setting drifted: ${key}`);
  }
  await page.evaluate(async () => { await document.fonts.ready; });
  expect(await page.evaluate(() => document.fonts.check('16px sans-serif', '旅行中文'))).toBe(true);
  const file = `${info.project.name}/${scene}.png`;
  if (process.env.NOMAD_BROWSER_RUN_KIND === 'candidate') {
    assert.equal(process.env.CI, 'true', 'Candidates require the actual canonical CI');
    assert.match(process.env.GITHUB_REF ?? '', /^refs\/heads\/codex\/story-9-5-visual-candidate-/, 'Use the explicit candidate ref');
    const path = resolve(mobile, '.browser-results/visual-candidate', file);
    mkdirSync(dirname(path), { recursive: true });
    const bytes = await surface.screenshot({ path, animations: 'disabled', caret: 'hide', scale: 'css' });
    const geometry = await page.evaluate(() => Object.fromEntries(['.home-header', '.brand-kicker', '.home-content', '.destination-strip', '.destination-card', '.destination-card strong', '.dock-send', '.dock-send-glyph'].map((selector) => {
      const node = document.querySelector(selector); if (!node) return [selector, null];
      const rect = node.getBoundingClientRect();
      return [selector, { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, fontSize: getComputedStyle(node).fontSize, scrollY }];
    })));
    writeFileSync(path + '.json', JSON.stringify({ kind: 'unapproved-visual-candidate', scene, engine: info.project.name, file,
      sha256: hash(bytes), sourceRevision: source(), environmentFingerprint: environment.fingerprint, policyHash: hash(JSON.stringify(policy)),
      testTitle: info.title, geometry, githubRun: process.env.GITHUB_RUN_ID, ref: process.env.GITHUB_REF }, null, 2) + '\n');
    await info.attach('unapproved-candidate', { path, contentType: 'image/png' });
    return;
  }
  const approval = JSON.parse(readFileSync(resolve(mobile, 'e2e/visual/approval.json'), 'utf8')) as {
    environmentFingerprint: string; policyHash: string; files: Record<string, string>;
  };
  assert.equal(approval.environmentFingerprint, environment.fingerprint, 'NOMAD_E2E_BASELINE_ENVIRONMENT');
  assert.equal(approval.policyHash, hash(JSON.stringify(policy)), 'NOMAD_E2E_BASELINE_POLICY');
  const baseline = resolve(mobile, 'e2e/visual/baselines', file);
  assert.ok(existsSync(baseline), 'NOMAD_E2E_MISSING_BASELINE');
  assert.equal(hash(readFileSync(baseline)), approval.files[file], 'NOMAD_E2E_UNREVIEWED_BASELINE');
  await expect(surface).toHaveScreenshot(`${scene}.png`, { animations: 'disabled', caret: 'hide', scale: 'css', threshold: 0, maxDiffPixels: 0 });
  await info.attach('visual-actual', { body: await surface.screenshot({ animations: 'disabled', caret: 'hide', scale: 'css' }), contentType: 'image/png' });
}
