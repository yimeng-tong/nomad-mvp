import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ImportDockController } from './dock-controller';
import { commitIdentity, markChecking } from '../auth/session-context';
import { AuthApiError } from '../auth/api';
import type { HomeApiClient, IngestAcceptedResponse, IngestSnapshot, IngestXhsRequest } from './api';
import { createJournalFixture } from './journal.test-support';
import { JournalError } from './operation-journal';

const snapshot = (id: string, state: IngestSnapshot['state'] = 'created', version = 0): IngestSnapshot => ({
  ingest_id: id, attempt: 1, state_version: version, state, source_title: null, partial: false,
  retriable: state === 'failed', result: null, updated_at: '2026-09-19T00:00:00Z', actions: { retry: state === 'failed', view: false },
});
const ack = (operationId: string, id = operationId): IngestAcceptedResponse => ({
  operation_id: operationId, ingest_id: id, state: 'created', sse_url: `/ingest/${id}/events`, disposition: 'created', snapshot: snapshot(id),
});
function fixture() {
  const api: HomeApiClient = {
    getCities: vi.fn(), getInspirations: vi.fn(), getCandidates: vi.fn(),
    parseInput: vi.fn(async ({ text }: { text: string }) => {
      let offset = 0;
      const links = text.split(/\s+/).map((url) => { const position = text.indexOf(url, offset); offset = position + url.length; return { url, position }; });
      return { type: 'xhs_link' as const, original_text: text, links, link_occurrences: links, unrecognized: [] };
    }),
    startIngest: vi.fn(async (request: IngestXhsRequest) => ack(request.operation_id!)),
    getIngestCommand: vi.fn(), getIngestSnapshot: vi.fn(async (id) => snapshot(id)), retryIngest: vi.fn(),
  };
  const journal = createJournalFixture();
  const controller = new ImportDockController(api, journal); controller.activate(); return { api, controller, journal };
}
const controllers: ImportDockController[] = [];
beforeEach(() => { commitIdentity({ ownerId: 'owner-a', sessionId: 'session-a' }); });
afterEach(() => { controllers.splice(0).forEach((controller) => controller.deactivate()); vi.useRealTimers(); });

it('submits each batch in order while accepting a fresh editable draft and never counts pending as accepted', async () => {
  const { api, controller } = fixture(); controllers.push(controller);
  let release!: (value: IngestAcceptedResponse) => void;
  vi.mocked(api.startIngest).mockImplementationOnce(() => new Promise((resolve) => { release = resolve; }));
  controller.setInput('https://xhslink.com/a https://xhslink.com/b'); await controller.submit();
  controller.setInput('another draft');
  expect(api.startIngest).toHaveBeenCalledTimes(1);
  expect(controller.getSnapshot().entries.every((entry) => entry.acceptance === 'pending')).toBe(true);
  const first = vi.mocked(api.startIngest).mock.calls[0][0]; release(ack(first.operation_id!));
  await vi.waitFor(() => expect(api.startIngest).toHaveBeenCalledTimes(2));
  expect(vi.mocked(api.startIngest).mock.calls.map(([request]) => request.url)).toEqual(['https://xhslink.com/a', 'https://xhslink.com/b']);
  expect(controller.getSnapshot().input).toBe('another draft');
});

it('recovers an unknown acceptance using the original command without posting a second import', async () => {
  const { api, controller } = fixture(); controllers.push(controller);
  vi.mocked(api.startIngest).mockRejectedValueOnce(new TypeError('network'));
  controller.setInput('https://xhslink.com/a'); await controller.submit();
  await vi.waitFor(() => expect(controller.getSnapshot().entries[0].acceptance).toBe('unknown'));
  const operationId = controller.getSnapshot().entries[0].id;
  vi.mocked(api.getIngestCommand!).mockResolvedValue(ack(operationId, 'existing-job'));
  await controller.recover(operationId);
  expect(api.getIngestCommand).toHaveBeenCalledWith(operationId);
  expect(api.startIngest).toHaveBeenCalledTimes(1);
  expect(controller.getSnapshot().entries[0].jobId).toBe('existing-job');
});

it('a confirmed deletion clears the job and local receipt without erasing an unrelated draft', async () => {
  const { api, controller, journal } = fixture(); controllers.push(controller);
  const jobId = `ing_${crypto.randomUUID()}`;
  vi.mocked(api.startIngest).mockImplementation(async (request) => ack(request.operation_id!, jobId));
  const inputId = 'a'.repeat(64);
  controller.adoptInput({ id: inputId, text: 'https://xhslink.com/a', ownerId: 'owner-a', channel: null, clickId: null, expiresAt: Date.now() + 100000 });
  await controller.submit();
  await vi.waitFor(() => expect(controller.getSnapshot().entries[0]?.jobId).toBe(jobId));
  expect(await journal.claimed(inputId)).toBe(true);
  controller.setInput('保留的其他旅行想法');
  expect(await controller.forgetDeletedJob(jobId)).toBe(true);
  expect(controller.getSnapshot().entries).toHaveLength(0);
  expect(controller.getSnapshot().input).toBe('保留的其他旅行想法');
  expect(await journal.list({ ownerId: 'owner-a', valid: () => true })).toHaveLength(0);
  expect(await journal.claimed(inputId)).toBe(false);
});

