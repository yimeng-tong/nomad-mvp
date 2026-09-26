import type { Analytics } from '../auth/analytics';
import { getAuthSnapshot } from '../auth/session-context';
import { sanitizeAnalyticsEvent } from './dictionary';
import { deriveInputEventId, type InputJobEventName } from './event-id';
export { deriveInputEventId } from './event-id';
type InstantInputEventName = 'home_input_submit' | 'home_input_classified' | 'import_record_opened';
export type InputAnalyticsBinding = () => Analytics;

/** A closed-by-default producer port. Host SDK/consent integration installs a binding explicitly. */
export class InputTelemetry {
  private binding?: InputAnalyticsBinding;
  private registration = 0;
  private pending = 0;
  private counters = { invoked: 0, unavailable: 0, invalid: 0, stale: 0, overflow: 0, failed: 0 };
  private count(key: keyof InputTelemetry['counters']) { this.counters[key] = Math.min(1000000, this.counters[key] + 1); }
  private dispatch(send: () => unknown) {
    try {
      const outcome = send();
      // Analytics is typed as fire-and-forget, but injected adapters may return a Promise.
      if (outcome && (typeof outcome === 'object' || typeof outcome === 'function')) void Promise.resolve(outcome).catch(() => this.count('failed'));
      this.count('invoked');
    } catch { this.count('failed'); }
  }
  install(binding: InputAnalyticsBinding) {
    const version = ++this.registration; this.binding = binding;
    return () => { if (version === this.registration) { this.registration++; this.binding = undefined; } };
  }
  capture(valid: () => boolean = () => true) {
    const { epoch, activity, phase } = getAuthSnapshot(), registration = this.registration;
    let sink: Analytics | undefined;
    try { sink = this.binding?.(); } catch { /* Unavailable telemetry cannot change a business action. */ }
    const current = () => {
      const state = getAuthSnapshot();
      try { return phase === 'authenticated' && state.phase === 'authenticated' && state.epoch === epoch && state.activity === activity && registration === this.registration && valid(); }
      catch { return false; }
    };
    return {
      emit: (name: InstantInputEventName, props: unknown) => {
        if (!current()) { this.count('stale'); return; }
        if (!sink) { this.count('unavailable'); return; }
        const event = sanitizeAnalyticsEvent(name, props); if (!event) { this.count('invalid'); return; }
        this.dispatch(() => sink.track(event.name, Object.freeze({ ...event.props })));
      },
      emitJob: (name: InputJobEventName, jobId: string, attempt: number, props: unknown) => {
        if (!current()) { this.count('stale'); return; }
        let track: Analytics['trackWithId'];
        try { track = sink?.trackWithId; } catch { this.count('failed'); return; }
        if (!sink || typeof track !== 'function') { this.count('unavailable'); return; }
        const event = sanitizeAnalyticsEvent(name, props); if (!event) { this.count('invalid'); return; }
        if (this.pending >= 64) { this.count('overflow'); return; }
        const safeProps = Object.freeze({ ...event.props }), target = sink;
        this.pending++;
        deriveInputEventId(name, jobId, attempt).then((eventId) => {
          if (!current()) { this.count('stale'); return; }
          if (!eventId) { this.count('invalid'); return; }
          this.dispatch(() => track.call(target, name, safeProps, eventId));
        }).catch(() => { this.count('failed'); }).finally(() => { this.pending--; });
      },
    };
  }
  snapshot() { return { bindingInstalled: !!this.binding, pending: this.pending, counters: { ...this.counters }, providerQueryVerified: false as const }; }
}
export const inputTelemetry = new InputTelemetry();
