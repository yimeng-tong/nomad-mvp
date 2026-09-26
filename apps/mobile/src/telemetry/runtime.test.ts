import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createTelemetryRuntime, type TelemetryContext, type TelemetrySession, type TelemetrySink } from './runtime';
const context: TelemetryContext = { consent: 'granted', policyVersion: 'privacy-v1', authEpoch: 1, phase: 'authenticated', host: 'android' };
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const active: Array<ReturnType<typeof createTelemetryRuntime>> = [];
function fixture(open?: TelemetrySink['open'], clock?: () => number) {
  const session: TelemetrySession = { send: vi.fn(async () => 'accepted' as const), close: vi.fn() };
  const sink: TelemetrySink = { open: vi.fn(open ?? (async () => session)) };
  const runtime = createTelemetryRuntime({ requiredPolicyVersion: 'privacy-v1', sink, clock }); active.push(runtime);
  return { runtime, sink, session };
}
beforeEach(() => vi.useFakeTimers());
afterEach(async () => { active.splice(0).forEach((runtime) => runtime.close()); await vi.advanceTimersByTimeAsync(0); vi.useRealTimers(); });
const settle = () => vi.advanceTimersByTimeAsync(0);

it('never initializes or exports without current versioned consent, and isolates auth uncertainty', async () => {
  const { runtime, sink } = fixture(); runtime.bind().track('home_view', { source_page: 'home' });
  for (const change of [{ consent: 'unknown' as const }, { consent: 'denied' as const }, { policyVersion: 'old-v0' }, { phase: 'checking' as const }, { phase: 'unavailable' as const }]) {
    runtime.updateContext({ ...context, ...change }); runtime.bind().track('home_view', { source_page: 'home' }); await settle();
  }
  expect(sink.open).not.toHaveBeenCalled(); expect(runtime.snapshot().counters.blocked).toBe(6);
});

it('exports only validated immutable envelopes and distinguishes SDK acceptance from query evidence', async () => {
  const { runtime, session } = fixture(); runtime.updateContext(context); const bound = runtime.bind();
  const props = { source_page: 'home', url: 'private sentinel', city: 'private city' }; bound.trackWithId('home_view', props, id(1)); props.source_page = 'private';
  await settle(); const envelope = vi.mocked(session.send).mock.calls[0][0];
  expect(envelope).toMatchObject({ schemaVersion: 'nomad.telemetry.v1', eventId: id(1), host: 'android', stage: 'S0', props: { source_page: 'home' } });
  expect(Object.isFrozen(envelope.props)).toBe(true); expect(JSON.stringify(envelope)).not.toContain('private');
  expect(runtime.snapshot()).toMatchObject({ counters: { accepted: 1 }, providerQueryVerified: false });
});

it('accepts the input SHA-256 v8 profile only for its two declared events and preserves deduplication', async () => {
  const { runtime, session } = fixture(); runtime.updateContext(context); const bound = runtime.bind();
  const reference = '87ac5d88-c6d1-859c-89e6-b81c77b36056';
  bound.trackWithId('ingest_presented', { attempt: 2, stored_count: 3 }, reference);
  bound.trackWithId('ingest_presented', { attempt: 2, stored_count: 3 }, reference.toUpperCase());
  bound.trackWithId('auth_view', { source_page: 'login' }, reference);
  bound.trackWithId('ingest_presented', { attempt: 2, stored_count: 3 }, '00000000-0000-1000-8000-000000000001');
  bound.trackWithId('ingest_presented', { attempt: 2, stored_count: 3 }, reference + '\n');
  await settle();
  expect(session.send).toHaveBeenCalledTimes(1);
  expect(runtime.snapshot().counters).toMatchObject({ accepted: 1, duplicate: 1, invalid: 3 });
});

it('drops old bound emitters and queued events across revoke/identity ABA without attributing them to the new context', async () => {
  let finish!: (session: TelemetrySession) => void;
  const old: TelemetrySession = { send: vi.fn(async () => 'accepted' as const), close: vi.fn() };
  const { runtime, sink } = fixture(() => new Promise((resolve) => { finish = resolve; }));
  runtime.updateContext(context); const stale = runtime.bind(); stale.track('home_view', { source_page: 'home' }); await settle();
  runtime.updateContext({ ...context, consent: 'denied' }); stale.track('home_view', { source_page: 'home' });
  runtime.updateContext({ ...context, authEpoch: 2 }); runtime.updateContext({ ...context, authEpoch: 3 });
  finish(old); await settle();
  expect(old.close).toHaveBeenCalledTimes(1); expect(old.send).not.toHaveBeenCalled();
  expect(sink.open).toHaveBeenCalledTimes(2); expect(runtime.snapshot().counters.abandoned).toBe(1);
});

