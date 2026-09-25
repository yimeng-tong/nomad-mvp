import { test, expect } from '../fixtures/browser-test';

test('B02 declared product traffic stays inside its active scenario', async ({ page, api }) => {
  await page.goto('/');
  await expect(page.getByLabel('手机号', { exact: true })).toBeVisible();
  const probe = process.env.NOMAD_BROWSER_NET_PROBE;
  if (!probe) {
    const before = api.count('GET', '/api/auth/config');
    api.hold('/api/auth/config');
    const response = page.evaluate(async () => (await fetch('/api/auth/config')).status);
    await expect.poll(() => api.count('GET', '/api/auth/config')).toBeGreaterThan(before);
    api.release('/api/auth/config');
    expect(await response).toBe(200);
  }
  if (probe) {
    if (probe === 'retired') api.retire();
    const path = probe === 'external' ? 'https://nomad-e2e.invalid/undeclared' : probe === 'static'
      ? await page.locator('link[rel="stylesheet"]').getAttribute('href') : probe === 'retired' ? '/api/me' : '/api/undeclared';
    if (!path) throw new Error('Counterexample target missing');
    // Deliberately catch the transport error: fixture teardown must still fail.
    await page.evaluate(async (url) => { try { await fetch(url); } catch { /* controlled catch */ } }, path);
  }
});

test('B04 controlled delayed HTTP request is actually cancelled at its timeout', async ({ page, api }) => {
  await page.goto('/');
  await expect(page.getByLabel('手机号', { exact: true })).toBeVisible();
  api.hold('/api/auth/config');
  const outcome = await page.evaluate(async () => {
    try { await fetch('/api/auth/config', { signal: AbortSignal.timeout(50) }); return 'responded'; }
    catch (error: unknown) { return error && typeof error === 'object' && 'name' in error ? String(error.name) : 'unknown'; }
  });
  api.release('/api/auth/config');
  expect(outcome).toBe('TimeoutError');
});
