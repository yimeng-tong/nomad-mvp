import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';
import { WEB_BUILD_TARGETS } from './src/platform/native-build-config';

export default defineConfig({
  plugins: [react()],
  build: { target: WEB_BUILD_TARGETS, cssTarget: ['chrome111', 'safari16'] },
  test: {
    exclude: [...configDefaults.exclude, 'scripts/**/*.test.mjs'],
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
  },
});