it('bounds storms, preserves caller event identities for dedupe and does not store raw payloads', async () => {
  const { runtime } = fixture(() => new Promise(() => {})); runtime.updateContext(context); const bound = runtime.bind();
  for (let n = 1; n <= 2000; n++) bound.trackWithId('home_view', { source_page: 'home' }, id(n));
  bound.trackWithId('home_view', { source_page: 'home' }, id(1));
  expect(runtime.snapshot()).toMatchObject({ queued: 64, retainedIdentities: 64, counters: { overflow: 1936, duplicate: 1 } });
});

it('a hung initialize after revocation cannot silently start a new SDK instance', async () => {
  const { runtime, sink } = fixture(() => new Promise(() => {})); runtime.updateContext(context); await settle();
  runtime.updateContext({ ...context, authEpoch: 2 }); await vi.advanceTimersByTimeAsync(2001);
  expect(sink.open).toHaveBeenCalledTimes(1); expect(runtime.snapshot().state).toBe('failed');
});

it('a late initialized handle is closed once after timeout and never receives queued events', async () => {
  let finish!: (value: TelemetrySession) => void;
  const late: TelemetrySession = { send: vi.fn(), close: vi.fn() };
  const { runtime } = fixture(() => new Promise((resolve) => { finish = resolve; }));
  runtime.updateContext(context); runtime.bind().track('home_view', { source_page: 'home' }); await vi.advanceTimersByTimeAsync(2001);
  finish(late); await settle(); expect(late.close).toHaveBeenCalledTimes(1); expect(late.send).not.toHaveBeenCalled(); expect(runtime.snapshot().state).toBe('failed');
});

it('timeouts stop dispatch instead of repeatedly adding unresolved sends, even after an owner change', async () => {
  const { runtime, session, sink } = fixture(); vi.mocked(session.send).mockImplementation(() => new Promise(() => {}));
  runtime.updateContext(context); await settle(); const bound = runtime.bind();
  bound.track('home_view', { source_page: 'home' }); bound.track('home_view', { source_page: 'home' }); await settle();
  runtime.updateContext({ ...context, authEpoch: 2 }); await vi.advanceTimersByTimeAsync(1001);
  expect(session.send).toHaveBeenCalledTimes(1); expect(sink.open).toHaveBeenCalledTimes(1); expect(runtime.snapshot().state).toBe('failed');
});

it('a sink failure never escapes to business callers or logs raw errors', async () => {
  const { runtime, sink } = fixture(async () => { throw new Error('private raw response'); });
  expect(() => runtime.updateContext(context)).not.toThrow(); await settle();
  expect(runtime.snapshot()).toMatchObject({ state: 'failed', counters: { failed: 1 } }); expect(JSON.stringify(runtime.snapshot())).not.toContain('private');
  runtime.updateContext({ ...context, authEpoch: 2 }); await settle(); expect(sink.open).toHaveBeenCalledTimes(1);
});

it('expires queued observations instead of uploading them after a stalled delivery', async () => {
  let finish!: (value: 'accepted') => void;
  let elapsed = 0;
  const { runtime, session } = fixture(undefined, () => elapsed); vi.mocked(session.send).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  runtime.updateContext(context); await settle(); const bound = runtime.bind();
  bound.trackWithId('home_view', { source_page: 'home' }, id(1)); bound.trackWithId('home_view', { source_page: 'home' }, id(2)); await settle();
  elapsed = 30001; finish('accepted'); await settle();
  expect(session.send).toHaveBeenCalledTimes(1); expect(runtime.snapshot().counters.expired).toBe(1);
});

it('never coerces event identities or retries a malformed initialized handle forever', async () => {
  const { runtime, session } = fixture(); runtime.updateContext(context); await settle();
  const stringify = vi.fn(() => id(1));
  runtime.bind().trackWithId('home_view', { source_page: 'home' }, { toString: stringify } as unknown as string); await settle();
  expect(stringify).not.toHaveBeenCalled(); expect(session.send).not.toHaveBeenCalled();
  const invalid = fixture(async () => null as unknown as TelemetrySession); invalid.runtime.updateContext(context); await settle();
  expect(invalid.sink.open).toHaveBeenCalledTimes(1); expect(invalid.runtime.snapshot().state).toBe('failed');
});

