import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit, defineConfig } from 'playwright/test';

process.env.NOMAD_BROWSER_SERVER_NONCE ??= randomUUID();
process.env.NOMAD_BROWSER_RUN_ID ??= randomUUID();
const runId = process.env.NOMAD_BROWSER_RUN_ID;
if (!/^[a-zA-Z0-9_-]{1,80}$/.test(runId)) throw new Error('Invalid browser run ID');
const mobile = dirname(fileURLToPath(import.meta.url));
const runDirectory = resolve(mobile, '.browser-results/runs', runId);
if (existsSync(resolve(runDirectory, 'report.json'))) throw new Error('Browser run IDs cannot overwrite previous evidence');
mkdirSync(runDirectory, { recursive: true });
const pointer = JSON.stringify({ runId, report: `.browser-results/runs/${runId}/report.json` }) + '\n';
writeFileSync(resolve(mobile, '.browser-results/latest-run.json'), pointer);
if (process.env.NOMAD_BROWSER_RUN_KIND === 'suite') writeFileSync(resolve(mobile, '.browser-results/suite-run.json'), pointer);
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  outputDir: resolve(runDirectory, 'test-results'),
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  globalSetup: './e2e/setup.ts',
  globalTimeout: 300_000,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  updateSnapshots: 'none',
  snapshotPathTemplate: '{testDir}/visual/baselines/{projectName}/{arg}{ext}',
  metadata: { runId, runKind: process.env.NOMAD_BROWSER_RUN_KIND ?? 'local' },
  reporter: [['list'], ['json', { outputFile: resolve(runDirectory, 'report.json') }],
    ['html', { outputFolder: resolve(runDirectory, 'html-report'), open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4175',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: false,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    colorScheme: 'light',
    reducedMotion: 'reduce',
    headless: true,
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', launchOptions: { executablePath: chromium.executablePath() } } },
    { name: 'firefox', use: { browserName: 'firefox', launchOptions: { executablePath: firefox.executablePath() } } },
    { name: 'webkit', use: { browserName: 'webkit', launchOptions: { executablePath: webkit.executablePath() } } },
  ],
  webServer: {
    command: 'node scripts/serve-browser-product.mjs',
    url: 'http://127.0.0.1:4175/__nomad_browser_ready',
    reuseExistingServer: false,
    timeout: 15_000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 },
    env: { NOMAD_BROWSER_SERVER_NONCE: process.env.NOMAD_BROWSER_SERVER_NONCE },
  },
});
