import { nativeCall, nativeExpected, nativeResponse, NomadNativeAuth, usesNativeAuth } from './native';
import { createBoundJsonRequest, withAuthenticationLock } from './transport';
import type { PublicIdentity } from './session-context';
import type { components } from 'nomad-types/src/api-types';

export type LoginMethod = components['schemas']['LoginMethod'];
export type AuthConfigResponse = components['schemas']['AuthConfigResponse'];
export type OtpStartRequest = components['schemas']['OtpStartRequest'];
export type OtpStartResponse = components['schemas']['OtpStartResponse'];
export type OtpVerifyRequest = components['schemas']['OtpVerifyRequest'];
export type OtpVerifyResponse = components['schemas']['OtpVerifyResponse'];
export type CurrentUserResponse = components['schemas']['CurrentUserResponse'] & { native_generation?: number };

export type AuthApiClient = {
  getConfig: () => Promise<AuthConfigResponse>;
  startOtp: (request: OtpStartRequest) => Promise<OtpStartResponse>;
  verifyOtp: (request: OtpVerifyRequest) => Promise<OtpVerifyResponse>;
  getCurrentUser: (options?: { signal?: AbortSignal }) => Promise<CurrentUserResponse>;
};

export class AuthApiError extends Error {
  status: number;
  code: string;
  retriable: boolean;
  retryAfterSec?: number;

  constructor(message: string, options: { status: number; code?: string; retriable?: boolean; retryAfterSec?: number }) {
    super(message);
    this.name = 'AuthApiError';
    this.status = options.status;
    this.code = options.code ?? 'AUTH_REQUEST_FAILED';
    this.retriable = options.retriable ?? false;
    this.retryAfterSec = options.retryAfterSec;
  }
}

const DEFAULT_API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3000' : '/api';

export function getApiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
  return configured.replace(/\/+$/, '');
}

function parseRetryAfter(value: string | null) {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds > 0) return seconds;
  const dateMs = Date.parse(value);
  if (!Number.isFinite(dateMs)) return undefined;
  return Math.max(1, Math.ceil((dateMs - Date.now()) / 1000));
}

async function parseError(response: Response) {
  const retryAfter = parseRetryAfter(response.headers.get('Retry-After'));
  try {
    const body = (await response.json()) as {
      error_code?: string;
      error_message?: string;
      retriable?: boolean;
      retry_after_sec?: number;
      details?: { retry_after_sec?: number };
    };
    const bodyRetryAfter = body.retry_after_sec ?? body.details?.retry_after_sec;
    return new AuthApiError(body.error_message || response.statusText, {
      status: response.status,
      code: body.error_code,
      retriable: body.retriable,
      retryAfterSec: Number.isFinite(bodyRetryAfter) ? bodyRetryAfter : retryAfter,
    });
  } catch {
    return new AuthApiError(response.statusText || 'Request failed', {
      status: response.status,
      retryAfterSec: retryAfter,
    });
  }
}

export function createAuthApiClient(baseUrl = getApiBaseUrl()): AuthApiClient {
  if (usesNativeAuth()) {
    const scope = nativeExpected();
    const call = async <T>(operation: () => Promise<T>): Promise<T> => {
      try { return await nativeCall(operation); }
      catch (error) {
        const fault = error as { status?: number; code?: string };
        throw new AuthApiError('Native authentication unavailable', { status: fault.status ?? 503, code: fault.code });
      }
    };
    const json = async <T>(operation: () => Promise<import('@nomad/native-auth').NativeResponse>): Promise<T> => {
      const response = nativeResponse(await call(operation));
      if (!response.ok) throw await parseError(response);
      return response.json() as Promise<T>;
    };
    return {
      getConfig: () => json(() => NomadNativeAuth.getConfig()),
      getCurrentUser: () => call(() => NomadNativeAuth.getCurrentUser()),
      startOtp: (request) => {
        if (!request.request_id) return Promise.reject(new AuthApiError('Invalid request', { status: 400, code: 'AUTH_PARAMS_INVALID' }));
        return withAuthenticationLock(() => json(() => NomadNativeAuth.startOtp({ request: { ...request, request_id: request.request_id! }, expected: scope })));
      },
      verifyOtp: (request) => {
        if (!request.challenge_id) return Promise.reject(new AuthApiError('Invalid request', { status: 400, code: 'AUTH_PARAMS_INVALID' }));
        return withAuthenticationLock(() => call(() => NomadNativeAuth.verifyOtp({ request: { ...request, challenge_id: request.challenge_id! }, expected: scope })));
      },
    };
  }
  const bound = createBoundJsonRequest(baseUrl, parseError);
  const probe = createBoundJsonRequest(baseUrl, parseError, { probe: true });
  return {
    getConfig: () => probe<AuthConfigResponse>('/auth/config'),
    startOtp: (body) => withAuthenticationLock(() => bound<OtpStartResponse>('/auth/otp/start', { method: 'POST', body: JSON.stringify(body) })),
    verifyOtp: (body) => withAuthenticationLock(() => bound<OtpVerifyResponse>('/auth/otp/verify', { method: 'POST', body: JSON.stringify(body) })),
    getCurrentUser: (options) => probe<CurrentUserResponse>('/me', { signal: options?.signal }),
  };
}

export function logoutCurrentSession(operationId: string, identity: PublicIdentity, baseUrl = getApiBaseUrl()) {
  if (usesNativeAuth()) return withAuthenticationLock(() => nativeCall(() => NomadNativeAuth.logout({ operationId,
    expected: { ownerId: identity.ownerId, sessionId: identity.sessionId, generation: identity.nativeGeneration ?? 0 },
  })));
  const receipt = createBoundJsonRequest(baseUrl, parseError, { probe: true });
  return withAuthenticationLock(() => receipt<{ ok: boolean }>('/logout', {
    method: 'POST', body: JSON.stringify({ operation_id: operationId }),
    headers: { 'X-Auth-User-Id': identity.ownerId, 'X-Auth-Session-Id': identity.sessionId },
  }));
}
