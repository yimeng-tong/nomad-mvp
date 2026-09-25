import { getAuthSnapshot, markChecking, subscribeAuth, type AuthSnapshot } from './session-context';
import { nativeCall, nativeExpected, NomadNativeAuth, usesNativeAuth } from './native';
import type { NativeListener } from '@nomad/native-auth';

/** An existing job resumes only after the same public identity is re-confirmed. No private data enters the URL. */
export function watchBoundStream<T>(scope: AuthSnapshot, baseUrl: string, path: string, eventName: string,
  onEvent: (value: T) => boolean, onError: () => void) {
  let disposed = false; let connected = false; let cycle = 0; let cursor = '';
  let source: EventSource | undefined; let nativeId: string | undefined; let listener: NativeListener | undefined;
  const usable = () => { const now = getAuthSnapshot(); return !disposed && now.epoch === scope.epoch && !['checking','unavailable'].includes(now.phase); };
  const close = () => {
    cycle++; connected = false; source?.close(); source = undefined;
    if (nativeId) void NomadNativeAuth.closeStream({ subscriptionId: nativeId }).catch(() => undefined);
    nativeId = undefined; void listener?.remove().catch(() => undefined); listener = undefined;
  };
  let unsubscribe = () => {};
  const stop = () => { disposed = true; close(); unsubscribe(); };
  const receive = (data: string, id: string | undefined, token: number) => {
    if (token !== cycle || !usable()) return;
    try { const terminal = onEvent(JSON.parse(data) as T); if (id) cursor = id; if (terminal) stop(); }
    catch { onError(); }
  };
  const failed = (token: number) => {
    if (token !== cycle || !usable()) return;
    close(); onError(); if (!disposed) markChecking();
  };
  const connect = () => {
    if (connected || !usable()) return;
    connected = true; const token = ++cycle;
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('#')) { close(); onError(); return; }
    if (usesNativeAuth()) {
      void (async () => {
        const handle = await nativeCall(() => NomadNativeAuth.addListener('nativeAuthStream', (message) => {
          if (message.subscriptionId !== nativeId || message.ownerId !== scope.identity?.ownerId || message.sessionId !== scope.identity?.sessionId
            || message.generation !== scope.identity?.nativeGeneration || token !== cycle) return;
          if (message.closed) { failed(token); return; }
          if (message.event === eventName && message.data) receive(message.data, message.id, token);
        }));
        if (token !== cycle || !usable()) { await handle.remove(); return; }
        listener = handle;
        const result = await nativeCall(() => NomadNativeAuth.openStream({ path, lastEventId: cursor || undefined, expected: nativeExpected(scope) }));
        if (token !== cycle || !usable()) { await NomadNativeAuth.closeStream(result); return; }
        nativeId = result.subscriptionId;
        await nativeCall(() => NomadNativeAuth.startStream(result));
      })().catch(() => failed(token));
      return;
    }
    const url = new URL(`${baseUrl}${path}`, window.location.origin);
    url.searchParams.set('auth_user_id', scope.identity?.ownerId ?? 'anonymous');
    url.searchParams.set('auth_session_id', scope.identity?.sessionId ?? 'anonymous');
    if (cursor) url.searchParams.set('last_event_id', cursor);
    source = new EventSource(url.toString(), { withCredentials: true });
    const stream = source;
    stream.addEventListener(eventName, (message) => receive((message as MessageEvent<string>).data, (message as MessageEvent<string>).lastEventId, token));
    stream.onerror = () => failed(token);
  };
  unsubscribe = subscribeAuth(() => {
    if (getAuthSnapshot().epoch !== scope.epoch) { stop(); return; }
    if (usable()) connect(); else close();
  });
  connect(); return stop;
}
