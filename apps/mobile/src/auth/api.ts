import type { components } from 'nomad-types/src/api-types';

export type LoginMethod = components['schemas']['LoginMethod'];
export type AuthConfigResponse = components['schemas']['AuthConfigResponse'];
export type OtpStartRequest = components['schemas']['OtpStartRequest'];
export type OtpStartResponse = components['schemas']['OtpStartResponse'];
export type OtpVerifyRequest = components['schemas']['OtpVerifyRequest'];
export type OtpVerifyResponse = components['schemas']['OtpVerifyResponse'];
export type CurrentUserResponse = components['schemas']['CurrentUserResponse'];

export type AuthApiClient = {
  getConfig: () => Promise<AuthConfigResponse>;
  startOtp: (request: OtpStartRequest) => Promise<OtpStartResponse>;
  verifyOtp: (request: OtpVerifyRequest) => Promise<OtpVerifyResponse>;
  getCurrentUser: () => Promise<CurrentUserResponse>;
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

const DEFAULT_API_BASE_URL = 'http://localhost:3000';

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

async function requestJson<T>(baseUrl: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) throw await parseError(response);
  return (await response.json()) as T;
}

export function createAuthApiClient(baseUrl = getApiBaseUrl()): AuthApiClient {
  return {
    getConfig: () => requestJson<AuthConfigResponse>(baseUrl, '/auth/config'),
    startOtp: (body) => requestJson<OtpStartResponse>(baseUrl, '/auth/otp/start', { method: 'POST', body: JSON.stringify(body) }),
    verifyOtp: (body) => requestJson<OtpVerifyResponse>(baseUrl, '/auth/otp/verify', { method: 'POST', body: JSON.stringify(body) }),
    getCurrentUser: () => requestJson<CurrentUserResponse>(baseUrl, '/me'),
  };
}
