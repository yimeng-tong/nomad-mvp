export type HostPlatform = 'android' | 'ios' | 'web';
export type HostProblem = 'HOST_LISTENER_FAILED' | 'HOST_STATE_UNAVAILABLE' | 'HOST_URL_UNAVAILABLE' | 'HOST_BACK_HANDLER_FAILED' | 'HOST_BACK_UNAVAILABLE' | 'HOST_CALLBACK_FAILED';
export interface HostListener { remove(): Promise<void> }
export interface HostDriver {
  platform: HostPlatform;
  onState(callback: (active: boolean) => void): Promise<HostListener>;
  onBack(callback: () => void): Promise<HostListener>;
  onKeyboard(callback: (visible: boolean) => void): Promise<HostListener>;
  onUrlOpen(callback: (url: string) => void): Promise<HostListener>;
  getState(): Promise<boolean>;
  getAppId(): Promise<string>;
  getLaunchUrl(): Promise<string | undefined>;
  hideKeyboard(): Promise<void>;
  minimize(): Promise<void>;
  openExternal(url: string): Promise<boolean | null>;
}
export interface HostResume { sequence: number; source: 'app-state'; at: number }
/** Delivery is an untrusted input event, never authentication or permission to navigate. */
export interface HostUrl { url: string; source: 'launch' | 'open'; appId?: string }
type BackHandler = { id: number; priority: number; handle(signal: AbortSignal): boolean | Promise<boolean> };
const CANCELLED = Symbol('host-back-cancelled');
type BackOperation = { controller: AbortController; cancelled: Promise<typeof CANCELLED>; cancel(): void };
type Session = { disposed: boolean; references: number; handles: Set<HostListener>; ready: Promise<void>; keyboard: boolean; keyboardEpoch: number; back?: BackOperation; active?: boolean; stateEvents: number; appId?: string; urls: HostUrl[] };

