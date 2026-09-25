import type { SetupWorker } from 'msw/browser';
import { setupWorker } from 'msw/browser';
import { commitIdentity } from '../src/auth/session-context';
import { createAuthApiClient, type AuthApiClient } from '../src/auth/api';
import { assertFixtureConfig } from './fixtures';
import { denyUndeclared } from './handlers';
import { isScenarioApi, isToolAsset, NetworkLedger } from './network-policy';

export type Scenario = {
  id: string;
  baseUrl: string;
  ledger: NetworkLedger;
  controller: AbortController;
  pending: Set<Promise<unknown>>;
  closed: boolean;
  finishing?: Promise<void>;
  timeoutMs?: number;
  timeouts: number;
};
let current: Scenario | undefined;
let worker: SetupWorker | undefined;
let ready = false;
let workerEpoch = 0;
let guarded = false;
let transition: Promise<void> = Promise.resolve();
const orphan = new NetworkLedger('outside-scene');

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
    if (!current) orphan.reject(request, 'NO_SCENE');
    const scene = current;
    if (scene.closed) reject(scene, request, 'LATE_REQUEST');
    if (new URL(request.url).origin !== location.origin) reject(scene, request, 'EXTERNAL_REQUEST');
    // Programmatic fetch never inherits the static-resource bypass. A retained URL binds its scene.
    if (!request.url.startsWith(`${scene.baseUrl}/`) || !isScenarioApi(request)) reject(scene, request, 'UNSCOPED_OR_UNDECLARED_REQUEST');
    if (request.headers.get('accept')?.includes('msw/passthrough')) reject(scene, request, 'PASSTHROUGH_FORBIDDEN');
    if (!ready) reject(scene, request, 'WORKER_NOT_READY');
    const epoch = workerEpoch;
    const registration = await navigator.serviceWorker.getRegistration(`${location.origin}/`);
    if (!registration?.active || registration.active.state !== 'activated' || new URL(registration.active.scriptURL).pathname !== '/mockServiceWorker.js') {
      ready = false;
      reject(scene, request, 'WORKER_LOST');
    }
    if (!ready || workerEpoch !== epoch) reject(scene, request, 'WORKER_NOT_READY');
    if (scene.closed || scene !== current) reject(scene, request, 'LATE_REQUEST');
    const timeout = scene.timeoutMs ? AbortSignal.timeout(scene.timeoutMs) : undefined;
    const signal = AbortSignal.any([scene.controller.signal, request.signal, ...(timeout ? [timeout] : [])]);
    const pending = fetch(new Request(request, { signal }));
    scene.pending.add(pending);
    try { return await pending; }
    catch (error) { if (timeout?.aborted && !scene.controller.signal.aborted) scene.timeouts++; throw error; }
    finally { scene.pending.delete(pending); }
  };
  guarded = true;
}

export async function startWorker(): Promise<SetupWorker> {
  installFetchGuard();
  if (!worker) {
    worker = setupWorker(denyUndeclared(location.origin, () => current?.ledger ?? orphan));
    const stop = worker.stop.bind(worker);
    worker.stop = () => { ready = false; workerEpoch++; stop(); };
  }
  ready = false;
  workerEpoch++;
  try {
    const registration = await worker.start({
      quiet: true,
      serviceWorker: { url: '/mockServiceWorker.js', options: { scope: '/' } },
      onUnhandledRequest(request) {
        if (!isToolAsset(request, location.origin)) (current?.ledger ?? orphan).reject(request, 'MSW_UNHANDLED_REQUEST');
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

/** Exposes the actual public stop API for a controlled failure test, without unregistering a worker. */
export function stopMocking() { worker?.stop(); }

export function finishScenario(scene = current): Promise<void> {
  if (!scene) return Promise.resolve();
  if (scene.finishing) return scene.finishing.then(() => scene.ledger.assertClean());
  scene.closed = true;
  scene.controller.abort();
  scene.finishing = (async () => {
    await Promise.allSettled([...scene.pending]);
    if (current === scene) {
      commitIdentity(null);
      localStorage.removeItem('nomad_device_fingerprint');
    }
    scene.ledger.assertClean();
    orphan.assertClean();
  })();
  return scene.finishing;
}

export function beginScenario(id: string, timeoutMs?: number): Promise<Scenario> {
  const next = transition.then(async () => {
    await finishScenario();
    orphan.assertClean();
    current = { id, baseUrl: `${location.origin}/__nomad_workbench__/${crypto.randomUUID()}`, ledger: new NetworkLedger(id), controller: new AbortController(), pending: new Set(), closed: false, timeoutMs, timeouts: 0 };
    commitIdentity(null);
    localStorage.setItem('nomad_device_fingerprint', 'workbench-synthetic');
    return current;
  });
  // The caller retains rejection; serializing later cleanup must not create an unhandled second rejection.
  transition = next.then(() => undefined, () => undefined);
  return next;
}

export function sceneFetch(scene: Scenario, route: string, init?: RequestInit) {
  if (scene !== current || scene.closed) reject(scene, new Request(`${scene.baseUrl}${route}`), 'STALE_SCENE_CLIENT');
  return fetch(`${scene.baseUrl}${route}`, init);
}

export function scenarioClient(scene: Scenario): AuthApiClient {
  const client = createAuthApiClient(scene.baseUrl);
  const call = async <T,>(operation: () => Promise<T>): Promise<T> => {
    if (scene !== current || scene.closed || !ready) reject(scene, new Request(`${scene.baseUrl}/auth/config`), 'STALE_SCENE_CLIENT');
    const response = await operation();
    if (scene !== current || scene.closed) throw new Error('WORKBENCH_SCENE_CANCELLED');
    return response;
  };
  return {
    getConfig: () => call(async () => {
      const config = await client.getConfig();
      try { assertFixtureConfig(config); }
      catch { reject(scene, new Request(`${scene.baseUrl}/auth/config`), 'REAL_PROVIDER_REJECTED'); }
      return config;
    }),
    startOtp: (request) => call(() => client.startOtp(request)),
    verifyOtp: (request) => call(() => client.verifyOtp(request)),
    getCurrentUser: (options) => call(() => client.getCurrentUser(options)),
  };
}
