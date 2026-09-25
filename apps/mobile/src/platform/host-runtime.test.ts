import { describe, expect, it, vi } from 'vitest';
import { createHostRuntime, type HostDriver, type HostListener } from './host-runtime';

const tick = () => new Promise<void>((resolve) => queueMicrotask(resolve));
function harness(platform: 'android' | 'ios' | 'web' = 'android') {
  const handlers: { state?: (value: boolean) => void; back?: () => void; keyboard?: (value: boolean) => void; url?: (value: string) => void } = {};
  const removes: ReturnType<typeof vi.fn>[] = [];
  const listen = async (key: keyof typeof handlers, callback: unknown): Promise<HostListener> => {
    Object.assign(handlers, { [key]: callback }); const remove = vi.fn(async () => {}); removes.push(remove); return { remove };
  };
  const driver: HostDriver = {
    platform, onState: (f) => listen('state', f), onBack: (f) => listen('back', f), onKeyboard: (f) => listen('keyboard', f), onUrlOpen: (f) => listen('url', f),
    getState: vi.fn(async () => true), getAppId: vi.fn(async () => 'dev.nomad.mvp'), getLaunchUrl: vi.fn(async () => undefined),
    hideKeyboard: vi.fn(async () => {}), minimize: vi.fn(async () => {}), openExternal: vi.fn(async () => true),
  };
  return { driver, handlers, removes, runtime: createHostRuntime(driver) };
}

