import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';

const require = createRequire(import.meta.url);
const mobile = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const image = 'mcr.microsoft.com/playwright:v1.63.0-noble@sha256:bc6ab0d6d44ff4826e4cb8c1e6d801e185bfc42bb0753f8e2a30efc70db054c7';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const read = (path) => readFileSync(path, 'utf8');
const output = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8' }).trim();
const release = Object.fromEntries(read('/etc/os-release').split('\n').filter((line) => line.includes('=')).map((line) => {
  const index = line.indexOf('=');
  return [line.slice(0, index), line.slice(index + 1).replace(/^"|"$/g, '')];
}));
assert.equal(release.ID, 'ubuntu', 'Canonical browser environment requires Ubuntu');
assert.equal(release.VERSION_ID, '24.04', 'Canonical screenshot OS must be Ubuntu 24.04');
assert.equal(process.arch, 'x64', 'Canonical screenshot architecture must be amd64');
assert.equal(process.version, 'v22.22.1', 'Use the repository-pinned Node, not the image default');
assert.equal(output('pnpm', ['--version']), '11.7.0');
assert.equal(process.env.NOMAD_BROWSER_IMAGE, image, 'Explicit pinned CI image is required');

const pw = JSON.parse(read(require.resolve('playwright/package.json')));
assert.equal(pw.version, '1.63.0');
const playwrightRequire = createRequire(require.resolve('playwright/package.json'));
const metadata = JSON.parse(read(join(dirname(playwrightRequire.resolve('playwright-core/package.json')), 'browsers.json')));
const fontPaths = [...new Set(output('fc-list', ['-f', '%{file}\n']).split('\n').filter(Boolean))].sort();
assert.ok(fontPaths.length > 0, 'No real fonts found');
const fonts = Object.fromEntries(fontPaths.map((path) => [path, hash(readFileSync(path))]));
const [cjkFamily, cjkFile] = output('fc-match', ['-f', '%{family}\n%{file}\n', 'sans-serif:lang=zh-cn']).split('\n');
assert.match(cjkFamily, /WenQuanYi Zen Hei/, 'Pinned image must have the expected actual CJK fallback');
assert.ok(fonts[cjkFile], 'CJK font must belong to the recorded font inventory');
function configFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? configFiles(path) : [[path, hash(readFileSync(path))]];
  });
}
const fontconfig = Object.fromEntries(configFiles('/etc/fonts').sort(([a], [b]) => a.localeCompare(b)));
const browsers = {};
for (const [name, type] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await type.launch({ headless: true, executablePath: type.executablePath() });
  try {
    const locked = metadata.browsers.find((entry) => entry.name === name);
    assert.equal(browser.version(), locked.browserVersion, `${name} runtime must match the lock`);
    browsers[name] = { version: browser.version(), revision: locked.revision, executable: type.executablePath(), launchMode: 'headless-explicit-package-executable' };
  } finally {
    await browser.close();
  }
}
const environment = { image, os: { id: release.ID, version: release.VERSION_ID }, architecture: process.arch,
  node: process.version, pnpm: '11.7.0', playwright: pw.version, browsers, fonts, fontconfig, cjkFamily, cjkFile };
const report = { kind: 'actual-canonical-browser-environment', recordedAt: new Date().toISOString(),
  sourceRevision: output('git', ['rev-parse', 'HEAD']), environment, fingerprint: hash(JSON.stringify(environment)),
  nodeExecutable: process.execPath, productFlowsTested: false, nativeDevicesTested: false };
mkdirSync(resolve(mobile, '.browser-results'), { recursive: true });
writeFileSync(resolve(mobile, '.browser-results/environment.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ result: 'canonical-browser-environment-passed', browsers, fingerprint: report.fingerprint,
  cjkFamily, fontFiles: fontPaths.length, productFlowsTested: false }));
