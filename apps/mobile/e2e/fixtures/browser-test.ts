import { test as base, expect } from 'playwright/test';
import { ApiScenario } from './api-scenario';
import { installBrowserFault } from './faults';

export const test = base.extend<{ api: ApiScenario; _runtimeViewport: void }>({
  api: [async ({ context }, use) => {
    const api = new ApiScenario();
    await api.install(context);
    await installBrowserFault(context);
    try { await use(api); } finally { await api.finish(); }
  }, { auto: true }],
  _runtimeViewport: [async ({ page }, use) => {
    if (process.env.NOMAD_BROWSER_FAULT === 'viewport-drift') await page.setViewportSize({ width: 391, height: 844 });
    await use();
  }, { auto: true }],
});
export { expect };
