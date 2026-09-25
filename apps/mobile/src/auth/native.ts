import { NomadNativeAuth, type NativeExpectedIdentity, type NativeResponse } from '@nomad/native-auth';
import { Capacitor } from '@capacitor/core';
import { getAuthSnapshot, type AuthSnapshot } from './session-context';

export const usesNativeAuth = () => Capacitor.isNativePlatform();
export function nativeExpected(scope: AuthSnapshot = getAuthSnapshot()): NativeExpectedIdentity {
  return { ownerId: scope.identity?.ownerId ?? 'anonymous', sessionId: scope.identity?.sessionId ?? 'anonymous', generation: scope.identity?.nativeGeneration ?? 0 };
}
export function nativeResponse(response: NativeResponse): Response {
  return new Response(response.status === 204 ? null : response.body, { status: response.status, headers: response.headers });
}
export async function nativeCall<T>(operation: () => Promise<T>): Promise<T> {
  try { return await operation(); }
  catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : 'AUTH_NATIVE_UNAVAILABLE';
    // Only a confirmed native /me rejection can establish logout; bridge failures are availability failures.
    throw Object.assign(new Error('Native authentication unavailable'), {
      code, status: ['AUTH_SESSION_EXPIRED','AUTH_OTP_INVALID','AUTH_OTP_EXPIRED'].includes(code) ? 401
        : ['AUTH_CONTEXT_CHANGED','AUTH_OTP_VERIFICATION_IN_PROGRESS','AUTH_SEND_IN_PROGRESS'].includes(code) ? 409
        : ['AUTH_RATE_LIMITED','AUTH_PROVIDER_RATE_LIMITED','AUTH_OTP_RETRY_LATER','AUTH_OTP_ATTEMPTS_EXCEEDED'].includes(code) ? 429
        : ['AUTH_PARAMS_INVALID','AUTH_CAPTCHA_FAILED','AUTH_CAPTCHA_REPLAY'].includes(code) ? 400
        : ['AUTH_ACCOUNT_UNAVAILABLE','AUTH_CHANNEL_REJECTED'].includes(code) ? 403 : 503,
    });
  }
}
export { NomadNativeAuth };
