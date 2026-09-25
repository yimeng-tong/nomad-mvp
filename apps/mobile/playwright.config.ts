import { randomUUID } from 'node:crypto';
import { chromium, firefox, webkit, defineConfig } from 'playwright/test';

process.env.NOMAD_BROWSER_SERVER_NONCE ??= randomUUID();
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  outputDir: '.browser-results/test-results',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  updateSnapshots: 'none',
  reporter: [['list'], ['json', { outputFile: '.browser-results/report.json' }],
    ['html', { outputFolder: '.browser-results/html-report', open: 'never' }]],
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
