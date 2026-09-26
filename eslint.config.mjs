import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import a11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/storybook-static/**', '**/.workbench-results/**'] },
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'],
    rules: { ...js.configs.recommended.rules },
    linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: 'error' },
  },
  { files: ['**/*.{mjs,cjs}', 'scripts/**/*.{js,ts,mts,cts}', 'apps/server/**/*.{js,ts}', 'apps/mobile/scripts/**/*.{js,ts}', 'apps/mobile/*.config.ts', 'apps/mobile/.storybook/main.ts', 'apps/mobile/.storybook/vite.config.ts'], languageOptions: { globals: globals.node } },
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { project: ['./tsconfig.lint.json'], tsconfigRootDir: root },
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: false }],
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
    },
  },
  {
    files: ['apps/mobile/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: { project: ['./apps/mobile/tsconfig.workbench.json', './apps/mobile/tsconfig.json'] },
    },
  },
  { files: ['apps/mobile/src/**/*.{ts,tsx}'], languageOptions: { parserOptions: { project: ['./apps/mobile/tsconfig.json'] } } },
  { files: ['scripts/measurements/**/*.mts', 'apps/mobile/scripts/*-measurement-harness.tsx'],
    languageOptions: { parserOptions: { project: ['./scripts/measurements/tsconfig.json'] } } },
  { files: ['scripts/telemetry/**/*.mts'], languageOptions: { parserOptions: { project: ['./scripts/telemetry/tsconfig.json'] } } },
  { files: ['apps/mobile/scripts/home-dock-browser-probe.mjs'], languageOptions: { globals: { ...globals.node, ...globals.browser } } },
  { files: ['apps/mobile/playwright.config.ts', 'apps/mobile/e2e/**/*.ts'], languageOptions: { globals: globals.node,
    parserOptions: { project: ['./apps/mobile/tsconfig.e2e.json'] } } },
  {
    files: ['apps/mobile/src/**/*.{ts,tsx,js,jsx}', 'apps/mobile/workbench/**/*.{ts,tsx,js,jsx}', 'apps/mobile/.storybook/preview.tsx', 'apps/mobile/.storybook/vitest.setup.ts'],
    languageOptions: { globals: globals.browser },
    rules: {
      'no-restricted-globals': ['error', 'Buffer', 'process', 'global', '__dirname', '__filename', 'module', 'require', 'exports', 'setImmediate', 'clearImmediate'],
      'no-restricted-properties': ['error', { object: 'globalThis', property: 'process' }, { object: 'globalThis', property: 'Buffer' }],
    },
  },
  { files: ['**/*.jsx'], languageOptions: { globals: globals.browser, parserOptions: { ecmaFeatures: { jsx: true } } } },
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: { 'react-hooks': hooks, 'jsx-a11y': a11y },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      ...a11y.flatConfigs.recommended.rules,
      'jsx-a11y/control-has-associated-label': ['error', { depth: 3 }],
    },
  },
];
