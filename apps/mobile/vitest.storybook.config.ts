import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { workbenchMutation } from './scripts/workbench-mutations';
import { chromium, firefox, webkit } from 'playwright';

const browserName = process.env.NOMAD_WORKBENCH_BROWSER ?? 'chromium';
if (!['chromium', 'firefox', 'webkit'].includes(browserName)) throw new Error('WORKBENCH_BROWSER_INVALID');
const browserType = { chromium, firefox, webkit }[browserName as 'chromium' | 'firefox' | 'webkit'];

export default defineConfig({
  cacheDir: `.storybook-cache/browser-${process.env.NOMAD_WORKBENCH_MUTATION || 'normal'}`,
  envDir: false,
  envPrefix: 'NOMAD_WORKBENCH_PUBLIC_',
  publicDir: '.storybook/public',
  plugins: [...workbenchMutation(), storybookTest({ configDir: fileURLToPath(new URL('./.storybook', import.meta.url)), storybookScript: 'pnpm storybook --ci' }), {
    name: 'nomad-final-workbench-cache',
    enforce: 'post',
    // addon-vitest supplies its own cache in a config hook, so override after that hook.
    config: () => ({ cacheDir: `.storybook-cache/browser-${process.env.NOMAD_WORKBENCH_MUTATION || 'normal'}` }),
  }],
  test: {
    name: 'workbench',
    setupFiles: ['./.storybook/vitest.setup.ts'],
    testTimeout: 15000,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({ launchOptions: { executablePath: browserType.executablePath() }, contextOptions: { locale: 'zh-CN', timezoneId: 'Asia/Shanghai', reducedMotion: 'reduce' } }),
      instances: [{ browser: browserName as 'chromium' | 'firefox' | 'webkit', viewport: { width: 390, height: 844 } }],
    },
  },
});