it('closing SDK buffers must complete before a new owner initializes; cleanup timeout fails closed', async () => {
  const { runtime, session, sink } = fixture(); vi.mocked(session.close).mockImplementation(() => new Promise(() => {}));
  runtime.updateContext(context); await settle(); runtime.updateContext({ ...context, authEpoch: 2 });
  runtime.bind().track('home_view', { source_page: 'home' }); await vi.advanceTimersByTimeAsync(1001);
  expect(sink.open).toHaveBeenCalledTimes(1); expect(runtime.snapshot()).toMatchObject({ state: 'failed', queued: 0 });
});

it('pins validated policy/sink configuration rather than reading a mutable caller object later', async () => {
  const original = vi.fn(async () => ({ send: vi.fn(async () => 'accepted' as const), close: vi.fn() }));
  const mutable = { requiredPolicyVersion: 'privacy-v1', sink: { open: original } };
  const runtime = createTelemetryRuntime(mutable); active.push(runtime);
  mutable.requiredPolicyVersion = 'private-policy'; mutable.sink.open = vi.fn();
  runtime.updateContext({ ...context, policyVersion: 'private-policy' }); await settle(); expect(original).not.toHaveBeenCalled();
  runtime.updateContext(context); await settle(); expect(original).toHaveBeenCalledWith(expect.objectContaining({ policyVersion: 'privacy-v1' }));
});

it('only accepts random UUIDv4 event references, never legacy node-bearing UUIDs', async () => {
  const { runtime, session } = fixture(); runtime.updateContext(context); await settle();
  runtime.bind().trackWithId('home_view', { source_page: 'home' }, '00000000-0000-1000-8000-000000000001'); await settle();
  expect(session.send).not.toHaveBeenCalled(); expect(runtime.snapshot().counters.invalid).toBe(1);
});

it('checks expiration at the actual send microtask and canonicalizes UUID casing for dedupe', async () => {
  let elapsed = 0; const { runtime, session } = fixture(undefined, () => elapsed); runtime.updateContext(context); await settle();
  const bound = runtime.bind(); bound.trackWithId('home_view', { source_page: 'home' }, id(1)); elapsed = 30001; await settle();
  expect(session.send).not.toHaveBeenCalled(); expect(runtime.snapshot().counters.expired).toBe(1);
  const lower = 'abcdefab-cdef-4abc-8def-abcdefabcdef';
  bound.trackWithId('home_view', { source_page: 'home' }, lower); bound.trackWithId('home_view', { source_page: 'home' }, lower.toUpperCase()); await settle();
  expect(session.send).toHaveBeenCalledTimes(1); expect(runtime.snapshot().counters.duplicate).toBe(1);
});

it('counts an aborted old-generation delivery as abandoned, including rejected promises', async () => {
  const { runtime, session } = fixture();
  vi.mocked(session.send).mockImplementation((_event, signal) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('abort', 'AbortError')))));
  runtime.updateContext(context); await settle(); runtime.bind().track('home_view', { source_page: 'home' }); await settle();
  runtime.updateContext({ ...context, consent: 'denied' }); await settle();
  expect(runtime.snapshot()).toMatchObject({ counters: { abandoned: 1, accepted: 0, failed: 0 } });
});

it('transfers cleanup ownership exactly once when context changes between initialization fulfillment and finally', async () => {
  for (const hops of [3, 4, 5, 6]) {
    let initialized!: (value: TelemetrySession) => void, cleaned!: () => void;
    const session: TelemetrySession = { send: vi.fn(async () => 'accepted' as const), close: vi.fn().mockImplementationOnce(() => new Promise<void>((resolve) => { cleaned = resolve; })) };
    const { runtime, sink } = fixture(() => new Promise((resolve) => { initialized = resolve; }));
    runtime.updateContext(context); await settle(); initialized(session);
    let remaining = hops;
    const change = () => { if (--remaining === 0) runtime.updateContext({ ...context, authEpoch: 2 }); else queueMicrotask(change); };
    queueMicrotask(change); await settle();
    expect(session.close).toHaveBeenCalledTimes(1); expect(sink.open).toHaveBeenCalledTimes(1);
    cleaned(); await settle(); expect(sink.open).toHaveBeenCalledTimes(2); runtime.close();
  }
});