describe('native host lifecycle and navigation', () => {
  it('uses explicit priority, stops at a consuming layer and unregisters it', async () => {
    const h = harness(); await h.runtime.start().ready;
    const page = vi.fn(() => true), sheet = vi.fn(() => true);
    h.runtime.registerBackHandler(page); const remove = h.runtime.registerBackHandler(sheet, 100);
    await h.runtime.handleBack(); expect(sheet).toHaveBeenCalledOnce(); expect(page).not.toHaveBeenCalled();
    remove(); await h.runtime.handleBack(); expect(page).toHaveBeenCalledOnce(); expect(h.driver.minimize).not.toHaveBeenCalled();
  });
  it('hides the keyboard without also popping the page', async () => {
    const h = harness(); await h.runtime.start().ready; const page = vi.fn(() => true); h.runtime.registerBackHandler(page);
    h.handlers.keyboard?.(true); await h.runtime.handleBack();
    expect(h.driver.hideKeyboard).toHaveBeenCalledOnce(); expect(page).not.toHaveBeenCalled();
  });
  it('never falls through a busy or throwing draft layer', async () => {
    const h = harness(); await h.runtime.start().ready; const page = vi.fn(() => true); const problem = vi.fn();
    h.runtime.subscribeProblems(problem); h.runtime.registerBackHandler(page); h.runtime.registerBackHandler(() => { throw new Error('private-draft'); }, 100);
    await h.runtime.handleBack(); expect(page).not.toHaveBeenCalled(); expect(h.driver.minimize).not.toHaveBeenCalled();
    expect(problem).toHaveBeenCalledWith('HOST_BACK_HANDLER_FAILED'); expect(JSON.stringify(problem.mock.calls)).not.toContain('private-draft');
  });
  it('coalesces concurrent back events while a layer is resolving', async () => {
    const h = harness(); await h.runtime.start().ready; let finish!: (handled: boolean) => void;
    const handler = vi.fn(() => new Promise<boolean>((resolve) => { finish = resolve; })); h.runtime.registerBackHandler(handler);
    const first = h.runtime.handleBack(); await h.runtime.handleBack(); expect(handler).toHaveBeenCalledOnce(); finish(true); await first;
  });
  it('does not pop a new page after the pending handler was removed', async () => {
    const h = harness(); await h.runtime.start().ready; let finish!: (handled: boolean) => void; const page = vi.fn(() => true);
    h.runtime.registerBackHandler(page); const remove = h.runtime.registerBackHandler(() => new Promise<boolean>((resolve) => { finish = resolve; }), 100);
    const back = h.runtime.handleBack(); remove(); finish(false); await back; expect(page).not.toHaveBeenCalled();
  });
  it('only minimizes an unhandled Android root', async () => {
    const android = harness(); await android.runtime.start().ready; await android.runtime.handleBack(); expect(android.driver.minimize).toHaveBeenCalledOnce();
    const ios = harness('ios'); await ios.runtime.start().ready; await ios.runtime.handleBack(); expect(ios.driver.minimize).not.toHaveBeenCalled();
  });
  it('does not let an unresolved back decision block a replacement mount', async () => {
    const h = harness(); const old = h.runtime.start(); await old.ready;
    let finish!: (handled: boolean) => void;
    const remove = h.runtime.registerBackHandler(() => new Promise<boolean>((resolve) => { finish = resolve; }));
    const pending = h.runtime.handleBack(); remove(); old.stop(); await h.runtime.start().ready;
    const current = vi.fn(() => true); h.runtime.registerBackHandler(current);
    await h.runtime.handleBack(); expect(current).toHaveBeenCalledOnce(); finish(false); await pending;
    expect(h.driver.minimize).not.toHaveBeenCalled();
  });
  it('does not dismiss a new sheet registered while an older handler awaits', async () => {
    const h = harness(); await h.runtime.start().ready;
    let finish!: (handled: boolean) => void; h.runtime.registerBackHandler(() => new Promise<boolean>((resolve) => { finish = resolve; }));
    const pending = h.runtime.handleBack(); const sheet = vi.fn(() => true); h.runtime.registerBackHandler(sheet, 100);
    finish(false); await pending; expect(sheet).not.toHaveBeenCalled(); expect(h.driver.minimize).not.toHaveBeenCalled();
    await h.runtime.handleBack(); expect(sheet).toHaveBeenCalledOnce();
  });
  it('cancels an unregistered unresolved handler without blocking the next back', async () => {
    const h = harness(); await h.runtime.start().ready;
    const remove = h.runtime.registerBackHandler(() => new Promise<boolean>(() => {}));
    const pending = h.runtime.handleBack(); remove(); const page = vi.fn(() => true); h.runtime.registerBackHandler(page);
    await h.runtime.handleBack(); expect(page).toHaveBeenCalledOnce(); await pending;
  });
  it('does not clear a new keyboard event when an older hide finishes', async () => {
    const h = harness(); await h.runtime.start().ready; let finish!: () => void;
    h.driver.hideKeyboard = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    const page = vi.fn(() => true); h.runtime.registerBackHandler(page); h.handlers.keyboard?.(true);
    const back = h.runtime.handleBack(); h.handlers.keyboard?.(true); finish(); await back;
    h.driver.hideKeyboard = vi.fn(async () => {}); await h.runtime.handleBack();
    expect(h.driver.hideKeyboard).toHaveBeenCalledOnce(); expect(page).not.toHaveBeenCalled();
  });
  it('emits only inactive-to-active transitions, keeping browser events separate', async () => {
    const h = harness(); const resume = vi.fn(); h.runtime.subscribeResume(resume); await h.runtime.start().ready;
    h.handlers.state?.(true); expect(resume).not.toHaveBeenCalled();
    h.handlers.state?.(false); h.handlers.state?.(true); h.handlers.state?.(true); expect(resume).toHaveBeenCalledOnce();
  });
  it('does not let an older getState reply overwrite a newer native event', async () => {
    const h = harness(); let finish!: (active: boolean) => void; h.driver.getState = () => new Promise((resolve) => { finish = resolve; });
    const resume = vi.fn(); h.runtime.subscribeResume(resume); const lease = h.runtime.start(); await tick(); h.handlers.state?.(false); finish(true); await lease.ready;
    h.handlers.state?.(true); expect(resume).toHaveBeenCalledOnce();
  });
  it('cleans late listener handles and ignores callbacks from a disposed mount', async () => {
    const h = harness(); let finish!: (handle: HostListener) => void; let callback!: (value: boolean) => void;
    h.driver.onState = (f) => { callback = f; return new Promise((resolve) => { finish = resolve; }); };
    const resume = vi.fn(); h.runtime.subscribeResume(resume); const lease = h.runtime.start(); lease.stop();
    const remove = vi.fn(async () => {}); finish({ remove }); await lease.ready; callback(false); callback(true);
    expect(remove).toHaveBeenCalledOnce(); expect(resume).not.toHaveBeenCalled(); expect(h.removes.every((r) => r.mock.calls.length === 1)).toBe(true);
  });
  it('shares one native subscription set between multiple leases', async () => {
    const h = harness(); const a = h.runtime.start(), b = h.runtime.start(); await a.ready; expect(h.removes).toHaveLength(4);
    a.stop(); expect(h.removes.every((r) => r.mock.calls.length === 0)).toBe(true); b.stop(); await tick(); expect(h.removes.every((r) => r.mock.calls.length === 1)).toBe(true);
  });
  it('never initializes native plugins on the Web', async () => {
    const h = harness('web'); await h.runtime.start().ready; expect(h.removes).toHaveLength(0); expect(h.driver.getState).not.toHaveBeenCalled();
  });
  it('passes only allowed incoming schemes as untrusted events without navigating', async () => {
    const h = harness(); const listener = vi.fn(); h.runtime.subscribeUrl(listener); await h.runtime.start().ready;
    h.handlers.url?.('javascript:alert(1)'); h.handlers.url?.('https://user:secret@example.test'); h.handlers.url?.('another-app://callback');
    expect(listener).not.toHaveBeenCalled(); h.handlers.url?.('dev.nomad.mvp://auth/callback?code=untrusted'); expect(listener).toHaveBeenCalledOnce();
    expect(h.driver.openExternal).not.toHaveBeenCalled();
  });
  it('allows bounded percent-encoded Chinese input without widening external navigation limits', async () => {
    const h = harness(); const listener = vi.fn(); h.runtime.subscribeUrl(listener); await h.runtime.start().ready;
    const url = `dev.nomad.mvp://input?v=1&text=${encodeURIComponent('厦'.repeat(2000))}`;
    h.handlers.url?.(url); expect(listener).toHaveBeenCalledWith({ url, source: 'open', appId: 'dev.nomad.mvp' });
    expect((await h.runtime.openExternalUrl('https://example.test/?text=' + 'a'.repeat(9000))).opened).toBe(false);
  });
});

