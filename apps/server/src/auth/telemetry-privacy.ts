import { randomUUID } from 'node:crypto';

const safeCodes = new Set(['AUTH_AUTHORITY_UNAVAILABLE', 'AUTH_SESSION_EXPIRED', 'AUTH_CONTEXT_CHANGED',
  'AUTH_SEND_RESULT_UNKNOWN', 'AUTH_PROVIDER_UNAVAILABLE', 'AUTH_CAPTCHA_UNAVAILABLE', 'AUTH_CAPTCHA_FAILED',
  'AUTH_ACCOUNT_UNAVAILABLE', 'AUTH_OTP_INVALID', 'AUTH_OTP_EXPIRED', 'AUTH_RATE_LIMITED']);

/** Provider RPC URLs can contain phone numbers and signatures. Never forward automatic payloads. */
export function safeAuthenticationErrorEvent(event: unknown) {
  const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const values = object(object(event).exception).values;
  const raw = Array.isArray(values) && typeof object(values[0]).value === 'string' ? object(values[0]).value as string : undefined;
  return {
    type: undefined,
    event_id: randomUUID().replace(/-/g, ''), timestamp: Date.now() / 1000,
    level: 'error' as const, platform: 'node',
    exception: { values: [{ type: 'Error', value: raw && safeCodes.has(raw) ? raw : 'SERVER_ERROR' }] },
  };
}
