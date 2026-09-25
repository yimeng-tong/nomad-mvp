import { defineConfig } from 'vitest/config';

export default defineConfig({
  envDir: false,
  test: { name: 'workbench-network', environment: 'node', include: ['workbench/**/*.test.ts'], testTimeout: 10000 },
});