describe('external navigation boundary', () => {
  it.each(['javascript:alert(1)', 'http://example.test', '//example.test', 'https://user:secret@example.test', 'https://example.test/?access_token=private', 'https://example.test/?X-Amz-Signature=private', 'https://example.test/#token=private', 'https://example.test/#code=private&state=private', 'https://example.test/#sid=private', 'https://example.test/#/callback?code=private'])('rejects unsafe or credential-bearing URL %s', async (url) => {
    const h = harness(); expect((await h.runtime.openExternalUrl(url)).opened).toBe(false); expect(h.driver.openExternal).not.toHaveBeenCalled();
  });
  it('requires an explicit user call and reports a native rejection truthfully', async () => {
    const h = harness(); await h.runtime.start().ready; expect(h.driver.openExternal).not.toHaveBeenCalled();
    expect(await h.runtime.openExternalUrl('https://example.test/privacy')).toEqual({ opened: true });
    h.driver.openExternal = async () => { throw new Error('private provider message'); };
    expect(await h.runtime.openExternalUrl('https://example.test/privacy')).toEqual({ opened: false, reason: 'unavailable' });
  });
  it('enforces supplied destination allowlists', async () => {
    const h = harness(); expect((await h.runtime.openExternalUrl('https://other.test/', ['https://example.test'])).opened).toBe(false); expect(h.driver.openExternal).not.toHaveBeenCalled();
  });
  it('keeps an unobservable browser-open result unknown', async () => {
    const h = harness('web'); h.driver.openExternal = async () => null;
    expect(await h.runtime.openExternalUrl('https://example.test/privacy')).toEqual({ opened: false, reason: 'unconfirmed' });
  });
});
