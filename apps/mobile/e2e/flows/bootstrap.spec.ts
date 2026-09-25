import { readFileSync } from 'node:fs';
import { test, expect } from 'playwright/test';
import { rejectWebSockets } from '../fixtures/sockets';

test('B00 actual product bootstrap honestly reports unavailable identity', async ({ page, context, request }) => {
  const owned = await request.get('/__nomad_browser_ready');
  const identity = await owned.json() as { nonce: string };
  expect(identity.nonce).toBe(process.env.NOMAD_BROWSER_SERVER_NONCE);
  const graph = JSON.parse(readFileSync(new URL('../../.workbench-results/product-graph.json', import.meta.url), 'utf8')) as { outputs: Record<string, string> };
  const violations: string[] = [];
  const errors: string[] = [];
  await rejectWebSockets(context, () => violations.push('NOMAD_E2E_WEBSOCKET_FORBIDDEN'));
  page.on('pageerror', (error) => errors.push(error.message));
  await context.route('**/*', async (route) => {
    const incoming = route.request();
    const url = new URL(incoming.url());
    const kind = incoming.resourceType();
    const api = incoming.method() === 'GET' && ['/api/me', '/api/auth/config'].includes(url.pathname);
    const asset = incoming.method() === 'GET' && kind !== 'fetch' && kind !== 'xhr'
      && (url.pathname === '/' || url.pathname === '/favicon.ico' || Object.hasOwn(graph.outputs, url.pathname.slice(1)));
    if (url.origin !== 'http://127.0.0.1:4175' || !(api || asset)) {
      violations.push(`${incoming.method()}:${kind}:undeclared-request`);
      await route.abort('blockedbyclient');
      return;
    }
    await route.continue();
  });
  await page.goto('/');
  await expect(page.getByText('暂时无法确认登录状态', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '重试确认', exact: true })).toBeVisible();
  await expect(page.locator('.home-shell')).toHaveCount(0);
  expect(violations).toEqual([]);
  expect(errors).toEqual([]);
});
