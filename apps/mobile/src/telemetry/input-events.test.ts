import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { commitIdentity, markChecking } from '../auth/session-context';
import { InputTelemetry, deriveInputEventId } from './input-events';
import type { Analytics } from '../auth/analytics';

const job = 'ing_00000000-0000-4000-8000-000000000001';
beforeEach(() => { vi.stubGlobal('crypto', webcrypto); commitIdentity({ ownerId: 'input-events-owner', sessionId: 'input-events-session' }); });
afterEach(() => vi.unstubAllGlobals());
const binding = () => ({ track: vi.fn(), trackWithId: vi.fn() });

it('derives stable domain-separated references without raw job or private context', async () => {
  const id = await deriveInputEventId('ingest_presented', job, 2);
  expect(id).toBe('87ac5d88-c6d1-859c-89e6-b81c77b36056');
  expect(await deriveInputEventId('ingest_presented', job.toUpperCase().replace('ING_', 'ing_'), 2)).toBe(id);
  expect(await deriveInputEventId('ingest_presented', job, 1)).not.toBe(id);
  expect(await deriveInputEventId('ingest_job_created', job, 1)).not.toBe(id);
  for (const [badJob, attempt] of [['private URL or phone', 1], [job + '\n', 1], [job, 0], [job, 10001], ['ing_00000000-0000-1000-8000-000000000001', 1]] as const) {
    expect(await deriveInputEventId('ingest_presented', badJob, attempt)).toBeNull();
  }
});

it('captures one binding before async work and rejects auth or registration changes', async () => {
  const events = new InputTelemetry(), first = binding(), second = binding();
  const factory = vi.fn(() => first); const uninstall = events.install(factory);
  const captured = events.capture(); expect(factory).toHaveBeenCalledTimes(1);
  captured.emit('home_input_classified', { classification: 'unknown', original_text: 'PRIVATE_SENTINEL' });
  expect(first.track).toHaveBeenCalledWith('home_input_classified', { classification: 'unknown' });
  events.install(() => second); uninstall();
  captured.emit('home_input_classified', { classification: 'unknown' });
  expect(first.track).toHaveBeenCalledTimes(1); expect(second.track).not.toHaveBeenCalled();
  const fresh = events.capture(); markChecking(false); fresh.emit('home_input_submit', {});
  expect(second.track).not.toHaveBeenCalled();
});

it('dedicated job events use the captured identity-aware binding and contain only allowed facts', async () => {
  const events = new InputTelemetry(), sink = binding(); events.install(() => sink);
  events.capture().emitJob('ingest_presented', job, 2, { attempt: 2, stored_count: 3, url: 'PRIVATE_SENTINEL', owner_id: 'private-owner' });
  await vi.waitFor(() => expect(sink.trackWithId).toHaveBeenCalledTimes(1));
  expect(sink.trackWithId).toHaveBeenCalledWith('ingest_presented', { attempt: 2, stored_count: 3 }, '87ac5d88-c6d1-859c-89e6-b81c77b36056');
  expect(JSON.stringify(sink.trackWithId.mock.calls)).not.toContain('PRIVATE_SENTINEL');
  expect(JSON.stringify(sink.trackWithId.mock.calls)).not.toContain(job);
});

it('late digest cannot use a new binding or changed authority, and binding failures never escape', async () => {
  let release!: (value: ArrayBuffer) => void;
  const digest = vi.fn(() => new Promise<ArrayBuffer>((resolve) => { release = resolve; }));
  vi.stubGlobal('crypto', { subtle: { digest }, randomUUID: () => '00000000-0000-4000-8000-000000000010' });
  const events = new InputTelemetry(), sink = binding(); events.install(() => sink);
  events.capture().emitJob('ingest_presented', job, 1, { attempt: 1, stored_count: 1 });
  commitIdentity({ ownerId: 'other-owner', sessionId: 'other-session' }); release(new ArrayBuffer(32));
  await vi.waitFor(() => expect(events.snapshot().pending).toBe(0)); expect(sink.trackWithId).not.toHaveBeenCalled();
  events.install((): Analytics => { throw new Error('PRIVATE_SENTINEL'); });
  expect(() => events.capture().emit('home_input_submit', {})).not.toThrow();
  expect(JSON.stringify(events.snapshot())).not.toContain('PRIVATE_SENTINEL');
});

it('bounds unresolved derivations and exposes unavailable binding without sending anything', () => {
  const events = new InputTelemetry(); events.capture().emit('home_input_submit', {});
  expect(events.snapshot()).toMatchObject({ bindingInstalled: false, counters: { unavailable: 1 }, providerQueryVerified: false });
  vi.stubGlobal('crypto', { subtle: { digest: () => new Promise(() => {}) } }); const sink = binding(); events.install(() => sink);
  const captured = events.capture();
  for (let n = 0; n < 1000; n++) captured.emitJob('ingest_presented', job, 1, { attempt: 1, stored_count: 1 });
  expect(events.snapshot()).toMatchObject({ pending: 64, counters: { overflow: 936 } }); expect(sink.trackWithId).not.toHaveBeenCalled();
});

it('contains rejected promises from injected fire-and-forget analytics adapters', async () => {
  const events = new InputTelemetry(), track = vi.fn(async () => { throw new Error('PRIVATE_ASYNC_FAILURE'); });
  const trackWithId = vi.fn(async () => { throw new Error('PRIVATE_ASYNC_FAILURE'); });
  events.install(() => ({ track: track as unknown as Analytics['track'], trackWithId: trackWithId as unknown as NonNullable<Analytics['trackWithId']> }));
  events.capture().emit('home_input_submit', {});
  events.capture().emitJob('ingest_presented', job, 1, { attempt: 1, stored_count: 2 });
  await vi.waitFor(() => expect(events.snapshot().counters.failed).toBe(2));
  expect(events.snapshot().counters.invoked).toBe(2);
  expect(JSON.stringify(events.snapshot())).not.toContain('PRIVATE_ASYNC_FAILURE');
});
