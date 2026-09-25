import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { workbenchMutation } from './scripts/workbench-mutations';

export default defineConfig({
  cacheDir: `.storybook-cache/browser-${process.env.NOMAD_WORKBENCH_MUTATION || 'normal'}`,
  envDir: false,
  envPrefix: 'NOMAD_WORKBENCH_PUBLIC_',
  publicDir: '.storybook/public',
  plugins: [...workbenchMutation(), storybookTest({ configDir: fileURLToPath(new URL('./.storybook', import.meta.url)), storybookScript: 'pnpm storybook --ci' })],
  test: {
    name: 'workbench',
    setupFiles: ['./.storybook/vitest.setup.ts'],
    testTimeout: 15000,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({ contextOptions: { locale: 'zh-CN', timezoneId: 'Asia/Shanghai', reducedMotion: 'reduce' } }),
      instances: [{ browser: 'chromium', viewport: { width: 900, height: 900 } }],
    },
  },
});
