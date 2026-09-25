import { beforeEach, expect, it, vi } from 'vitest';
import { commitIdentity, getAuthSnapshot, markChecking, markUnavailable } from './session-context';
import { createBoundJsonRequest } from './transport';

const a = { ownerId: 'owner-a', sessionId: 'session-a' };
const b = { ownerId: 'owner-b', sessionId: 'session-b' };
beforeEach(() => { commitIdentity(null); vi.unstubAllGlobals(); });
it('an old page cannot submit its body under a newer cookie account', async () => {
  commitIdentity(a);
  const request = createBoundJsonRequest('https://api.example', async () => new Error('request failed'));
  commitIdentity(b);
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  await expect(request('/private', { method: 'POST', body: '{"private":"A"}' })).rejects.toMatchObject({ code: 'AUTH_CONTEXT_CHANGED' });
  expect(fetch).not.toHaveBeenCalled();
});
it('a late JSON body is discarded after an account change', async () => {
  commitIdentity(a);
  let resolveBody!: (body: unknown) => void;
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: () => new Promise((resolve) => { resolveBody = resolve; }) })));
  const request = createBoundJsonRequest('https://api.example', async () => new Error());
  const result = request('/private');
  await vi.waitFor(() => expect(resolveBody).toBeDefined());
  commitIdentity(b); resolveBody({ private: 'A' });
  await expect(result).rejects.toMatchObject({ code: 'AUTH_CONTEXT_CHANGED' });
});
it('same-owner revalidation keeps the page identity but blocks writes while authority is unknown', async () => {
  commitIdentity(a); const epoch = getAuthSnapshot().epoch;
  const request = createBoundJsonRequest('https://api.example', async () => new Error());
  const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response('{"ok":true}')); vi.stubGlobal('fetch', fetch);
  markChecking(false);
  await expect(request('/private', { method: 'POST' })).rejects.toMatchObject({ code: 'AUTH_CONTEXT_UNCONFIRMED' });
  markUnavailable(); expect(getAuthSnapshot().identity).toEqual(a);
  commitIdentity(a); expect(getAuthSnapshot().epoch).toBe(epoch);
  await expect(request('/private', { method: 'POST' })).resolves.toEqual({ ok: true });
  expect(new Headers(fetch.mock.calls[0]?.[1]?.headers).get('X-Auth-User-Id')).toBe('owner-a');
  expect(new Headers(fetch.mock.calls[0]?.[1]?.headers).get('X-Auth-Session-Id')).toBe('session-a');
});
it('a server-rejected old context triggers revalidation even if cross-tab notifications were lost', async () => {
  commitIdentity(a);
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 409 })));
  const request = createBoundJsonRequest('https://api.example', async () => Object.assign(new Error('changed'), { code: 'AUTH_CONTEXT_CHANGED', status: 409 }));
  await expect(request('/private')).rejects.toMatchObject({ code: 'AUTH_CONTEXT_CHANGED' });
  expect(getAuthSnapshot().phase).toBe('checking');
});
