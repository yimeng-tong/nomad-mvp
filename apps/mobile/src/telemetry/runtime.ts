import type { Analytics, AuthEventName } from '../auth/analytics';
import { sanitizeAnalyticsEvent, telemetrySchemaVersion, type SafeTelemetryEvent } from './dictionary';

export type TelemetryContext = Readonly<{ consent: 'unknown' | 'granted' | 'denied'; policyVersion: string | null;
  authEpoch: number; phase: 'anonymous' | 'authenticated' | 'checking' | 'unavailable'; host: 'web' | 'android' | 'ios' }>;
export type TelemetryEnvelope = Readonly<{ schemaVersion: typeof telemetrySchemaVersion; eventId: string; timestamp: number;
  name: SafeTelemetryEvent['name']; stage: SafeTelemetryEvent['stage']; host: TelemetryContext['host']; props: Readonly<SafeTelemetryEvent['props']> }>;
/** Adapters must honor abort at the actual SDK call, disable automatic capture, and stop/clear their own buffers on close.
 * No native/provider proof follows from this JavaScript boundary alone. */
export type TelemetrySession = { send: (event: TelemetryEnvelope, signal: AbortSignal) => Promise<'accepted' | 'rejected'>; close: () => void | Promise<void> };
export type TelemetrySink = { open: (options: { host: TelemetryContext['host']; policyVersion: string; signal: AbortSignal }) => Promise<TelemetrySession> };
type BoundAnalytics = Analytics & { trackWithId: (event: AuthEventName, props: unknown, eventId: string) => void };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ttl = 30000, dedupeTtl = 300000, maxQueue = 64, maxSeen = 1024;

