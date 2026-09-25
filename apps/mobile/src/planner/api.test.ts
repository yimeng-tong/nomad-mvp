import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPlannerApiClient } from './api';
import { commitIdentity, markChecking } from '../auth/session-context';

class FakeEventSource {
  static readonly CLOSED = 2;
  static latest: FakeEventSource | null = null;
  readyState = 1;
  onerror: (() => void) | null = null;
  private readonly listeners = new Map<string, (event: { data: string }) => void>();

  constructor(
    readonly url: string,
    readonly options: EventSourceInit,
  ) {
    FakeEventSource.latest = this;
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    this.listeners.set(type, listener as unknown as (event: { data: string }) => void);
  }

  close() {
    this.readyState = FakeEventSource.CLOSED;
  }

  emit(type: string, data: unknown) {
    this.listeners.get(type)?.({ data: JSON.stringify(data) });
  }
}

describe('planner SSE client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    FakeEventSource.latest = null;
  });

  it('closes EventSource at terminal state and suppresses the resulting error callback', () => {
    vi.stubGlobal('EventSource', FakeEventSource);
    const onEvent = vi.fn();
    const onError = vi.fn();
    createPlannerApiClient('https://api.example.test').watchPlanJob({
      sseUrl: '/sse/plan/job-1',
      onEvent,
      onError,
    });
    const source = FakeEventSource.latest!;
    source.emit('plan', {
      trace_id: 'trace-1',
      plan_id: 'plan-1',
      plan_job_id: 'job-1',
      phase: 'done',
      ts: 1,
    });
    source.onerror?.();

    expect(source.readyState).toBe(FakeEventSource.CLOSED);
    expect(onEvent).toHaveBeenCalledOnce();
    expect(onError).not.toHaveBeenCalled();
  });
});

describe('planner timeline edit client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends typed slot edits to the plan-scoped endpoint', async () => {
    const responseBody = {
      plan_id: 'plan/1',
      plan_rev: 4,
      current_version_id: 'pv_4',
      edit_event_id: 'edit_1',
      undo_token: 'undo_1',
      undo_expires_at: '2026-08-01T00:00:08.000Z',
      changed_slot: {
        slot_id: 'slot/1',
        day_index: 1,
        slot_index: 0,
        start_local: '09:00',
        end_local: '11:00',
        type: 'place',
        origin: 'hand',
      },
    };
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(responseBody)));
    vi.stubGlobal('fetch', fetchMock);

    await createPlannerApiClient('https://api.example.test').editSlot('plan/1', 'slot/1', {
      op: 'move_day',
      expected_plan_rev: 3,
      operation_id: 'operation-1',
      target_day_index: 1,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/plan/plan%2F1/slots/slot%2F1',
      expect.objectContaining({
        method: 'PATCH',
        credentials: 'include',
        body: JSON.stringify({
          op: 'move_day',
          expected_plan_rev: 3,
          operation_id: 'operation-1',
          target_day_index: 1,
        }),
      }),
    );
  });

  it('fetches a day-scoped recent action and undoes it by event id', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        plan_id: 'plan-1',
        plan_rev: 4,
        action: {
          edit_event_id: 'edit-1',
          kind: 'retime',
          day_index: 1,
          slot_id: 'slot-1',
          label: '调整了时间',
          can_undo: true,
          created_at: '2026-08-01T00:00:00.000Z',
        },
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        plan_id: 'plan-1',
        plan_rev: 5,
        current_version_id: 'pv-5',
        undo_event_id: 'undo-1',
        undone_edit_event_id: 'edit-1',
      })));
    vi.stubGlobal('fetch', fetchMock);
    const api = createPlannerApiClient('https://api.example.test');

    await api.getRecentAction('plan-1', 1);
    await api.undoEdit('plan-1', { expected_plan_rev: 4, edit_event_id: 'edit-1' });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.example.test/plan/plan-1/recent-actions?day_index=1',
      expect.objectContaining({ credentials: 'include' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.example.test/plan/plan-1/edits/undo',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ expected_plan_rev: 4, edit_event_id: 'edit-1' }),
      }),
    );
  });
});


it('stale SSE callbacks are discarded during authority checks and after an account change', () => {
  vi.stubGlobal('EventSource', FakeEventSource);
  commitIdentity({ ownerId: 'a', sessionId: 's-a' });
  const onEvent = vi.fn();
  const dispose = createPlannerApiClient('https://api.example.test').watchPlanJob({ sseUrl: '/sse/plan/job-1', onEvent, onError: vi.fn() });
  const old = FakeEventSource.latest!;
  expect(new URL(old.url).searchParams.get('auth_user_id')).toBe('a');
  markChecking(false); old.emit('plan', { phase: 'running' }); expect(onEvent).not.toHaveBeenCalled();
  commitIdentity({ ownerId: 'a', sessionId: 's-a' });
  const resumed = FakeEventSource.latest!; expect(resumed).not.toBe(old);
  resumed.emit('plan', { phase: 'running' }); expect(onEvent).toHaveBeenCalledOnce();
  commitIdentity({ ownerId: 'b', sessionId: 's-b' });
  resumed.emit('plan', { phase: 'running' }); expect(onEvent).toHaveBeenCalledOnce();
  expect(resumed.readyState).toBe(FakeEventSource.CLOSED);
  dispose(); commitIdentity(null); vi.unstubAllGlobals();
});

it('an unknown generation result retries with the same idempotency key', async () => {
  const fetchMock = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValue(new Response('{}'));
  vi.stubGlobal('fetch', fetchMock);
  const client = createPlannerApiClient('https://api.example.test');
  const body = {} as Parameters<typeof client.generatePlan>[0];
  await expect(client.generatePlan(body)).rejects.toThrow('network');
  await client.generatePlan(body);
  const key = (index: number) => new Headers(fetchMock.mock.calls[index][1].headers).get('Idempotency-Key');
  expect(key(0)).toBe(key(1)); vi.unstubAllGlobals();
});


it('an SSE server rejection in CLOSED state triggers recovery instead of waiting forever', () => {
  vi.stubGlobal('EventSource', FakeEventSource); commitIdentity({ ownerId: 'a', sessionId: 's-a' });
  const onError = vi.fn();
  const dispose = createPlannerApiClient('https://api.example.test').watchPlanJob({ sseUrl: '/sse/plan/job-1', onEvent: vi.fn(), onError });
  const stream = FakeEventSource.latest!; stream.readyState = FakeEventSource.CLOSED; stream.onerror?.();
  expect(onError).toHaveBeenCalledOnce(); dispose(); commitIdentity(null); vi.unstubAllGlobals();
});
