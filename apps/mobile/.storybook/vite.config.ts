import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// A separate builder input keeps product jsdom setup and private env files out.
export default defineConfig({ plugins: [react()], envDir: false, envPrefix: 'NOMAD_WORKBENCH_PUBLIC_', cacheDir: '.storybook-cache/builder' });
