import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPlannerApiClient } from './api';

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
