import type { StorybookConfig } from '@storybook/react-vite';
import { WEB_BUILD_TARGETS, CSS_BUILD_TARGETS } from '../src/platform/native-build-config.ts';

const config: StorybookConfig = {
  framework: { name: '@storybook/react-vite', options: { builder: { viteConfigPath: '.storybook/vite.config.ts' } } },
  stories: ['../workbench/**/*.stories.tsx'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-vitest', 'msw-storybook-addon'],
  staticDirs: ['./public'],
  core: { disableTelemetry: true },
  viteFinal(config) {
    return Promise.resolve({
      ...config,
      envDir: false,
      envPrefix: 'NOMAD_WORKBENCH_PUBLIC_',
      build: { ...config.build, target: WEB_BUILD_TARGETS, cssTarget: CSS_BUILD_TARGETS },
      server: { ...config.server, host: '127.0.0.1', strictPort: true },
    });
  },
};
export default config;