it('a neutral missing job on reconciliation removes its stale local receipt', async () => {
  const { api, controller, journal } = fixture(); controllers.push(controller);
  const jobId = `ing_${crypto.randomUUID()}`;
  vi.mocked(api.startIngest).mockImplementation(async (request) => ack(request.operation_id!, jobId));
  controller.setInput('https://xhslink.com/a'); await controller.submit();
  await vi.waitFor(() => expect(controller.getSnapshot().entries[0]?.jobId).toBe(jobId));
  vi.mocked(api.getIngestSnapshot!).mockRejectedValue(new AuthApiError('not found', { status: 404, code: 'INGEST_JOB_NOT_FOUND' }));
  await controller.reconcile();
  expect(controller.getSnapshot().entries).toHaveLength(0);
  expect(await journal.list({ ownerId: 'owner-a', valid: () => true })).toHaveLength(0);
});

it('disposes the watched job and ignores a frame queued before confirmed deletion', async () => {
  const { api, controller } = fixture(); controllers.push(controller);
  const jobId = `ing_${crypto.randomUUID()}`, stop = vi.fn();
  let lateFrame!: (value: IngestSnapshot) => boolean, lateError!: () => void;
  vi.mocked(api.startIngest).mockImplementation(async (request) => ack(request.operation_id!, jobId));
  api.watchIngest = vi.fn((_id: string, receive: (value: IngestSnapshot) => boolean, failed: () => void) => {
    lateFrame = receive; lateError = failed; return stop;
  });
  controller.setVisible(true);
  controller.setInput('https://xhslink.com/a'); await controller.submit();
  await vi.waitFor(() => expect(api.watchIngest).toHaveBeenCalledTimes(1));
  expect(await controller.forgetDeletedJob(jobId)).toBe(true);
  expect(stop).toHaveBeenCalledTimes(1);
  expect(lateFrame(snapshot(jobId, 'fetching', 2))).toBe(false);
  lateError();
  expect(controller.getSnapshot().entries).toHaveLength(0);
  expect(controller.getSnapshot().presenting).toBeNull();
});

it('retains an uncertain retry identity and reconciles the same operation before another request', async () => {
  const { api, controller } = fixture(); controllers.push(controller);
  controller.setInput('https://xhslink.com/a'); await controller.submit();
  await vi.waitFor(() => expect(controller.getSnapshot().entries[0].jobId).toBeTruthy());
  const entry = controller.getSnapshot().entries[0];
  vi.mocked(api.getIngestSnapshot!).mockResolvedValue(snapshot(entry.jobId!, 'failed', 3));
  await controller.reconcile();
  vi.mocked(api.retryIngest!).mockRejectedValueOnce(new TypeError('network'));
  await controller.retry(entry.id);
  const request = vi.mocked(api.retryIngest!).mock.calls[0][1];
  vi.mocked(api.getIngestCommand!).mockResolvedValue({ ...ack(request.operation_id, entry.jobId), disposition: 'retried', snapshot: { ...snapshot(entry.jobId!, 'created', 4), attempt: 2 } });
  await controller.recover(entry.id);
  expect(api.getIngestCommand).toHaveBeenCalledWith(request.operation_id);
  expect(api.retryIngest).toHaveBeenCalledTimes(1);
  expect(controller.getSnapshot().entries[0].snapshot?.attempt).toBe(2);
});

it('pauses on auth uncertainty, discards late replies, and erases drafts on changed identity', async () => {
  const { api, controller } = fixture(); controllers.push(controller);
  let release!: (value: IngestAcceptedResponse) => void;
  vi.mocked(api.startIngest).mockImplementationOnce(() => new Promise((resolve) => { release = resolve; }));
  controller.setInput('https://xhslink.com/a'); await controller.submit();
  const id = controller.getSnapshot().entries[0].id;
  controller.setInput('private draft'); markChecking(false); release(ack(id));
  await vi.waitFor(() => expect(controller.getSnapshot().entries[0].acceptance).toBe('unknown'));
  expect(controller.getSnapshot().input).toBe('private draft');
  commitIdentity({ ownerId: 'owner-b', sessionId: 'session-b' });
  expect(controller.getSnapshot().entries).toHaveLength(0);
  expect(controller.getSnapshot().input).toBe('');
});

