import { test as base, expect } from 'playwright/test';
import { ApiScenario } from './api-scenario';

export const test = base.extend<{ api: ApiScenario }>({
  api: [async ({ context }, use) => {
    const api = new ApiScenario();
    await api.install(context);
    try { await use(api); } finally { await api.finish(); }
  }, { auto: true }],
});
export { expect };
