import type { SetupWorker } from 'msw/browser';
import { setupWorker } from 'msw/browser';
import { commitIdentity } from '../src/auth/session-context';
import { createAuthApiClient, type AuthApiClient } from '../src/auth/api';
import { assertFixtureConfig } from './fixtures';
import { denyUndeclared } from './handlers';
import { isScenarioApi, isToolAsset, NetworkLedger } from './network-policy';

export type Scenario = {
  id: string;
  ledger: NetworkLedger;
  controller: AbortController;
  pending: Set<Promise<unknown>>;
  closed: boolean;
};
let current: Scenario | undefined;
let worker: SetupWorker | undefined;
let ready = false;
let guarded = false;

function reject(scene: Scenario, request: Request, code: string): never {
  if (current && current !== scene) current.ledger.record(request, 'LATE_PREVIOUS_SCENE');
  return scene.ledger.reject(request, code);
}

export function activeScenario(): Scenario {
  if (!current || current.closed) throw new Error('WORKBENCH_SCENE_INACTIVE');
  return current;
}

function installFetchGuard() {
  if (guarded) return;
  const fetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async (input, init) => {
    const request = new Request(input instanceof Request ? input : new URL(String(input), location.origin), init);
    if (isToolAsset(request, location.origin)) return fetch(request);
    const scene = activeScenario();
    if (!ready) reject(scene, request, 'WORKER_NOT_READY');
    if (new URL(request.url).origin !== location.origin) reject(scene, request, 'EXTERNAL_REQUEST');
    if (!isScenarioApi(request)) reject(scene, request, 'UNDECLARED_REQUEST');
    const registration = await navigator.serviceWorker.getRegistration(`${location.origin}/`);
    if (!registration?.active || registration.active.state !== 'activated' || new URL(registration.active.scriptURL).pathname !== '/mockServiceWorker.js') {
      ready = false;
      reject(scene, request, 'WORKER_LOST');
    }
    if (scene.closed) reject(scene, request, 'LATE_REQUEST');
    const signal = AbortSignal.any([scene.controller.signal, request.signal]);
    const pending = fetch(new Request(request, { signal }));
    scene.pending.add(pending);
    try { return await pending; }
    finally { scene.pending.delete(pending); }
  };
  guarded = true;
}

export async function startWorker(): Promise<SetupWorker> {
  installFetchGuard();
  worker ??= setupWorker(denyUndeclared(location.origin, () => activeScenario().ledger));
  ready = false;
  try {
    const registration = await worker.start({
      quiet: true,
      serviceWorker: { url: '/mockServiceWorker.js', options: { scope: '/' } },
      onUnhandledRequest(request) {
        if (!isToolAsset(request, location.origin)) activeScenario().ledger.reject(request, 'MSW_UNHANDLED_REQUEST');
      },
    });
    if (!registration || !registration.active) throw new Error('WORKBENCH_WORKER_NOT_ACTIVE');
    ready = true;
    return worker;
  } catch {
    ready = false;
    throw new Error('WORKBENCH_WORKER_START_FAILED');
  }
}

export async function finishScenario(scene = current) {
  if (!scene) return;
  if (scene.closed) { scene.ledger.assertClean(); return; }
  scene.closed = true;
  scene.controller.abort();
  await Promise.allSettled([...scene.pending]);
  commitIdentity(null);
  // This origin is workbench-only. Never clear product IDB or unregister another worker.
  localStorage.removeItem('nomad_device_fingerprint');
  scene.ledger.assertClean();
}

export async function beginScenario(id: string) {
  await finishScenario();
  current = { id, ledger: new NetworkLedger(id), controller: new AbortController(), pending: new Set(), closed: false };
  commitIdentity(null);
  localStorage.setItem('nomad_device_fingerprint', 'workbench-synthetic');
  return current;
}

export function scenarioClient(scene: Scenario): AuthApiClient {
  const client = createAuthApiClient(location.origin);
  const call = async <T,>(operation: () => Promise<T>): Promise<T> => {
    if (scene !== current || scene.closed || !ready) {
      reject(scene, new Request(`${location.origin}/auth/config`), 'STALE_SCENE_CLIENT');
    }
    const response = await operation();
    if (scene !== current || scene.closed) throw new Error('WORKBENCH_SCENE_CANCELLED');
    return response;
  };
  return {
    getConfig: () => call(async () => {
      const config = await client.getConfig();
      try { assertFixtureConfig(config); }
      catch { reject(scene, new Request(`${location.origin}/auth/config`), 'REAL_PROVIDER_REJECTED'); }
      return config;
    }),
    startOtp: (request) => call(() => client.startOtp(request)),
    verifyOtp: (request) => call(() => client.verifyOtp(request)),
    getCurrentUser: (options) => call(() => client.getCurrentUser(options)),
  };
}
