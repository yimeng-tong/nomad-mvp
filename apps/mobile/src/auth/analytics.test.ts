import { describe, expect, it } from 'vitest';
import { sanitizeAnalyticsProps } from './analytics';

describe('sanitizeAnalyticsProps', () => {
  it('drops sensitive key aliases without dropping reason_code', () => {
    expect(
      sanitizeAnalyticsProps({
        phone_number: '+8613800138000',
        captchaToken: 'captcha-ok',
        Cookie: 'sid=abc',
        reason_code: 'AUTH_REQUIRED',
        method: 'phone',
        sessionId: 'sess_123',
      }),
    ).toEqual({
      reason_code: 'AUTH_REQUIRED',
      method: 'phone',
    });
  });
});