it('a known capability rejection is not an accepted or unknown job', async () => {
  const { api, controller } = fixture(); controllers.push(controller);
  vi.mocked(api.startIngest).mockRejectedValue(new AuthApiError('Unavailable', { status: 503, code: 'INGEST_CAPABILITY_UNAVAILABLE' }));
  controller.setInput('https://xhslink.com/a'); await controller.submit();
  await vi.waitFor(() => expect(controller.getSnapshot().entries[0].acceptance).toBe('rejected'));
  expect(controller.getSnapshot().entries[0].jobId).toBeUndefined();
  controller.setInput('保留新草稿'); await controller.restoreEntry(controller.getSnapshot().entries[0].id);
  expect(controller.getSnapshot().input).toBe('保留新草稿\nhttps://xhslink.com/a');
  controller.setInput('https://xhslink.com/abc'); await controller.restoreEntry(controller.getSnapshot().entries[0].id);
  expect(controller.getSnapshot().input).toBe('https://xhslink.com/abc\nhttps://xhslink.com/a');
  expect(api.startIngest).toHaveBeenCalledTimes(1);
});

it('uses one stream at a time, disposes it off Home, and bounds failed-stream recovery', async () => {
  const { api, controller } = fixture(); controllers.push(controller);
  const stop = vi.fn(); let fail!: () => void;
  api.watchIngest = vi.fn((_id: string, _snapshot: (value: IngestSnapshot) => boolean, onError: () => void) => { fail = onError; return stop; });
  controller.setInput('https://xhslink.com/a https://xhslink.com/b'); await controller.submit();
  await vi.waitFor(() => expect(controller.getSnapshot().entries.every((entry) => entry.acceptance === 'accepted')).toBe(true));
  controller.setVisible(true); await controller.reconcile();
  await vi.waitFor(() => expect(api.watchIngest).toHaveBeenCalledTimes(1));
  fail(); expect(stop).toHaveBeenCalledTimes(1);
  await controller.reconcile(); expect(api.watchIngest).toHaveBeenCalledTimes(1);
  controller.setVisible(false); expect(controller.getSnapshot().visible).toBe(false);
  expect(controller.getSnapshot().entries).toHaveLength(2);
});

it('an earlier failed event cannot stop a stream after a newer retry snapshot', async () => {
  const { api, controller } = fixture(); controllers.push(controller);
  let event!: (value: IngestSnapshot) => boolean;
  api.watchIngest = vi.fn((_id: string, receive: (value: IngestSnapshot) => boolean) => { event = receive; return vi.fn(); });
  controller.setInput('https://xhslink.com/a'); await controller.submit();
  await vi.waitFor(() => expect(controller.getSnapshot().entries[0].jobId).toBeTruthy());
  const id = controller.getSnapshot().entries[0].jobId!;
  vi.mocked(api.getIngestSnapshot!).mockResolvedValue({ ...snapshot(id, 'fetching', 6), attempt: 2 });
  controller.setVisible(true); await controller.reconcile();
  await vi.waitFor(() => expect(event).toBeTypeOf('function'));
  expect(event(snapshot(id, 'failed', 5))).toBe(false);
  expect(controller.getSnapshot().entries[0].snapshot).toMatchObject({ attempt: 2, state: 'fetching', state_version: 6 });
});

it('clears an uncertain retry after an authoritative rejection so the current action is usable again', async () => {
  const { api, controller } = fixture(); controllers.push(controller);
  controller.setInput('https://xhslink.com/a'); await controller.submit();
  await vi.waitFor(() => expect(controller.getSnapshot().entries[0].jobId).toBeTruthy());
  const entry = controller.getSnapshot().entries[0];
  vi.mocked(api.getIngestSnapshot!).mockResolvedValue(snapshot(entry.jobId!, 'failed', 3));
  await controller.reconcile();
  vi.mocked(api.retryIngest!).mockRejectedValueOnce(new TypeError('network')).mockRejectedValueOnce(new AuthApiError('state changed', { status: 409, code: 'INGEST_STATE_CHANGED' }));
  await controller.retry(entry.id);
  vi.mocked(api.getIngestCommand!).mockRejectedValue(new AuthApiError('absent', { status: 404 }));
  await controller.recover(entry.id);
  expect(controller.getSnapshot().uncertainRetries).toEqual([]);
  vi.mocked(api.retryIngest!).mockImplementation(async (_id, request) => ({ ...ack(request.operation_id, entry.jobId), disposition: 'retried', snapshot: { ...snapshot(entry.jobId!, 'created', 4), attempt: 2 } }));
  await controller.retry(entry.id);
  expect(api.retryIngest).toHaveBeenCalledTimes(3);
});

it('completed historical entries do not permanently block new links or ordinary travel input', async () => {
  const { api, controller } = fixture(); controllers.push(controller);
  vi.mocked(api.startIngest).mockImplementation(async (request) => {
    const receipt = ack(request.operation_id!);
    return { ...receipt, state: 'done', disposition: 'reused', snapshot: { ...receipt.snapshot, state: 'done', stored_count: 1,
      result: { inspiration_id: receipt.ingest_id, asset_count: 0, city_name: null, locate_status: 'pending' }, actions: { retry: false, view: true } } };
  });
  for (let batch = 0; batch < 5; batch++) {
    controller.setInput(Array.from({ length: 20 }, (_, index) => `https://xhslink.com/b${batch}a${index}`).join(' ')); await controller.submit();
    await vi.waitFor(() => expect(controller.getSnapshot().entries.every((entry) => entry.acceptance === 'accepted')).toBe(true));
  }
  expect(controller.getSnapshot().entries).toHaveLength(100);
  controller.setInput('https://xhslink.com/more'); await controller.submit();
  await vi.waitFor(() => expect(api.startIngest).toHaveBeenCalledTimes(101));
  vi.mocked(api.parseInput).mockResolvedValue({ type: 'unknown', original_text: '看看厦门' });
  controller.setInput('看看厦门'); await controller.submit();
  expect(controller.getSnapshot().parsed?.original_text).toBe('看看厦门');
});

