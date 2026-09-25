import { beforeEach, expect, it, vi } from 'vitest';
const bridge = vi.hoisted(() => ({ request: vi.fn(), cancelRequest: vi.fn().mockResolvedValue(undefined), getCurrentUser: vi.fn(), getConfig: vi.fn(), startOtp: vi.fn(), verifyOtp: vi.fn(), logout: vi.fn() }));
vi.mock('@nomad/native-auth', () => ({ NomadNativeAuth: bridge }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
import { createAuthApiClient, logoutCurrentSession } from './api';
import { createBoundJsonRequest } from './transport';
import { commitIdentity } from './session-context';
beforeEach(() => { vi.clearAllMocks(); commitIdentity({ ownerId: 'a', sessionId: 's', nativeGeneration: 3 }); vi.stubGlobal('fetch', vi.fn()); });
it('native bridge failure never falls back to Web cookies or treats missing plugin as logout', async () => {
  bridge.getCurrentUser.mockRejectedValue({ code: 'UNIMPLEMENTED' });
  await expect(createAuthApiClient().getCurrentUser()).rejects.toMatchObject({ status: 503 });
  expect(fetch).not.toHaveBeenCalled();
});
it('business requests use the native generation and an allowlisted header contract', async () => {
  bridge.request.mockResolvedValue({ status: 200, headers: {}, body: '{"ok":true}' });
  const request = createBoundJsonRequest('https://ignored.test', async () => new Error('http'));
  expect(await request('/plan/test', { method: 'PATCH', body: '{}', headers: { Authorization: 'do-not-forward', Cookie: 'do-not-forward', 'Idempotency-Key': 'intent' } })).toEqual({ ok: true });
  expect(bridge.request).toHaveBeenCalledWith({ requestId: expect.any(String), path: '/plan/test', method: 'PATCH', body: '{}', headers: { 'Idempotency-Key': 'intent' }, expected: { ownerId: 'a', sessionId: 's', generation: 3 } });
  expect(fetch).not.toHaveBeenCalled();
});
it('native logout keeps one operation id and public identity context', async () => {
  bridge.logout.mockResolvedValue({ ok: true });
  await logoutCurrentSession('intent', { ownerId: 'a', sessionId: 's', nativeGeneration: 3 });
  expect(bridge.logout).toHaveBeenCalledWith({ operationId: 'intent', expected: { ownerId: 'a', sessionId: 's', generation: 3 } });
  expect(fetch).not.toHaveBeenCalled();
});


it('an already cancelled native mutation never enters the bridge', async () => {
  const controller = new AbortController(); controller.abort();
  const request = createBoundJsonRequest('https://ignored.test', async () => new Error('http'));
  await expect(request('/plan/test', { method: 'PATCH', body: '{}', signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
  expect(bridge.request).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
});
