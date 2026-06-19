import type { components } from 'nomad-types/src/api-types';
import { AuthApiError, getApiBaseUrl } from '../auth/api';

export type UserKeyStatusResponse = components['schemas']['UserKeyStatusResponse'];
export type ByokValidateRequest = components['schemas']['ByokValidateRequest'];
export type ByokValidateResponse = components['schemas']['ByokValidateResponse'];
export type ByokSaveRequest = components['schemas']['ByokSaveRequest'];
export type AccountTaskResponse = components['schemas']['AccountTaskResponse'];
export type FeedbackLinkResponse = components['schemas']['FeedbackLinkResponse'];

export type SettingsApiClient = {
  getByokStatus: () => Promise<UserKeyStatusResponse>;
  validateByok: (request: ByokValidateRequest) => Promise<ByokValidateResponse>;
  saveByok: (request: ByokSaveRequest) => Promise<UserKeyStatusResponse>;
  deleteByok: () => Promise<void>;
  requestDataExport: () => Promise<AccountTaskResponse>;
  requestAccountDeletion: () => Promise<AccountTaskResponse>;
  getFeedbackLink: (filters?: { source?: string }) => Promise<FeedbackLinkResponse>;
};

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
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function feedbackQuery(filters?: { source?: string }) {
  const search = new URLSearchParams();
  if (filters?.source) search.set('source', filters.source);
  const value = search.toString();
  return value ? `?${value}` : '';
}

export function createSettingsApiClient(baseUrl = getApiBaseUrl()): SettingsApiClient {
  return {
    getByokStatus: () => requestJson<UserKeyStatusResponse>(baseUrl, '/user-key'),
    validateByok: (body) => requestJson<ByokValidateResponse>(baseUrl, '/byok/validate', { method: 'POST', body: JSON.stringify(body) }),
    saveByok: (body) => requestJson<UserKeyStatusResponse>(baseUrl, '/user-key', { method: 'POST', body: JSON.stringify(body) }),
    deleteByok: () => requestJson<void>(baseUrl, '/user-key', { method: 'DELETE' }),
    requestDataExport: () => requestJson<AccountTaskResponse>(baseUrl, '/account/export', { method: 'POST' }),
    requestAccountDeletion: () => requestJson<AccountTaskResponse>(baseUrl, '/account', { method: 'DELETE' }),
    getFeedbackLink: (filters) => requestJson<FeedbackLinkResponse>(baseUrl, `/feedback/link${feedbackQuery(filters)}`),
  };
}
