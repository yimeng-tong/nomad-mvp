import { describe, expect, it } from 'vitest';
import { NetworkLedger, isToolAsset, safeRoute } from './network-policy';

describe('strict workbench network policy', () => {
  const origin = 'http://127.0.0.1:6006';
  it('permits only explicit local tool assets', () => {
    expect(isToolAsset(new Request(`${origin}/@vite/client`), origin)).toBe(true);
    expect(isToolAsset(new Request(`${origin}/assets/preview-123.js`), origin)).toBe(true);
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
  it('does not clear a failed scene to make a subsequent scene pass', () => {
    const previous = new NetworkLedger('previous');
    previous.record(new Request(`${origin}/late`), 'LATE_REQUEST');
    expect(() => previous.assertClean()).toThrow();
    const next = new NetworkLedger('next');
    expect(() => next.assertClean()).not.toThrow();
    expect(previous.records).toHaveLength(1);
  });
});
