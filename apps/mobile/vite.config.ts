import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';
import { CSS_BUILD_TARGETS, WEB_BUILD_TARGETS } from './src/platform/native-build-config';
import { productBuildProof } from './scripts/product-build-proof';

export default defineConfig({
  plugins: [react(), productBuildProof()],
  // Isolation candidates deliberately load no local env; ordinary product/dev behavior stays explicit.
  envDir: process.env.NOMAD_RECORD_PRODUCT_GRAPH === '1' ? false : undefined,
  build: { target: WEB_BUILD_TARGETS, cssTarget: CSS_BUILD_TARGETS },
  test: {
    exclude: [...configDefaults.exclude, 'scripts/**/*.test.mjs', 'workbench/**', 'e2e/**'],
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
  },
});