function parseUrl(raw: string, maxLength = 8192): URL | null {
  if (!raw || raw.length > maxLength || /[\u0000-\u0020\u007f]/.test(raw)) return null;
  // Older WebViews expose an empty URL.username for custom schemes with opaque paths.
  if (raw.match(/^[a-z][a-z\d+.-]*:\/\/([^/?#]*)/i)?.[1].includes('@')) return null;
  try { const url = new URL(raw); return url.username || url.password ? null : url; } catch { return null; }
}
const sensitiveName = (name: string) => /token|secret|signature|credential|authorization|cookie|session|password|otp/.test(name.toLowerCase()) || ['code', 'state', 'sid'].includes(name.toLowerCase());
function permittedExternal(raw: string, allowedOrigins?: readonly string[]): URL | null {
  const url = parseUrl(raw);
  if (!url || url.protocol !== 'https:' || (allowedOrigins && !allowedOrigins.includes(url.origin))) return null;
  if ([...url.searchParams.keys()].some(sensitiveName)) return null;
  try {
    const fragment = decodeURIComponent(url.hash.slice(1));
    const fragmentParams = fragment.includes('?') ? fragment.slice(fragment.indexOf('?') + 1) : fragment;
    if (sensitiveName(fragment) || [...new URLSearchParams(fragmentParams.replaceAll(';', '&')).keys()].some(sensitiveName)) return null;
  } catch { return null; }
  return url;
}

export function createHostRuntime(driver: HostDriver) {
  const backs = new Map<number, BackHandler>();
  const resumes = new Set<(event: HostResume) => void>();
  const urls = new Set<(event: HostUrl) => void>();
  const problems = new Set<(problem: HostProblem) => void>();
  let session: Session | undefined, handlerId = 0, resumeSequence = 0, backRevision = 0;
  const report = (problem: HostProblem) => { for (const listener of problems) { try { listener(problem); } catch { /* reporting is isolated */ } } };
  const notify = <T>(listeners: Set<(event: T) => void>, event: T) => {
    for (const listener of [...listeners]) { try { listener(event); } catch { report('HOST_CALLBACK_FAILED'); } }
  };
  const active = (target: Session) => session === target && !target.disposed;
  const cancelBack = (target: Session | undefined) => {
    const operation = target?.back;
    if (!target || !operation) return;
    target.back = undefined; operation.controller.abort(); operation.cancel();
  };
  const removeHandle = (handle: HostListener) => {
    try { void handle.remove().catch(() => report('HOST_LISTENER_FAILED')); } catch { report('HOST_LISTENER_FAILED'); }
  };
  const deliverUrl = (target: Session, event: HostUrl) => {
    if (!active(target)) return;
    const parsed = parseUrl(event.url, 32768);
    if (!parsed) return;
    if (!target.appId) { if (target.urls.length < 8) target.urls.push(event); return; }
    if (parsed.protocol !== 'https:' && parsed.protocol !== `${target.appId.toLowerCase()}:`) return;
    notify(urls, { ...event, appId: target.appId });
  };

  async function handleBack() {
    const target = session;
    if (!target || !active(target) || target.active === false || driver.platform === 'web' || target.back) return;
    let cancel!: () => void;
    const cancelled = new Promise<typeof CANCELLED>((resolve) => { cancel = () => resolve(CANCELLED); });
    const operation: BackOperation = { controller: new AbortController(), cancelled, cancel };
    target.back = operation;
    const revision = backRevision;
    const current = () => active(target) && target.active !== false && target.back === operation && revision === backRevision;
    try {
      if (target.keyboard) {
        const epoch = target.keyboardEpoch;
        await Promise.race([driver.hideKeyboard(), cancelled]);
        if (current() && epoch === target.keyboardEpoch) target.keyboard = false;
        return;
      }
      const ordered = [...backs.values()].sort((a, b) => b.priority - a.priority || b.id - a.id);
      for (const handler of ordered) {
        if (!current()) return;
        if (!backs.has(handler.id)) continue;
        let consumed: boolean | typeof CANCELLED;
        try { consumed = await Promise.race([handler.handle(operation.controller.signal), cancelled]); } catch { if (current()) report('HOST_BACK_HANDLER_FAILED'); return; }
        // A layer removed during an asynchronous decision cannot dismiss its successor.
        if (!current() || consumed === CANCELLED || !backs.has(handler.id)) return;
        if (typeof consumed !== 'boolean') { report('HOST_BACK_HANDLER_FAILED'); return; }
        if (consumed) return;
      }
      if (current() && driver.platform === 'android') await Promise.race([driver.minimize(), cancelled]);
    } catch { if (current()) report('HOST_BACK_UNAVAILABLE'); }
    finally { if (target.back === operation) target.back = undefined; }
  }

  function start() {
    if (!session) {
      const target: Session = { disposed: false, references: 0, handles: new Set(), ready: Promise.resolve(), keyboard: false, keyboardEpoch: 0, stateEvents: 0, urls: [] };
      session = target;
      if (driver.platform !== 'web') {
        const attach = (install: () => Promise<HostListener>) => {
          try {
            return install().then((handle) => { if (active(target)) target.handles.add(handle); else removeHandle(handle); }).catch(() => { if (active(target)) report('HOST_LISTENER_FAILED'); });
          } catch { report('HOST_LISTENER_FAILED'); return Promise.resolve(); }
        };
        const pending = [
          attach(() => driver.onState((value) => {
            if (!active(target)) return;
            target.stateEvents += 1;
            const previous = target.active; target.active = value;
            if (!value) { target.keyboard = false; target.keyboardEpoch += 1; cancelBack(target); }
            if (previous === false && value) notify(resumes, { sequence: ++resumeSequence, source: 'app-state', at: Date.now() });
          })),
          attach(() => driver.onKeyboard((value) => { if (active(target)) { target.keyboard = value; target.keyboardEpoch += 1; } })),
          attach(() => driver.onUrlOpen((url) => deliverUrl(target, { url, source: 'open' }))),
        ];
        if (driver.platform === 'android') pending.push(attach(() => driver.onBack(() => { if (active(target)) void handleBack(); })));
        pending.push(driver.getState().then((value) => { if (active(target) && target.stateEvents === 0) target.active = value; }).catch(() => { if (active(target)) report('HOST_STATE_UNAVAILABLE'); }));
        pending.push(driver.getAppId().then((appId) => {
          if (!active(target)) return;
          if (!/^[a-z][a-z\d_]*(?:\.[a-z][a-z\d_]*)+$/i.test(appId)) throw new Error();
          target.appId = appId;
          const pendingUrls = target.urls.splice(0); for (const event of pendingUrls) deliverUrl(target, event);
        }).catch(() => { target.urls.length = 0; if (active(target)) report('HOST_URL_UNAVAILABLE'); }));
        pending.push(driver.getLaunchUrl().then((url) => { if (url) deliverUrl(target, { url, source: 'launch' }); }).catch(() => { if (active(target)) report('HOST_URL_UNAVAILABLE'); }));
        target.ready = Promise.all(pending).then(() => {});
      }
    }
    const target = session; target.references += 1; let released = false;
    return {
      ready: target.ready,
      stop() {
        if (released) return; released = true; target.references -= 1;
        if (target.references > 0) return;
        target.disposed = true; target.urls.length = 0; cancelBack(target);
        for (const handle of target.handles) removeHandle(handle);
        target.handles.clear(); if (session === target) session = undefined;
      },
    };
  }
  return {
    platform: driver.platform, start, handleBack,
    registerBackHandler(handle: (signal: AbortSignal) => boolean | Promise<boolean>, priority = 0) {
      if (!Number.isFinite(priority)) throw new Error('HOST_BACK_PRIORITY_INVALID');
      const id = ++handlerId; backs.set(id, { id, priority, handle }); backRevision += 1; cancelBack(session);
      return () => { if (backs.delete(id)) { backRevision += 1; cancelBack(session); } };
    },
    subscribeResume(listener: (event: HostResume) => void) { resumes.add(listener); return () => { resumes.delete(listener); }; },
    subscribeUrl(listener: (event: HostUrl) => void) { urls.add(listener); return () => { urls.delete(listener); }; },
    subscribeProblems(listener: (event: HostProblem) => void) { problems.add(listener); return () => { problems.delete(listener); }; },
    async openExternalUrl(raw: string, allowedOrigins?: readonly string[]): Promise<{ opened: boolean; reason?: 'unsafe-url' | 'unavailable' | 'unconfirmed' }> {
      const url = permittedExternal(raw, allowedOrigins);
      if (!url) return { opened: false, reason: 'unsafe-url' };
      try {
        const result = await driver.openExternal(url.href);
        return result === null ? { opened: false, reason: 'unconfirmed' } : result ? { opened: true } : { opened: false, reason: 'unavailable' };
      }
      catch { return { opened: false, reason: 'unavailable' }; }
    },
  };
}
