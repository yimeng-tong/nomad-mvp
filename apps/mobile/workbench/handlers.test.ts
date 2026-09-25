import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createHandlers } from './handlers';
import { authConfig } from './fixtures';
import { createNodeScenario } from './node-scenario';

describe('the same handlers in the isolated Node runtime', () => {
  const origin = 'http://workbench.invalid';
  let scene: ReturnType<typeof createNodeScenario>;
  beforeEach(() => {
    scene = createNodeScenario(origin);
    scene.start();
  });
  afterEach(() => { scene.finish(); });
  it('uses generated DTO success and empty states', async () => {
    const response = await fetch(`${origin}/auth/config`);
    expect(await response.json()).toEqual(authConfig);
    scene.server.use(...createHandlers(origin, 'empty', scene.controller.signal));
    const empty = await fetch(`${origin}/library/cities`);
    expect(await empty.json()).toEqual({ cities: [], unlocated_count: 0 });
    scene.ledger.assertClean();
  });
  it('returns 403 and preserves a partial snapshot from the real DTO', async () => {
    scene.server.use(...createHandlers(origin, 'forbidden', scene.controller.signal));
    const forbidden = await fetch(`${origin}/auth/otp/start`, { method: 'POST' });
    expect(forbidden.status).toBe(403);
    const partial = await fetch(`${origin}/ingest/workbench-job`);
    expect(await partial.json()).toMatchObject({ state: 'failed', partial: true, actions: { view: true } });
    scene.ledger.assertClean();
  });
  it('models timeout and reconnect without contacting an origin', async () => {
    scene.server.use(...createHandlers(origin, 'timeout', scene.controller.signal));
    await expect(fetch(`${origin}/auth/config`, { signal: AbortSignal.timeout(40) })).rejects.toThrow();
    scene.server.use(...createHandlers(origin, 'reconnect', scene.controller.signal));
    expect((await fetch(`${origin}/auth/config`)).status).toBe(503);
    expect((await fetch(`${origin}/auth/config`)).status).toBe(200);
    scene.ledger.assertClean();
  });
  it('rejects real captcha configuration before any render or request', () => {
    expect(() => createHandlers(origin, 'captcha', scene.controller.signal, { ...authConfig, captcha: { provider: 'aliyun-pnvs', mode: 'always', sdk_url: 'https://vendor.invalid/sdk.js' } })).toThrow('WORKBENCH_REAL_PROVIDER_REJECTED');
  });
});

it('the same Node cleanup fails on a caught undeclared request while privacy assertions remain ordinary assertions', async () => {
  const scene = createNodeScenario('http://workbench.invalid');
  scene.start();
  try {
    try {
      const response = await fetch('http://workbench.invalid/private-path-sentinel?q=query-sentinel', { method: 'POST', body: 'body-sentinel' });
      if (!response.ok) throw new Error('business catch');
    } catch { /* The cleanup still has to reject this deliberate violation. */ }
    expect(scene.ledger.records).toHaveLength(1);
    expect(JSON.stringify(scene.ledger.records)).not.toMatch(/path-sentinel|query-sentinel|body-sentinel/);
    expect(() => scene.finish()).toThrow('WORKBENCH_NETWORK_VIOLATION');
  } finally { scene.controller.abort(); scene.server.close(); }
});

it('Node cannot bypass the server with the MSW Accept escape hatch or a static-looking fetch', async () => {
  const scene = createNodeScenario('http://workbench.invalid');
  scene.start();
  try {
    const response = await fetch('http://workbench.invalid/auth/config', { headers: { Accept: 'msw/passthrough' } });
    expect(await response.json()).toEqual(authConfig);
    const asset = await fetch('http://workbench.invalid/assets/customer.json');
    expect(asset.status).toBe(500);
    expect(scene.ledger.records.map((record) => record.code)).toEqual(['PASSTHROUGH_FORBIDDEN', 'UNDECLARED_REQUEST']);
    expect(() => scene.finish()).toThrow('WORKBENCH_NETWORK_VIOLATION');
  } finally { scene.controller.abort(); scene.server.close(); }
});
