/** Diagnostic-only entry served by the owned loopback runner; never imported by main.tsx. */
import { createRoot, type Root } from 'react-dom/client';
import App from '../src/App';
import { commitIdentity } from '../src/auth/session-context';
import type { AuthMeasurementManifest, AuthMeasurementSample, AuthOutcome, AuthPhase } from 'nomad-types/src/auth-measurements';

let root: Root | undefined, active: AuthMeasurementSample | null = null, manifest: AuthMeasurementManifest | undefined;
const samples: AuthMeasurementSample[] = [], controllers = new Set<AbortController>();
const originalFetch = window.fetch.bind(window);
let collecting = false, deadlineAt = Infinity, deadlineTimer: ReturnType<typeof setTimeout> | undefined;
const observedNow = () => Math.min(performance.now(), deadlineAt);
const current = (sample: AuthMeasurementSample) => collecting && active === sample && performance.now() < deadlineAt;
const networkPhases: Readonly<Record<string, AuthPhase['phase']>> = { '/api/auth/otp/start': 'otp-send', '/api/auth/otp/verify': 'proof-verify', '/api/me': 'identity-read', '/api/logout': 'logout' };
const phaseFor = (path: string): AuthPhase['phase'] | null => networkPhases[path] ?? null;
function startPhase(sample: AuthMeasurementSample, phase: AuthPhase['phase']): AuthPhase {
  const span: AuthPhase = { phase, attempt: sample.phases.filter((p) => p.phase === phase).length + 1, startedMs: observedNow(), endedMs: null, outcome: 'unfinished' };
  sample.phases.push(span); return span;
}
function finishPhase(sample: AuthMeasurementSample, span: AuthPhase, outcome: AuthOutcome) {
  if (!current(sample)) return;
  span.endedMs = observedNow(); span.outcome = outcome;
}
function responseOutcome(phase: AuthPhase['phase'], response: Response, body: unknown): AuthOutcome {
  const record = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  if (response.ok) return phase === 'otp-send' && record.sent !== true ? 'unknown' : 'success';
  if (phase === 'logout') return 'unknown';
  return response.status >= 500 ? 'unavailable' : 'rejected';
}
window.fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, location.href);
  if (manifest && !remaining() && url.origin === location.origin && url.pathname.startsWith('/api/')) throw new DOMException('AUTH_MEASUREMENT_WINDOW_CLOSED', 'AbortError');
  const sample = active, measured = sample && current(sample) && url.origin === location.origin && url.pathname.startsWith('/api/');
  const kind = measured ? phaseFor(url.pathname) : null;
  if (measured) sample.apiRequests++;
  const span = measured && kind ? startPhase(sample, kind) : null;
  const controller = new AbortController(), signal = init?.signal ?? (input instanceof Request ? input.signal : null);
  const abort = () => controller.abort(); signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort(); controllers.add(controller);
  try {
    const response = await originalFetch(input, { ...init, signal: controller.signal });
    if (sample && span && kind) {
      let body: unknown = null;
      try { body = await response.clone().json(); } catch { /* A failed body remains an observed protocol result. */ }
      finishPhase(sample, span, responseOutcome(kind, response, body));
    }
    return response;
  } catch (error) {
    if (sample && span) finishPhase(sample, span, 'unknown');
    throw error;
  } finally { controllers.delete(controller); signal?.removeEventListener('abort', abort); }
};

export function mount() {
  if (manifest && !remaining()) throw new Error('AUTH_MEASUREMENT_WINDOW_CLOSED');
  root?.unmount(); root = undefined;
  for (const controller of controllers) controller.abort();
  commitIdentity(null);
  const element = document.getElementById('root'); if (!element) throw new Error('AUTH_MEASUREMENT_ROOT_MISSING');
  root = createRoot(element); root.render(<App />);
}
export function beginRun(plan: AuthMeasurementManifest['scenarioPlan'], deadlineMs: number) {
  if (manifest) throw new Error('AUTH_MEASUREMENT_ALREADY_STARTED');
  const start = performance.now(); deadlineAt = start + deadlineMs; collecting = true;
  manifest = { measurementVersion: 'nomad.auth.v1', workload: 'WL-AUTH', mode: 'fixture', clockId: crypto.randomUUID(),
    scenarioPlan: plan, plannedLogicalRequests: plan.reduce((n, p) => n + p.count, 0), windowStartMs: start, windowEndMs: start, deadlineMs,
    fixtureVersion: 'auth-ui-v1', sampling: 1, concurrency: 1, retryPolicy: 'explicit-only', cacheMode: 'one-browser-app-remount' };
  deadlineTimer = setTimeout(() => { finishCase('unfinished'); collecting = false; for (const c of controllers) c.abort(); }, deadlineMs);
}
export function remaining() { return collecting ? Math.max(0, deadlineAt - performance.now()) : 0; }
export function beginCase(scenario: AuthMeasurementSample['scenario']) {
  if (!manifest || !remaining() || active) throw new Error('AUTH_MEASUREMENT_WINDOW_CLOSED');
  active = { logicalId: crypto.randomUUID(), clockId: manifest.clockId, scenario, outcome: 'unfinished', startedMs: observedNow(), observedUntilMs: observedNow(),
    apiRequests: 0, recoveredOriginalOperation: null, phases: [] };
}
export function beginUiPhase(phase: 'protected-home' | 'logout-recovery') {
  if (!active || !current(active)) throw new Error('AUTH_MEASUREMENT_WINDOW_CLOSED');
  startPhase(active, phase);
}
export function finishCase(outcome: AuthOutcome, recoveredOriginalOperation: boolean | null = null) {
  const sample = active; if (!sample) return;
  if (!current(sample)) { outcome = 'unfinished'; recoveredOriginalOperation = null; }
  const end = observedNow();
  for (const phase of sample.phases) if (['protected-home', 'logout-recovery'].includes(phase.phase) && phase.endedMs === null && outcome !== 'unfinished') {
    phase.endedMs = end; phase.outcome = outcome;
  }
  sample.observedUntilMs = end; sample.outcome = outcome; sample.recoveredOriginalOperation = recoveredOriginalOperation;
  samples.push(structuredClone(sample)); active = null;
}
export function finishRun() {
  if (!manifest) throw new Error('AUTH_MEASUREMENT_NOT_STARTED');
  finishCase('unfinished'); manifest.windowEndMs = observedNow(); collecting = false; clearTimeout(deadlineTimer);
  root?.unmount(); root = undefined; for (const c of controllers) c.abort();
  return { manifest, samples: structuredClone(samples) };
}
