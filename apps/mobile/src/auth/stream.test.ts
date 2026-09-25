import { afterEach, expect, it, vi } from 'vitest';
import { watchBoundStream } from './stream';
import { commitIdentity, getAuthSnapshot, onAuthorityRefresh } from './session-context';

afterEach(() => vi.unstubAllGlobals());
it('lets a consumer dispose a failed stream and reconcile facts without an auth-refresh loop', () => {
  let instance!: { onerror?: () => void; close: () => void; addEventListener: () => void };
  vi.stubGlobal('EventSource', class {
    onerror?: () => void;
    close = vi.fn(); addEventListener = vi.fn();
    constructor() { instance = this; }
  });
  commitIdentity({ ownerId: 'stream-owner', sessionId: 'stream-session' });
  const refresh = vi.fn(), unsubscribe = onAuthorityRefresh(refresh);
  let stop = () => {};
  stop = watchBoundStream(getAuthSnapshot(), 'https://api.example.test', '/ingest/job/events', 'ingest', () => false, () => stop());
  instance.onerror?.();
  expect(refresh).not.toHaveBeenCalled();
  expect(getAuthSnapshot().phase).toBe('authenticated');
  expect(instance.close).toHaveBeenCalled();
  stop(); unsubscribe();
});
