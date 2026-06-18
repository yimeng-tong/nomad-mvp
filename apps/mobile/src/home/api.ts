import type { components } from 'nomad-types/src/api-types';
import { AuthApiError, getApiBaseUrl } from '../auth/api';

export type HomeInputParseRequest = components['schemas']['HomeInputParseRequest'];
export type HomeInputParseResponse = components['schemas']['HomeInputParseResponse'];
export type IngestXhsRequest = components['schemas']['IngestXhsRequest'];
export type IngestStartResponse = components['schemas']['IngestStartResponse'];
export type LibraryCitySummary = components['schemas']['LibraryCitySummary'];
export type LibraryCitiesResponse = components['schemas']['LibraryCitiesResponse'];
export type LibraryInspirationItem = components['schemas']['LibraryInspirationItem'];
export type LibraryInspirationsResponse = components['schemas']['LibraryInspirationsResponse'];
export type LibraryCandidate = components['schemas']['LibraryCandidate'];
export type LibraryCandidatesResponse = components['schemas']['LibraryCandidatesResponse'];
export type PlannerHandoff = components['schemas']['PlannerHandoff'];
export type PlannerHandoffSelectedItem = components['schemas']['PlannerHandoffSelectedItem'];

export type HomeApiClient = {
  getCities: () => Promise<LibraryCitiesResponse>;
  getInspirations: (filters?: { cityId?: string; locateStatus?: 'resolved' | 'pending' }) => Promise<LibraryInspirationsResponse>;
  getCandidates: (inspirationId: string) => Promise<LibraryCandidatesResponse>;
  parseInput: (request: HomeInputParseRequest) => Promise<HomeInputParseResponse>;
  startIngest: (request: IngestXhsRequest) => Promise<IngestStartResponse>;
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
  return (await response.json()) as T;
}

function queryString(filters?: { cityId?: string; locateStatus?: 'resolved' | 'pending' }) {
  const search = new URLSearchParams();
  if (filters?.cityId) search.set('city_id', filters.cityId);
  if (filters?.locateStatus) search.set('locate_status', filters.locateStatus);
  const value = search.toString();
  return value ? `?${value}` : '';
}

export function createHomeApiClient(baseUrl = getApiBaseUrl()): HomeApiClient {
  return {
    getCities: () => requestJson<LibraryCitiesResponse>(baseUrl, '/library/cities'),
    getInspirations: (filters) => requestJson<LibraryInspirationsResponse>(baseUrl, `/library/inspirations${queryString(filters)}`),
    getCandidates: (inspirationId) => requestJson<LibraryCandidatesResponse>(baseUrl, `/library/inspirations/${encodeURIComponent(inspirationId)}/candidates`),
    parseInput: (body) => requestJson<HomeInputParseResponse>(baseUrl, '/home/input/parse', { method: 'POST', body: JSON.stringify(body) }),
    startIngest: (body) => requestJson<IngestStartResponse>(baseUrl, '/ingest/xhs', { method: 'POST', body: JSON.stringify(body) }),
  };
}
