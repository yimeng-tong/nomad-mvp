import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';
import { CSS_BUILD_TARGETS, WEB_BUILD_TARGETS } from './src/platform/native-build-config';

export default defineConfig({
  plugins: [react()],
  build: { target: WEB_BUILD_TARGETS, cssTarget: CSS_BUILD_TARGETS },
  test: {
    exclude: [...configDefaults.exclude, 'scripts/**/*.test.mjs'],
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
  },
});
