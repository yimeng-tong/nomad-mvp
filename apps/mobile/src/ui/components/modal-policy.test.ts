import { describe, expect, it, vi } from 'vitest';
import type { AuthSnapshot } from '../../auth/session-context';
import { createCloseGate, createModalLayers, sameUiScope } from './modal-policy';

const owner: AuthSnapshot = { epoch: 1, activity: 2, phase: 'authenticated', identity: { ownerId: 'owner-a', sessionId: 'session-a', nativeGeneration: 2 } };
describe('private UI decisions', () => {
  it('invalidates checking, unavailable, same-owner recheck, session and native generation changes', () => {
    expect(sameUiScope(owner, { ...owner })).toBe(true);
    for (const current of [
      { ...owner, phase: 'checking' as const }, { ...owner, phase: 'unavailable' as const },
      { ...owner, activity: 3 }, { ...owner, epoch: 2 },
      { ...owner, identity: { ...owner.identity!, sessionId: 'session-b' } },
      { ...owner, identity: { ...owner.identity!, nativeGeneration: 3 } },
      { ...owner, identity: { ...owner.identity!, ownerId: 'owner-b' } },
    ]) expect(sameUiScope(owner, current)).toBe(false);
  });

  it('merges back/Escape while a decision is pending and consumes an allowed result only once', async () => {
    let release!: (allowed: boolean) => void;
    const close = vi.fn(), canClose = vi.fn(() => new Promise<boolean>((resolve) => { release = resolve; }));
    const gate = createCloseGate({ isCurrent: () => true, canClose, close, onError: vi.fn() });
    const first = gate.request('host-back'); const second = gate.request('escape');
    expect(first).toBe(second); await Promise.resolve();
    release(true); expect(await first).toBe(true); expect(canClose).toHaveBeenCalledTimes(1); expect(close).toHaveBeenCalledTimes(1);
  });

  it.each(['scope', 'unmount', 'host-abort'] as const)('rejects a late allowed close after %s', async (change) => {
    let release!: (allowed: boolean) => void; let current = true;
    const close = vi.fn(), host = new AbortController();
    const gate = createCloseGate({ isCurrent: () => current, canClose: () => new Promise<boolean>((resolve) => { release = resolve; }), close, onError: vi.fn() });
    const pending = gate.request('host-back', host.signal); await Promise.resolve();
    if (change === 'scope') current = false;
    else if (change === 'unmount') gate.cancel();
    else host.abort();
    release(true); expect(await pending).toBe(false); expect(close).not.toHaveBeenCalled();
  });

  it('keeps a rejected close open and handles an exception without saving anything', async () => {
    const close = vi.fn(), error = vi.fn();
    const canClose = vi.fn().mockResolvedValueOnce(false).mockRejectedValueOnce(new Error('unavailable'));
    const gate = createCloseGate({ isCurrent: () => true, canClose, close, onError: error });
    expect(await gate.request('outside')).toBe(false); expect(await gate.request('button')).toBe(false);
    expect(close).not.toHaveBeenCalled(); expect(error).toHaveBeenCalledTimes(1);
  });

  it('keeps parent coverage and only exposes the current top until each layer releases', () => {
    const layers = createModalLayers(), changed = vi.fn(); const unsubscribe = layers.subscribe(changed);
    const parent = layers.add('sheet'), child = layers.add('confirmation');
    expect(layers.isTop('sheet')).toBe(false); expect(layers.isTop('confirmation')).toBe(true);
    child(); child(); expect(layers.getSnapshot()).toEqual(['sheet']);
    parent(); expect(layers.getSnapshot()).toEqual([]); expect(changed).toHaveBeenCalledTimes(4); unsubscribe();
  });
});
