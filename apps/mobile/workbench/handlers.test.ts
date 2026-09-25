import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';
import { createHandlers, denyUndeclared } from './handlers';
import { authConfig } from './fixtures';
import { NetworkLedger } from './network-policy';

describe('the same handlers in the isolated Node runtime', () => {
  const origin = 'http://workbench.invalid';
  let controller: AbortController;
  let ledger: NetworkLedger;
  const server = setupServer(denyUndeclared(origin, () => ledger));
  beforeEach(() => {
    ledger = new NetworkLedger('node');
    controller = new AbortController();
    server.listen({ onUnhandledRequest: (request) => ledger.reject(request, 'MSW_UNHANDLED_REQUEST') });
    server.use(...createHandlers(origin, 'success', controller.signal));
  });
  afterEach(() => { controller.abort(); server.resetHandlers(); server.close(); });
  it('uses generated DTO success and empty states', async () => {
    const response = await fetch(`${origin}/auth/config`);
    expect(await response.json()).toEqual(authConfig);
    server.use(...createHandlers(origin, 'empty', controller.signal));
    const empty = await fetch(`${origin}/library/cities`);
    expect(await empty.json()).toEqual({ cities: [], unlocated_count: 0 });
    ledger.assertClean();
  });
  it('returns 403 and preserves a partial snapshot from the real DTO', async () => {
    server.use(...createHandlers(origin, 'forbidden', controller.signal));
    const forbidden = await fetch(`${origin}/auth/otp/start`, { method: 'POST' });
    expect(forbidden.status).toBe(403);
    const partial = await fetch(`${origin}/ingest/workbench-job`);
    expect(await partial.json()).toMatchObject({ state: 'failed', partial: true, actions: { view: true } });
    ledger.assertClean();
  });
  it('models timeout and reconnect without contacting an origin', async () => {
    server.use(...createHandlers(origin, 'timeout', controller.signal));
    await expect(fetch(`${origin}/auth/config`)).rejects.toThrow();
    server.use(...createHandlers(origin, 'reconnect', controller.signal));
    expect((await fetch(`${origin}/auth/config`)).status).toBe(503);
    expect((await fetch(`${origin}/auth/config`)).status).toBe(200);
    ledger.assertClean();
  });
  it('denies undeclared requests even when business code catches and sanitizes all evidence', async () => {
    try {
      const response = await fetch(`${origin}/private-path-sentinel?q=query-sentinel`, { method: 'POST', body: 'body-sentinel' });
      if (!response.ok) throw new Error('business catch');
    } catch { /* Expected component error handling must not empty the ledger. */ }
    expect(() => ledger.assertClean()).toThrow('WORKBENCH_NETWORK_VIOLATION');
    expect(JSON.stringify(ledger.records)).not.toMatch(/path-sentinel|query-sentinel|body-sentinel/);
  });
  it('rejects real captcha configuration before any render or request', () => {
    expect(() => createHandlers(origin, 'captcha', controller.signal, { ...authConfig, captcha: { provider: 'aliyun-pnvs', mode: 'always', sdk_url: 'https://vendor.invalid/sdk.js' } })).toThrow('WORKBENCH_REAL_PROVIDER_REJECTED');
  });
});
