import { http, HttpResponse, passthrough } from 'msw';
import type { components } from 'nomad-types/src/api-types';
import { assertFixtureConfig, authConfig, blocked, currentUser, libraryCities, otpSent, partialImport } from './fixtures';
import { isToolAsset, type NetworkLedger } from './network-policy';

export const scenarioNames = ['success', 'empty', 'forbidden', 'timeout', 'loading', 'captcha', 'partial', 'reconnect', 'long'] as const;
export type ScenarioName = typeof scenarioNames[number];
export function scenarioName(value: unknown): ScenarioName {
  if (value === undefined) return 'success';
  const found = scenarioNames.find((name) => name === value);
  if (!found) throw new Error('WORKBENCH_SCENARIO_INVALID');
  return found;
}

export function denyUndeclared(origin: string, ledger: () => NetworkLedger) {
  return http.all('*', ({ request }) => {
    if (isToolAsset(request, origin)) return passthrough();
    ledger().record(request, 'UNDECLARED_REQUEST');
    return HttpResponse.json({ error_code: 'WORKBENCH_NETWORK_BLOCKED', error_message: 'Undeclared synthetic request', retriable: false }, { status: 500 });
  });
}

/** A timer belongs to one scene and is aborted when its component is unmounted. */
export function pause(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) { resolve(); return; }
    const done = () => { clearTimeout(timer); signal.removeEventListener('abort', done); resolve(); };
    const timer = setTimeout(done, milliseconds);
    signal.addEventListener('abort', done, { once: true });
  });
}

export function createHandlers(origin: string, scenario: ScenarioName, signal: AbortSignal, config: components['schemas']['AuthConfigResponse'] = authConfig) {
  assertFixtureConfig(config);
  let configCalls = 0;
  let otpCalls = 0;
  return [
    http.get(`${origin}/auth/config`, async () => {
      configCalls++;
      if (scenario === 'loading') await pause(60000, signal);
      if (scenario === 'timeout') { await pause(120, signal); return HttpResponse.error(); }
      if (scenario === 'reconnect' && configCalls === 1) return HttpResponse.json(blocked, { status: 503 });
      if (scenario === 'empty') return HttpResponse.json({ ...config, enabled_methods: [] });
      const methods = scenario === 'long' ? [{ ...config.enabled_methods[0], label: '手机号登录 · 合成的超长中文说明用于检查窄屏与放大文字换行' }] : config.enabled_methods;
      return HttpResponse.json({ ...config, enabled_methods: methods });
    }),
    http.post(`${origin}/auth/otp/start`, async () => {
      otpCalls++;
      if (scenario === 'forbidden') return HttpResponse.json(blocked, { status: 403 });
      if (scenario === 'captcha' && otpCalls === 1) return HttpResponse.json({ ...otpSent, sent: false, retry_after_sec: 0, captcha_required: true });
      await pause(80, signal);
      return HttpResponse.json(otpSent);
    }),
    http.post(`${origin}/auth/otp/verify`, () => HttpResponse.json(currentUser)),
    http.get(`${origin}/me`, () => HttpResponse.json(currentUser)),
    http.get(`${origin}/library/cities`, () => HttpResponse.json(scenario === 'empty' ? { cities: [], unlocated_count: 0 } : libraryCities)),
    http.get(`${origin}/ingest/workbench-job`, () => HttpResponse.json(partialImport)),
  ];
}
