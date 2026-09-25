import { nativeCall, nativeExpected, nativeResponse, NomadNativeAuth, usesNativeAuth } from './native';
import { getAuthSnapshot, markChecking, subscribeAuth, type AuthSnapshot } from './session-context';

export class AuthContextError extends Error {
  readonly status = 409;
  constructor(readonly code: 'AUTH_CONTEXT_CHANGED' | 'AUTH_CONTEXT_UNCONFIRMED') { super(code); this.name = 'AuthContextError'; }
}
function current(scope: AuthSnapshot, activity?: number) {
  const state = getAuthSnapshot();
  if (scope.epoch !== state.epoch) throw new AuthContextError('AUTH_CONTEXT_CHANGED');
  if (['checking', 'unavailable'].includes(state.phase)) throw new AuthContextError('AUTH_CONTEXT_UNCONFIRMED');
  if (activity !== undefined && activity !== state.activity) throw new AuthContextError('AUTH_CONTEXT_CHANGED');
}
export function expectedIdentityHeaders(scope: AuthSnapshot) {
  return { 'X-Auth-User-Id': scope.identity?.ownerId ?? 'anonymous', 'X-Auth-Session-Id': scope.identity?.sessionId ?? 'anonymous' };
}
export function createBoundJsonRequest(baseUrl: string, parseError: (response: Response) => Promise<Error>, options: { probe?: boolean } = {}) {
  const scope = getAuthSnapshot();
  return async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (!options.probe) current(scope);
    const activity = getAuthSnapshot().activity;
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body) headers.set('Content-Type', 'application/json');
    headers.delete('Authorization'); headers.delete('Cookie'); headers.delete('X-User-Id');
    if (!options.probe) {
      for (const [key, value] of Object.entries(expectedIdentityHeaders(scope))) headers.set(key, value);
    }
    const controller = new AbortController();
    const nativeRequestId = usesNativeAuth() ? crypto.randomUUID() : undefined;
    const abort = () => {
      controller.abort();
      if (nativeRequestId) void NomadNativeAuth.cancelRequest({ requestId: nativeRequestId }).catch(() => undefined);
    };
    if (init.signal?.aborted) abort();
    init.signal?.addEventListener('abort', abort, { once: true });
    const unsubscribe = options.probe ? () => {} : subscribeAuth(() => {
      const now = getAuthSnapshot();
      if (now.epoch !== scope.epoch || now.activity !== activity) abort();
    });
    try {
      if (controller.signal.aborted) throw new DOMException('Request cancelled', 'AbortError');
      const response = usesNativeAuth() ? nativeResponse(await nativeCall(() => NomadNativeAuth.request({
        requestId: nativeRequestId!, path, method: (init.method ?? 'GET') as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
        body: typeof init.body === 'string' ? init.body : undefined,
        headers: headers.has('Idempotency-Key') ? { 'Idempotency-Key': headers.get('Idempotency-Key')! } : undefined,
        expected: nativeExpected(scope),
      }))) : await fetch(`${baseUrl}${path}`, {
        ...init, signal: controller.signal, credentials: 'include',
        headers: Object.fromEntries(headers.entries()),
      });
      if (controller.signal.aborted) throw new DOMException('Request cancelled', 'AbortError');
      if (!options.probe) current(scope, activity);
      if (!response.ok) {
        const error = await parseError(response);
        if (!options.probe) {
          current(scope, activity);
          const code = 'code' in error ? String(error.code) : '';
          if (['AUTH_SESSION_EXPIRED', 'AUTH_CONTEXT_CHANGED', 'AUTH_ACCOUNT_UNAVAILABLE', 'AUTH_AUTHORITY_UNAVAILABLE'].includes(code)) markChecking();
        }
        throw error;
      }
      const body = response.status === 204 ? undefined : await response.json();
      if (!options.probe) current(scope, activity);
      return body as T;
    } catch (error) {
      if (!options.probe && (scope.epoch !== getAuthSnapshot().epoch || activity !== getAuthSnapshot().activity)) throw new AuthContextError('AUTH_CONTEXT_CHANGED');
      throw error;
    } finally {
      unsubscribe(); init.signal?.removeEventListener('abort', abort);
    }
  };
}

/** Serializes only the HTTP mutation, never the time the user spends typing or solving a captcha. */
let mutations = 0;
export const authenticationMutationPending = () => mutations > 0;
export async function withAuthenticationLock<T>(operation: () => Promise<T>): Promise<T> {
  const execute = async () => {
    mutations++;
    try { return await operation(); }
    finally { mutations--; if (!mutations && getAuthSnapshot().phase === 'checking') markChecking(); }
  };
  if (globalThis.navigator?.locks) return navigator.locks.request('nomad-auth-mutation-v1', execute);
  return execute();
}
