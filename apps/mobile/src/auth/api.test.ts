import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthApiError, createAuthApiClient } from './api';

describe('createAuthApiClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses nested retry_after_sec from error details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error_code: 'AUTH_OTP_RETRY_LATER', details: { retry_after_sec: 42 } }), { status: 429 })),
    );

    await expect(createAuthApiClient('http://api.test').startOtp({ phone: '+8613800138000' })).rejects.toMatchObject({
      retryAfterSec: 42,
      code: 'AUTH_OTP_RETRY_LATER',
    } satisfies Partial<AuthApiError>);
  });

  it('parses HTTP-date Retry-After headers', async () => {
    const retryDate = new Date(Date.now() + 30_000).toUTCString();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 429, headers: { 'Retry-After': retryDate } })));

    try {
      await createAuthApiClient('http://api.test').startOtp({ phone: '+8613800138000' });
      throw new Error('expected request to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(AuthApiError);
      expect((error as AuthApiError).retryAfterSec).toBeGreaterThan(0);
    }
  });
});
