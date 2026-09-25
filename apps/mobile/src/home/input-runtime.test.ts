import { webcrypto } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
const host = vi.hoisted(() => ({ receive: undefined as ((event: { url: string; source: 'launch'; appId: string }) => void) | undefined, subscribe: vi.fn(), remove: vi.fn() }));
vi.mock('../platform/host', () => ({ subscribeHostUrl: (receive: typeof host.receive) => { host.subscribe(); host.receive = receive; return host.remove; } }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); vi.restoreAllMocks(); });
it('subscribes once before UI consumers exist and retains an early launch input for explicit confirmation', async () => {
  vi.stubGlobal('crypto', webcrypto);
  const { operationJournal } = await import('./operation-journal'); vi.spyOn(operationJournal, 'claimed').mockResolvedValue(false);
  const { startInputInbox, inputInbox } = await import('./input-runtime');
  const first = startInputInbox(), second = startInputInbox();
  try {
    expect(host.subscribe).toHaveBeenCalledTimes(1);
    host.receive?.({ url: 'dev.nomad.mvp://input?v=1&text=early', source: 'launch', appId: 'dev.nomad.mvp' });
    await vi.waitFor(() => expect(inputInbox.getSnapshot().pending).toHaveLength(1));
    expect(inputInbox.getSnapshot().pending[0].text).toBe('early');
    expect(inputInbox.getSnapshot().pending[0].ownerId).toBeNull();
    first(); expect(host.remove).not.toHaveBeenCalled(); second(); expect(host.remove).toHaveBeenCalledTimes(1);
  } finally { first(); second(); }
});