it('pastes only by explicit action without submitting and rejects a read made stale by draft edits or auth activity', async () => {
  const { api, controller } = fixture(); controllers.push(controller);
  const read = vi.fn(async () => ({ kind: 'text' as const, value: '厦门 3天' }));
  controller.setInput('先保留'); expect(read).not.toHaveBeenCalled();
  await controller.paste(read); expect(controller.getSnapshot().input).toBe('先保留\n厦门 3天');
  expect(api.startIngest).not.toHaveBeenCalled(); expect(api.parseInput).not.toHaveBeenCalled();
  let resolve!: (value: { kind: 'text'; value: string }) => void;
  const pending = controller.paste(() => new Promise((done) => { resolve = done; }));
  controller.setInput('后来输入'); resolve({ kind: 'text', value: '旧的剪贴板' }); await pending;
  expect(controller.getSnapshot().input).toBe('后来输入');
  const previous = controller.paste(() => new Promise((done) => { resolve = done; }));
  markChecking(false); resolve({ kind: 'text', value: '不应进入恢复后的界面' }); await previous;
  commitIdentity({ ownerId: 'owner-a', sessionId: 'session-a' });
  expect(controller.getSnapshot().input).toBe('后来输入');
});

it('does not dispatch or clear the draft when durable preparation fails', async () => {
  const { api, controller, journal } = fixture(); controllers.push(controller);
  vi.spyOn(journal, 'prepare').mockRejectedValue(new JournalError('JOURNAL_UNAVAILABLE'));
  controller.setInput('https://xhslink.com/a'); await controller.submit();
  expect(api.startIngest).not.toHaveBeenCalled(); expect(controller.getSnapshot().input).toBe('https://xhslink.com/a');
  expect(controller.getSnapshot().entries).toHaveLength(0);
});
it('rebuilds the original entry and reads its receipt after restart without dispatching again', async () => {
  const { api, controller, journal } = fixture(); controllers.push(controller);
  vi.mocked(api.startIngest).mockRejectedValueOnce(new TypeError('lost acknowledgment'));
  controller.setInput('https://xhslink.com/a'); await controller.submit();
  await vi.waitFor(() => expect(controller.getSnapshot().entries[0].acceptance).toBe('unknown'));
  const entry = controller.getSnapshot().entries[0]; controller.deactivate();
  vi.mocked(api.getIngestCommand!).mockResolvedValue(ack(entry.id, 'retained-job'));
  const restored = new ImportDockController(api, journal); controllers.push(restored); restored.activate(); await restored.restore();
  await vi.waitFor(() => expect(restored.getSnapshot().entries[0].jobId).toBe('retained-job'));
  expect(api.getIngestCommand).toHaveBeenCalledWith(entry.id); expect(api.startIngest).toHaveBeenCalledTimes(1);
});
it('requires explicit continuation after an absent receipt and resends the stored original payload and operation', async () => {
  const { api, controller, journal } = fixture(); controllers.push(controller);
  vi.mocked(api.startIngest).mockRejectedValueOnce(new TypeError('lost acknowledgment'));
  controller.setInput('https://xhslink.com/a'); await controller.submit();
  await vi.waitFor(() => expect(controller.getSnapshot().entries[0].acceptance).toBe('unknown'));
  const entry = controller.getSnapshot().entries[0]; controller.deactivate();
  vi.mocked(api.getIngestCommand!).mockRejectedValue(new AuthApiError('absent', { status: 404 }));
  const restored = new ImportDockController(api, journal); controllers.push(restored); restored.activate(); await restored.restore();
  await vi.waitFor(() => expect(restored.getSnapshot().busy).toHaveLength(0));
  expect(api.startIngest).toHaveBeenCalledTimes(1);
  await restored.recover(entry.id);
  expect(api.startIngest).toHaveBeenLastCalledWith({ url: 'https://xhslink.com/a', operation_id: entry.id });
  expect(api.startIngest).toHaveBeenCalledTimes(2);
});
it('never restores another owner and does not dispatch an old-owner confirmation after persistence resolves late', async () => {
  const { api, controller, journal } = fixture(); controllers.push(controller);
  const prepare = journal.prepare.bind(journal); let release!: () => void;
  vi.spyOn(journal, 'prepare').mockImplementation(async (...args) => { await new Promise<void>((resolve) => { release = resolve; }); return prepare(...args); });
  controller.setInput('https://xhslink.com/a'); const pending = controller.submit();
  await vi.waitFor(() => expect(release).toBeTypeOf('function'));
  commitIdentity({ ownerId: 'owner-b', sessionId: 'session-b' }); release(); await pending;
  expect(api.startIngest).not.toHaveBeenCalled();
  const other = new ImportDockController(api, journal); controllers.push(other); other.activate(); await other.restore();
  expect(other.getSnapshot().entries).toHaveLength(0);
});
it('reuses the durable deep-link confirmation instead of creating another start operation', async () => {
  const { api, controller, journal } = fixture(); controllers.push(controller);
  vi.mocked(api.getIngestCommand!).mockImplementation(async (id) => ack(id));
  const incoming = { id: 'a'.repeat(64), text: 'https://xhslink.com/a', ownerId: 'owner-a', channel: null, clickId: null, expiresAt: Date.now() + 100000 };
  controller.adoptInput(incoming); await controller.submit();
  await vi.waitFor(() => expect(controller.getSnapshot().entries[0].acceptance).toBe('accepted'));
  controller.deactivate();
  const restarted = new ImportDockController(api, journal); controllers.push(restarted); restarted.activate(); await restarted.restore();
  restarted.adoptInput(incoming); await restarted.submit();
  expect(api.startIngest).toHaveBeenCalledTimes(1);
  expect((await journal.list({ ownerId: 'owner-a', valid: () => true })).filter((row) => row.kind === 'start')).toHaveLength(1);
});
it('keeps authoritative acceptance even if the local receipt update fails', async () => {
  const { api, controller, journal } = fixture(); controllers.push(controller);
  vi.spyOn(journal, 'mark').mockRejectedValue(new JournalError('JOURNAL_UNAVAILABLE'));
  controller.setInput('https://xhslink.com/a'); await controller.submit();
  await vi.waitFor(() => expect(controller.getSnapshot().entries[0].acceptance).toBe('accepted'));
  expect(api.startIngest).toHaveBeenCalledTimes(1);
});
it('persists completion observation only after ten visible seconds and does not present it again after restart', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
  let time = 0; const timer = vi.spyOn(performance, 'now').mockImplementation(() => time);
  const { api, controller, journal } = fixture(); controllers.push(controller);
  const note = vi.spyOn(journal, 'noteDone');
  const completed = (operationId: string): IngestAcceptedResponse => ({ ...ack(operationId), state: 'done', snapshot: { ...snapshot(operationId, 'done', 4), stored_count: 1,
    result: { inspiration_id: 'saved', asset_count: 1, locate_status: 'pending', city_name: null }, actions: { retry: false, view: true } } });
  vi.mocked(api.startIngest).mockImplementation(async (request) => completed(request.operation_id!));
  vi.mocked(api.getIngestCommand!).mockImplementation(async (id) => completed(id));
  controller.setVisible(true); controller.setInput('https://xhslink.com/a'); await controller.submit();
  await vi.waitFor(() => expect(controller.getSnapshot().presenting).not.toBeNull());
  const key = controller.getSnapshot().presenting!.key; controller.acknowledgePresentation(key);
  time = 4000; await vi.advanceTimersByTimeAsync(250); expect(controller.getSnapshot().presenting?.remainingMs).toBe(6000);
  controller.setVisible(false); time = 20000; await vi.advanceTimersByTimeAsync(16000);
  expect(controller.getSnapshot().presenting?.remainingMs).toBe(6000); expect(note).not.toHaveBeenCalled();
  controller.setVisible(true); controller.acknowledgePresentation(key);
  time = 25999; await vi.advanceTimersByTimeAsync(250); expect(note).not.toHaveBeenCalled();
  time = 26000; await vi.advanceTimersByTimeAsync(250); expect(note).toHaveBeenCalledTimes(1);
  controller.deactivate();
  const restored = new ImportDockController(api, journal); controllers.push(restored); restored.activate(); await restored.restore();
  await vi.waitFor(() => expect(restored.getSnapshot().entries[0].acceptance).toBe('accepted'));
  expect(restored.getSnapshot().presenting).toBeNull(); expect(api.startIngest).toHaveBeenCalledTimes(1);
  timer.mockRestore();
});
it('freezes every adopted input binding before parsing while later edits remain a separate draft', async () => {
  const { api, controller, journal } = fixture(); controllers.push(controller);
  const incoming = (id: string, text: string) => ({ id: id.repeat(64), text, ownerId: 'owner-a', channel: null, clickId: null, expiresAt: Date.now() + 100000 });
  controller.adoptInput(incoming('a', 'https://xhslink.com/a'));
  controller.adoptInput(incoming('b', 'https://xhslink.com/b'));
  let release!: (value: Awaited<ReturnType<HomeApiClient['parseInput']>>) => void;
  vi.mocked(api.parseInput).mockImplementationOnce(() => new Promise((resolve) => { release = resolve; }));
  const pending = controller.submit(); controller.setInput('下一份草稿');
  release({ type: 'xhs_link', original_text: '', links: [{ url: 'https://xhslink.com/a', position: 0 }, { url: 'https://xhslink.com/b', position: 24 }], link_occurrences: [{ url: 'https://xhslink.com/a', position: 0 }, { url: 'https://xhslink.com/b', position: 24 }] });
  await pending; await vi.waitFor(() => expect(api.startIngest).toHaveBeenCalledTimes(2));
  expect(await journal.claimed('a'.repeat(64))).toBe(true); expect(await journal.claimed('b'.repeat(64))).toBe(true);
  expect(controller.getSnapshot().input).toBe('下一份草稿');
});
it('can retry a failed forced journal refresh and preserves unaffected input spans when another share is removed', async () => {
  const { controller, journal, api } = fixture(); controllers.push(controller); await controller.restore();
  const list = vi.spyOn(journal, 'list').mockRejectedValueOnce(new JournalError('JOURNAL_UNAVAILABLE'));
  await controller.restore(true); expect(controller.getSnapshot().journalError).toBe(true);
  await controller.restore(); expect(controller.getSnapshot().journalError).toBe(false); expect(list).toHaveBeenCalledTimes(2);
  const incoming = (id: string, text: string) => ({ id: id.repeat(64), text, ownerId: 'owner-a', channel: null, clickId: null, expiresAt: Date.now() + 100000 });
  controller.adoptInput(incoming('a', 'https://xhslink.com/a')); controller.adoptInput(incoming('b', 'https://xhslink.com/b'));
  controller.setInput('https://xhslink.com/b'); await controller.submit();
  await vi.waitFor(() => expect(api.startIngest).toHaveBeenCalledTimes(1));
  expect(await journal.claimed('a'.repeat(64))).toBe(false); expect(await journal.claimed('b'.repeat(64))).toBe(true);
});
it('allows new input after expired, receipt-absent records are recovered without pretending they were cancelled', async () => {
  const { controller, journal, api } = fixture(); controllers.push(controller); await controller.restore();
  const scope = { ownerId: 'owner-a', valid: () => true };
  await journal.prepare(scope, Array.from({ length: 100 }, (_, index) => ({ url: `https://xhslink.com/old${index}` })));
  const list = journal.list.bind(journal);
  vi.spyOn(journal, 'list').mockImplementation(async (owner) => (await list(owner)).map((row) => ({ ...row, payloadExpiresAt: Date.now() - 1 })));
  vi.mocked(api.getIngestCommand!).mockRejectedValue(new AuthApiError('absent', { status: 404 }));
  await controller.restore(true);
  await vi.waitFor(() => expect(controller.getSnapshot().entries.every((entry) => entry.errorCode === 'INPUT_RECOVERY_EXPIRED')).toBe(true));
  expect(api.startIngest).not.toHaveBeenCalled();
  controller.setInput('https://xhslink.com/new'); await controller.submit();
  await vi.waitFor(() => expect(api.startIngest).toHaveBeenCalledTimes(1));
  expect(controller.getSnapshot().entries.filter((entry) => entry.acceptance === 'unknown')).toHaveLength(100);
});
it('keeps submitted bindings through delayed unknown classification and explicit link confirmation', async () => {
  const { api, controller, journal } = fixture(); controllers.push(controller);
  const text = '来自分享的原内容';
  controller.adoptInput({ id: 'd'.repeat(64), text, ownerId: 'owner-a', channel: null, clickId: null, expiresAt: Date.now() + 100000 });
  let release!: (value: Awaited<ReturnType<HomeApiClient['parseInput']>>) => void;
  vi.mocked(api.parseInput).mockImplementationOnce(() => new Promise((resolve) => { release = resolve; }));
  const pending = controller.submit(); controller.setInput('另一个草稿'); release({ type: 'unknown', original_text: text }); await pending;
  await controller.confirmUnknownLink(text); await vi.waitFor(() => expect(api.startIngest).toHaveBeenCalledTimes(1));
  expect(await journal.claimed('d'.repeat(64))).toBe(true); expect(controller.getSnapshot().input).toBe('另一个草稿');
});
it('does not preserve an external identity when its URL is materially edited into a prefix-related URL', async () => {
  const { controller, journal, api } = fixture(); controllers.push(controller);
  controller.adoptInput({ id: 'e'.repeat(64), text: 'https://xhslink.com/a', ownerId: 'owner-a', channel: null, clickId: null, expiresAt: Date.now() + 100000 });
  controller.setInput('https://xhslink.com/abc'); await controller.submit(); await vi.waitFor(() => expect(api.startIngest).toHaveBeenCalledTimes(1));
  expect(await journal.claimed('e'.repeat(64))).toBe(false);
});
it('does not mistake a rate-limited replay for proof that the earlier unknown retry never committed', async () => {
  const { controller, api, journal } = fixture(); controllers.push(controller);
  controller.setInput('https://xhslink.com/a'); await controller.submit();
  await vi.waitFor(() => expect(controller.getSnapshot().entries[0].acceptance).toBe('accepted'));
  const entry = controller.getSnapshot().entries[0];
  vi.mocked(api.getIngestSnapshot!).mockResolvedValue(snapshot(entry.jobId!, 'failed', 3)); await controller.reconcile();
  vi.mocked(api.retryIngest!).mockRejectedValueOnce(new TypeError('unknown')).mockRejectedValueOnce(new AuthApiError('rate limited', { status: 429 }));
  await controller.retry(entry.id);
  vi.mocked(api.getIngestCommand!).mockRejectedValueOnce(new AuthApiError('absent', { status: 404 })); await controller.recover(entry.id);
  expect(controller.getSnapshot().uncertainRetries).toEqual([entry.id]);
  const operation = vi.mocked(api.retryIngest!).mock.calls[0][1].operation_id;
  expect(vi.mocked(api.retryIngest!).mock.calls[1][1].operation_id).toBe(operation);
  vi.mocked(api.getIngestCommand!).mockResolvedValue({ ...ack(operation, entry.jobId), disposition: 'retried', snapshot: { ...snapshot(entry.jobId!, 'created', 4), attempt: 2 } });
  await controller.recover(entry.id); expect(controller.getSnapshot().uncertainRetries).toEqual([]);
  expect((await journal.list({ ownerId: 'owner-a', valid: () => true })).filter((row) => row.kind === 'retry')).toHaveLength(1);
});
it('claims only contributing shares while preserving duplicate occurrences of the same recognized URL', async () => {
  const { controller, journal, api } = fixture(); controllers.push(controller);
  const incoming = (id: string, text: string) => ({ id: id.repeat(64), text, ownerId: 'owner-a', channel: null, clickId: null, expiresAt: Date.now() + 100000 });
  controller.adoptInput(incoming('a', 'https://xhslink.com/a')); controller.adoptInput(incoming('b', '未识别的想法'));
  vi.mocked(api.parseInput).mockResolvedValueOnce({ type: 'xhs_link', original_text: '', links: [{ url: 'https://xhslink.com/a', position: 0 }], link_occurrences: [{ url: 'https://xhslink.com/a', position: 0 }], unrecognized: [{ text: '未识别的想法', reason: 'not_a_link' }] });
  await controller.submit(); await vi.waitFor(() => expect(api.startIngest).toHaveBeenCalledTimes(1));
  expect(await journal.claimed('a'.repeat(64))).toBe(true); expect(await journal.claimed('b'.repeat(64))).toBe(false);
  controller.adoptInput(incoming('c', 'https://xhslink.com/c')); controller.adoptInput(incoming('d', 'https://xhslink.com/c'));
  vi.mocked(api.parseInput).mockResolvedValueOnce({ type: 'xhs_link', original_text: '', links: [{ url: 'https://xhslink.com/c', position: 0 }], link_occurrences: [{ url: 'https://xhslink.com/c', position: 0 }, { url: 'https://xhslink.com/c', position: 22 }], duplicate_count: 1 });
  await controller.submit(); await vi.waitFor(() => expect(api.startIngest).toHaveBeenCalledTimes(2));
  expect(await journal.claimed('c'.repeat(64))).toBe(true); expect(await journal.claimed('d'.repeat(64))).toBe(true);
});


