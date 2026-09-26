import { describe, expect, it } from 'vitest';
import { NetworkLedger, isScenarioApi, isToolAsset, safeRoute } from './network-policy';

describe('strict workbench network policy', () => {
  const origin = 'http://127.0.0.1:6006';
  it('permits only explicit local tool assets', () => {
    expect(isToolAsset(new Request(`${origin}/@vite/client`), origin)).toBe(true);
    expect(isToolAsset(new Request(`${origin}/assets/preview-123.js`), origin)).toBe(true);
    expect(isToolAsset(new Request(`${origin}/.storybook-cache/browser-normal/deps/runtime.js?v=123456ab`), origin)).toBe(true);
    expect(isToolAsset(new Request(`${origin}/assets/customer.json?private=value`), origin)).toBe(false);
    for (const url of [`${origin}/auth/config`, `${origin}/private.js`, 'https://vendor.invalid/assets/a.js']) {
      expect(isToolAsset(new Request(url), origin)).toBe(false);
    }
    expect(isToolAsset(new Request(`${origin}/assets/a.js`, { method: 'POST' }), origin)).toBe(false);
  });
  it('never records query, path identifiers or body and catches caught failures', () => {
    const ledger = new NetworkLedger('safe-scene');
    const request = new Request(`${origin}/private-personal-sentinel?q=query-sentinel`, { method: 'POST', body: 'body-sentinel' });
    try { ledger.reject(request, 'UNDECLARED_REQUEST'); } catch { /* Deliberately caught by a component. */ }
    expect(() => ledger.assertClean()).toThrow('WORKBENCH_NETWORK_VIOLATION');
    expect(JSON.stringify(ledger.records)).not.toMatch(/personal-sentinel|query-sentinel|body-sentinel/);
    expect(safeRoute(`${origin}/auth/config?q=secret`)).toBe('/auth/config');
  });
  it('declares only owner record GET routes and redacts detail identifiers from diagnostics', () => {
    const root = `${origin}/__nomad_workbench__/10000000-0000-4000-8000-000000000001`;
    const detail = `${root}/library/import-records/10000000-0000-4000-8000-000000000081`;
    expect(isScenarioApi(new Request(`${root}/library/import-records`))).toBe(true);
    expect(isScenarioApi(new Request(detail))).toBe(true);
    expect(safeRoute(detail)).toBe('/library/import-records/:id');
    expect(isScenarioApi(new Request(detail, { method: 'POST' }))).toBe(false);
    expect(isScenarioApi(new Request(`${root}/library/import-records/not-a-uuid`))).toBe(false);
  });
  it('does not clear a failed scene to make a subsequent scene pass', () => {
    const previous = new NetworkLedger('previous');
    previous.record(new Request(`${origin}/late`), 'LATE_REQUEST');
    expect(() => previous.assertClean()).toThrow();
    const next = new NetworkLedger('next');
    expect(() => next.assertClean()).not.toThrow();
    expect(previous.records).toHaveLength(1);
  });
});
