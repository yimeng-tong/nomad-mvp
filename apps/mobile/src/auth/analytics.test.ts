import { describe, expect, it } from 'vitest';
import { sanitizeAnalyticsEvent } from '../telemetry/dictionary';

describe('sanitizeAnalyticsEvent', () => {
  it('drops sensitive key aliases without dropping reason_code', () => {
    expect(
      sanitizeAnalyticsEvent('auth_otp_verify_fail', {
        phone_number: '+8613800138000',
        captchaToken: 'captcha-ok',
        Cookie: 'sid=abc',
        reason_code: 'AUTH_REQUIRED',
        method: 'phone',
        sessionId: 'sess_123',
        candidate_confidence: 0.82,
        distance_m: 230,
        duration_sec: 45,
        internal_rank: 1,
        user_rating: 4.8,
      })?.props,
    ).toEqual({
      reason_code: 'AUTH_REQUIRED',
      method: 'phone',
    });
  });
});