it('subscribes immediately after a visible acceptance without waiting for the polling interval', async () => {
  const { api, controller } = fixture(); controllers.push(controller);
  api.watchIngest = vi.fn(() => vi.fn());
  await controller.restore(); controller.setVisible(true); await controller.reconcile();
  controller.setInput('https://xhslink.com/immediate'); await controller.submit();
  await vi.waitFor(() => expect(controller.getSnapshot().entries[0].acceptance).toBe('accepted'));
  expect(api.watchIngest).toHaveBeenCalledTimes(1);
  expect(api.getIngestSnapshot).not.toHaveBeenCalled();
});


it('a throwing subscription preserves authoritative acceptance and uses bounded recovery', async () => {
  const { api, controller } = fixture(); controllers.push(controller);
  api.watchIngest = vi.fn(() => { throw new Error('fixture stream construction'); });
  await controller.restore(); controller.setVisible(true); await controller.reconcile();
  controller.setInput('https://xhslink.com/stream-error'); await controller.submit();
  await vi.waitFor(() => expect(controller.getSnapshot().entries[0].connectionLost).toBe(true));
  expect(controller.getSnapshot().entries[0].acceptance).toBe('accepted');
  await controller.reconcile(); expect(api.watchIngest).toHaveBeenCalledTimes(1);
});