export function createTelemetryRuntime(options: { requiredPolicyVersion: string; sink: TelemetrySink; clock?: () => number }) {
  const requiredPolicyVersion = options.requiredPolicyVersion, openSink = options.sink.open.bind(options.sink);
  if (typeof requiredPolicyVersion !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,79}$/i.test(requiredPolicyVersion)) throw new Error('TELEMETRY_POLICY_VERSION_INVALID');
  const clock = options.clock ?? (() => performance.now());
  let context: TelemetryContext | undefined, generation = 0, closed = false, failed = false;
  let session: TelemetrySession | undefined, opening = false, sending = false, closing = false;
  let abort = new AbortController();
  let queue: Array<{ generation: number; event: TelemetryEnvelope; expires: number }> = [];
  const seen = new Map<string, number>();
  const counters = { accepted: 0, rejected: 0, invalid: 0, blocked: 0, duplicate: 0, overflow: 0, expired: 0, abandoned: 0, failed: 0 };
  const count = (key: keyof typeof counters, amount = 1) => { counters[key] = Math.min(1000000, counters[key] + amount); };
  const eligible = () => !closed && !failed && context?.consent === 'granted' && context.policyVersion === requiredPolicyVersion
    && ['anonymous', 'authenticated'].includes(context.phase);
  const current = (version: number) => version === generation && eligible() && !abort.signal.aborted;
  const abandonQueue = () => { count('abandoned', queue.length); queue = []; };
  const bounded = async <T>(work: Promise<T>, milliseconds: number): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try { return await Promise.race([work, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('TELEMETRY_TIMEOUT')), milliseconds); })]); }
    finally { clearTimeout(timer); }
  };
  const closeSession = async (value: TelemetrySession) => {
    closing = true;
    try { await bounded(Promise.resolve().then(() => value.close()), 1000); }
    catch { fault(); }
    finally { closing = false; reconcile(); }
  };
  const stop = () => {
    generation++; abort.abort(); abort = new AbortController(); abandonQueue(); seen.clear();
    const previous = session; session = undefined;
    if (previous) void closeSession(previous);
  };
  const fault = () => { if (failed) return; failed = true; count('failed'); stop(); };
  async function pump() {
    if (sending || !session || !eligible()) return;
    sending = true;
    try {
      while (queue.length && session && eligible()) {
        const row = queue.shift()!;
        if (!current(row.generation)) { count('abandoned'); continue; }
        if (row.expires <= clock()) { count('expired'); continue; }
        // Re-validate a fresh envelope immediately at the adapter boundary; never export raw call arguments.
        const safe = sanitizeAnalyticsEvent(row.event.name, row.event.props);
        if (!safe) { count('invalid'); continue; }
        const target = session, signal = abort.signal, expired = Symbol('expired'); let settled = false;
        const work = Promise.resolve().then<'accepted' | 'rejected' | typeof expired>(() => {
            if (!current(row.generation) || signal.aborted) return 'rejected' as const;
            if (row.expires <= clock()) return expired;
            return target.send(Object.freeze({ ...row.event, props: Object.freeze({ ...safe.props }) }), signal);
          });
        void work.then(() => { settled = true; }, () => { settled = true; });
        try {
          const result = await bounded(work, 1000);
          if (!current(row.generation)) { count('abandoned'); continue; }
          if (result === expired) count('expired'); else if (result === 'accepted') count('accepted'); else if (result === 'rejected') count('rejected'); else fault();
        } catch { const valid = current(row.generation); if (!valid) count('abandoned'); if (!settled || valid) fault(); }
      }
    } finally { sending = false; reconcile(); }
  }
  function reconcile() {
    if (!eligible() || opening || closing || sending) return;
    if (session) { if (queue.length) void pump(); return; }
    opening = true; const version = generation, signal = abort.signal, host = context!.host;
    let delivered: TelemetrySession | undefined, disposed = false, settled = false;
    const cleanupLate = (value: TelemetrySession) => { if (!disposed) { disposed = true; void closeSession(value); } };
    const work = Promise.resolve().then(() => {
      if (!current(version) || signal.aborted) throw new Error('TELEMETRY_CONTEXT_CHANGED');
      return openSink({ host, policyVersion: requiredPolicyVersion, signal });
    });
    // A timeout never licenses another initialize while the old operation may still complete.
    void work.then((value) => { settled = true; delivered = value; if (!current(version)) cleanupLate(value); }, () => { settled = true; });
    void bounded(work, 2000).then((value) => {
      if (!current(version)) { cleanupLate(value); return; }
      if (!value || typeof value.send !== 'function' || typeof value.close !== 'function') { fault(); cleanupLate(value); return; }
      session = value; disposed = true; // Cleanup ownership has transferred to stop().
    }).catch(() => { if (!settled || current(version)) fault(); }).finally(() => {
      opening = false;
      if (delivered && !current(version)) cleanupLate(delivered);
      reconcile();
    });
  }
  function enqueue(version: number, event: AuthEventName, props: unknown, eventId: string) {
    if (!current(version)) { count('blocked'); return; }
    const safe = sanitizeAnalyticsEvent(event, props), now = clock();
    if (!safe || typeof eventId !== 'string' || !uuid.test(eventId) || !Number.isFinite(now) || now < 0) { count('invalid'); return; }
    eventId = eventId.toLowerCase();
    for (const [key, expires] of seen) if (expires <= now) seen.delete(key);
    const key = `${safe.name}:${eventId}`;
    if (seen.has(key)) { count('duplicate'); return; }
    if (queue.length >= maxQueue || seen.size >= maxSeen) { count('overflow'); return; }
    const envelope: TelemetryEnvelope = Object.freeze({ schemaVersion: telemetrySchemaVersion, eventId, timestamp: Date.now(),
      name: safe.name, stage: safe.stage, host: context!.host, props: Object.freeze({ ...safe.props }) });
    seen.set(key, now + dedupeTtl); queue.push({ generation: version, event: envelope, expires: now + ttl }); reconcile();
  }
  return {
    updateContext(next: TelemetryContext) {
      if (closed) return;
      if (!Number.isSafeInteger(next.authEpoch) || next.authEpoch < 0 || !['unknown', 'granted', 'denied'].includes(next.consent)
        || !['anonymous', 'authenticated', 'checking', 'unavailable'].includes(next.phase) || !['web', 'android', 'ios'].includes(next.host)) {
        context = undefined; stop(); return;
      }
      if (context && ['consent', 'policyVersion', 'authEpoch', 'phase', 'host'].every((key) => context![key as keyof TelemetryContext] === next[key as keyof TelemetryContext])) return;
      stop(); context = Object.freeze({ consent: next.consent, policyVersion: next.policyVersion, authEpoch: next.authEpoch, phase: next.phase, host: next.host }); reconcile();
    },
    bind(): BoundAnalytics {
      const version = generation;
      return {
        track(event, props) { try { enqueue(version, event, props ?? {}, crypto.randomUUID()); } catch { count('invalid'); } },
        trackWithId(event, props, eventId) { try { enqueue(version, event, props, eventId); } catch { count('invalid'); } },
      };
    },
    snapshot: () => ({ state: closed ? 'closed' : failed ? 'failed' : !eligible() ? 'blocked' : opening ? 'initializing' : session ? 'ready' : 'closing',
      queued: queue.length, retainedIdentities: seen.size, counters: { ...counters }, providerQueryVerified: false as const }),
    close() { if (closed) return; closed = true; stop(); },
  };
}
