import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { commitIdentity, getAuthSnapshot, markChecking } from '../auth/session-context';
import { createTelemetryRuntime, type TelemetrySession } from '../telemetry/runtime';
import { inputTelemetry } from '../telemetry/input-events';
import { ImportDockController } from './dock-controller';
import { createJournalFixture } from './journal.test-support';
import type { HomeApiClient, IngestSnapshot } from './api';

const job = 'ing_00000000-0000-4000-8000-000000000001';
const initial = (): IngestSnapshot => ({ ingest_id: job, attempt: 1, state_version: 0, state: 'created', source_title: 'PRIVATE_TITLE', result: null,
  partial: false, retriable: false, updated_at: '2026-09-26T00:00:00Z', actions: { retry: false, view: false } });
const cleanup: Array<() => void> = [];
beforeEach(() => { vi.stubGlobal('crypto', webcrypto); commitIdentity({ ownerId: 'owner-input-fixture', sessionId: 'session-input-fixture' }); });
afterEach(() => { cleanup.splice(0).reverse().forEach((close) => close()); vi.unstubAllGlobals(); });
function fixture() {
  const session: TelemetrySession = { send: vi.fn(async () => 'accepted' as const), close: vi.fn() };
  const runtime = createTelemetryRuntime({ requiredPolicyVersion: 'fixture-policy', sink: { open: async () => session } });
  const context = { consent: 'granted' as const, policyVersion: 'fixture-policy', authEpoch: getAuthSnapshot().epoch, phase: 'authenticated' as const, host: 'web' as const };
  runtime.updateContext(context); cleanup.push(() => runtime.close()); cleanup.push(inputTelemetry.install(() => runtime.bind()));
  let snapshot = initial(); let operation = '';
  const api: HomeApiClient = {
    getCities: vi.fn(), getInspirations: vi.fn(), getCandidates: vi.fn(),
    parseInput: vi.fn<HomeApiClient['parseInput']>(async ({ text }) => ({ type: 'xhs_link', original_text: text, links: [{ url: 'https://xhslink.com/PRIVATE_LINK', position: 0 }], unrecognized: [{ text: 'PRIVATE_FRAGMENT', reason: 'not_a_link' }] })),
    startIngest: vi.fn<HomeApiClient['startIngest']>(async (request) => { operation = request.operation_id!; return { operation_id: operation, ingest_id: job, state: snapshot.state, sse_url: `/ingest/${job}/events`, disposition: 'created', snapshot }; }),
    getIngestSnapshot: vi.fn(async () => snapshot),
    getIngestCommand: vi.fn(async () => ({ operation_id: operation, ingest_id: job, state: snapshot.state, sse_url: `/ingest/${job}/events`, disposition: 'created' as const, snapshot })),
  };
  const controller = new ImportDockController(api, createJournalFixture()); controller.activate(); cleanup.push(() => controller.deactivate());
  return { api, controller, runtime, context, session, events: () => vi.mocked(session.send).mock.calls.map(([event]) => event),
    complete: () => { snapshot = { ...snapshot, state: 'done', state_version: 1, stored_count: 2, result: { inspiration_id: 'private-result', asset_count: 2, city_name: 'PRIVATE_CITY', locate_status: 'pending' }, actions: { retry: false, view: true } }; } };
}
it('emits input/classification and confirmed creation at their real boundaries without private fields', async () => {
  const f = fixture(); f.controller.setInput('https://xhslink.com/PRIVATE_LINK PRIVATE_FRAGMENT'); await f.controller.submit();
  await vi.waitFor(() => expect(f.events().map((e) => e.name)).toEqual(['home_input_submit', 'home_input_classified', 'ingest_job_created']));
  expect(f.events()[1].props).toEqual({ classification: 'xhs_link', link_count: 1, unrecognized_count: 1 });
  expect(f.events()[2].props).toEqual({ disposition: 'created', attempt: 1 });
  const data = JSON.stringify(f.events()); expect(data).not.toContain('PRIVATE'); expect(data).not.toContain('owner-input-fixture'); expect(data).not.toContain(job);
  const entry = f.controller.getSnapshot().entries[0]; await f.controller.recover(entry.id, false, true);
  expect(f.events().filter((e) => e.name === 'ingest_job_created')).toHaveLength(1);
  expect(f.api.startIngest).toHaveBeenCalledTimes(1);
});
it('does not call background completion a presentation, and a resumed layout keeps the same event identity', async () => {
  const f = fixture(); f.controller.setInput('private'); await f.controller.submit();
  await vi.waitFor(() => expect(f.controller.getSnapshot().entries[0].acceptance).toBe('accepted'));
  f.complete(); await f.controller.reconcile();
  expect(f.events().filter((e) => e.name === 'ingest_presented')).toHaveLength(0);
  const key = f.controller.getSnapshot().presenting!.key;
  f.controller.acknowledgePresentation(key); expect(f.events().filter((e) => e.name === 'ingest_presented')).toHaveLength(0);
  f.controller.setVisible(true); f.controller.acknowledgePresentation(key);
  await vi.waitFor(() => expect(f.events().filter((e) => e.name === 'ingest_presented')).toHaveLength(1));
  f.controller.setVisible(false); f.controller.setVisible(true); f.controller.acknowledgePresentation(key);
  await vi.waitFor(() => expect(f.runtime.snapshot().counters.duplicate).toBe(1));
  expect(f.events().filter((e) => e.name === 'ingest_presented')).toHaveLength(1);
});
it('captures consent before classification and never binds a late result to renewed permission', async () => {
  const f = fixture(); let finish!: (value: Awaited<ReturnType<HomeApiClient['parseInput']>>) => void;
  vi.mocked(f.api.parseInput).mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
  f.controller.setInput('private request'); const pending = f.controller.submit();
  await vi.waitFor(() => expect(f.events().some((e) => e.name === 'home_input_submit')).toBe(true));
  f.runtime.updateContext({ ...f.context, consent: 'denied' }); f.runtime.updateContext(f.context);
  finish({ type: 'trip_params', original_text: 'PRIVATE_TEXT', trip_params: { city: 'PRIVATE_CITY', days: 3 } }); await pending;
  expect(f.events().filter((e) => e.name === 'home_input_classified')).toHaveLength(0);
  expect(f.controller.getSnapshot().parsed?.type).toBe('trip_params');
});
it('auth uncertainty or an unavailable binding does not emit or alter the original operation', async () => {
  const f = fixture(); let finish!: (value: Awaited<ReturnType<HomeApiClient['parseInput']>>) => void;
  vi.mocked(f.api.parseInput).mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
  f.controller.setInput('private'); const pending = f.controller.submit(); markChecking(false);
  finish({ type: 'unknown', original_text: 'PRIVATE_TEXT' }); await pending;
  expect(f.events().filter((e) => e.name === 'home_input_classified')).toHaveLength(0); expect(f.api.startIngest).not.toHaveBeenCalled();
  expect(f.controller.getSnapshot().input).toBe('private');
});