it('disposes a synchronously terminal stream and ignores its later callbacks', async () => {
  const { api, controller } = fixture(); controllers.push(controller);
  const stop = vi.fn(); let staleError!: () => void; let staleFrame!: (value: IngestSnapshot) => boolean;
  api.watchIngest = vi.fn((id: string, receive: (value: IngestSnapshot) => boolean, failed: () => void) => { staleError = failed; staleFrame = receive; receive(snapshot(id, 'failed', 2)); return stop; });
  await controller.restore(); controller.setVisible(true); await controller.reconcile();
  controller.setInput('https://xhslink.com/sync-terminal'); await controller.submit();
  await vi.waitFor(() => expect(stop).toHaveBeenCalledTimes(1));
  const entry = controller.getSnapshot().entries[0]; staleError(); staleFrame(snapshot(entry.jobId!, 'fetching', 3));
  expect(controller.getSnapshot().entries[0].snapshot?.state).toBe('failed');
  expect(controller.getSnapshot().entries[0].connectionLost).not.toBe(true);
});

it('a failing measurement observer cannot stop presentation or hide the accepted result', async () => {
  const { api, controller: initial, journal } = fixture(); initial.deactivate();
  const observer = vi.fn((_event: { kind: string }) => { throw new Error('fixture diagnostic failure'); });
  const controller = new ImportDockController(api, journal, observer); controllers.push(controller); controller.activate();
  controller.setInput('https://xhslink.com/observer'); await controller.submit();
  await vi.waitFor(() => expect(controller.getSnapshot().entries[0].acceptance).toBe('accepted'));
  const id = controller.getSnapshot().entries[0].jobId!;
  vi.mocked(api.getIngestSnapshot!).mockResolvedValue({ ...snapshot(id, 'done', 4), stored_count: 1, result: { inspiration_id: 'result', locate_status: 'pending', asset_count: 1, city_name: null }, actions: { retry: false, view: true } });
  controller.setVisible(true); await controller.reconcile();
  await vi.waitFor(() => expect(controller.getSnapshot().presenting).not.toBeNull());
  expect(() => controller.acknowledgePresentation(controller.getSnapshot().presenting!.key)).not.toThrow();
  expect(() => controller.setVisible(false)).not.toThrow();
  expect(observer.mock.calls.map(([event]) => event.kind)).toEqual(['visible-start', 'visible-pause']);
  expect(controller.getSnapshot().entries[0].snapshot?.state).toBe('done');
});
it('retries a failed local acceptance write without posting the command again',async()=>{
 const {api,controller,journal}=fixture();controllers.push(controller);
 const mark=journal.mark.bind(journal);journal.mark=vi.fn().mockRejectedValueOnce(new JournalError('JOURNAL_UNAVAILABLE')).mockImplementation(mark);
 controller.setInput('https://xhslink.com/receipt');await controller.submit();await vi.waitFor(()=>expect(controller.getSnapshot().entries[0].acceptance).toBe('accepted'));
 const scope={ownerId:'owner-a',valid:()=>true};expect((await journal.list(scope))[0].phase).toBe('unconfirmed');
 await controller.reconcile();expect((await journal.list(scope))[0]).toMatchObject({phase:'accepted',disposition:'created',completionEligible:true});expect(api.startIngest).toHaveBeenCalledTimes(1);
});
it('rebases a checkpoint saved by another tab after hiding, even when recovery selects replay',async()=>{
 const {api,controller,journal}=fixture();controllers.push(controller);
 const job='ing_11111111-1111-4111-8111-111111111111',old='i1:22222222-2222-4222-8222-222222222222:101',fresh='i1:33333333-3333-4333-8333-333333333333:11';
 let saved={revision:crypto.randomUUID(),cursor:old,snapshot:{...snapshot(job,'parsing',100),head_cursor:old},observedDoneAttempt:0};
 journal.readCheckpoint=vi.fn(async()=>({value:saved,revision:saved.revision,corrupt:false}));
  api.getIngestRecovery=vi.fn(async(_id: string,input: { mode: 'replay' | 'resync'; cursor?: string })=>({mode:'replay' as const,ingest_id:job,cursor:input.cursor!,head_cursor:saved.cursor,head_seq:saved.cursor.split(':')[2],replay_floor:'0'}));
 api.watchDurableIngest=vi.fn(()=>vi.fn());vi.mocked(api.startIngest).mockImplementation(async r=>({...ack(r.operation_id!,job),snapshot:saved.snapshot}));vi.mocked(api.getIngestSnapshot!).mockImplementation(async()=>saved.snapshot);
 controller.setInput('https://xhslink.com/generation');await controller.submit();await vi.waitFor(()=>expect(controller.getSnapshot().entries[0].acceptance).toBe('accepted'));controller.setVisible(true);
 await vi.waitFor(()=>expect(api.watchDurableIngest).toHaveBeenCalledTimes(1));controller.setVisible(false);
 saved={...saved,revision:crypto.randomUUID(),cursor:fresh,snapshot:{...snapshot(job,'fetching',10),head_cursor:fresh}};
 await controller.restore(true);
 controller.setVisible(true);await vi.waitFor(()=>expect(api.watchDurableIngest).toHaveBeenCalledTimes(2));expect(controller.getSnapshot().entries[0].snapshot).toMatchObject({state:'fetching',state_version:10,head_cursor:fresh});
});
