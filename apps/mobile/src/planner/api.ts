import type { components } from 'nomad-types/src/api-types';
import { AuthApiError, getApiBaseUrl } from '../auth/api';
import type { LibraryCitiesResponse, LibraryInspirationsResponse } from '../home/api';

export type PlanGenerateRequest = components['schemas']['PlanGenerateRequest'];
export type PlanGenerateResponse = components['schemas']['PlanGenerateResponse'];
export type PlannerTimeHint = components['schemas']['PlannerTimeHint'];
export type SearchPoiItem = components['schemas']['SearchPoiItem'];

export type PlannerApiClient = {
  getCities: () => Promise<LibraryCitiesResponse>;
  getInspirations: () => Promise<LibraryInspirationsResponse>;
  searchPoi: (request: { city: string; q: string; topk?: number }) => Promise<{ items?: SearchPoiItem[] }>;
  generatePlan: (request: PlanGenerateRequest) => Promise<PlanGenerateResponse>;
};

async function parseError(response: Response) {
  try {
    const body = (await response.json()) as { error_code?: string; error_message?: string; retriable?: boolean };
    return new AuthApiError(body.error_message || response.statusText, {
      status: response.status,
      code: body.error_code,
      retriable: body.retriable,
    });
  } catch {
    return new AuthApiError(response.statusText || 'Request failed', { status: response.status });
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

export function createPlannerApiClient(baseUrl = getApiBaseUrl()): PlannerApiClient {
  return {
    getCities: () => requestJson<LibraryCitiesResponse>(baseUrl, '/library/cities'),
    getInspirations: () => requestJson<LibraryInspirationsResponse>(baseUrl, '/library/inspirations'),
    searchPoi: ({ city, q, topk = 5 }) => requestJson<{ items?: SearchPoiItem[] }>(baseUrl, `/search/poi?city=${encodeURIComponent(city)}&q=${encodeURIComponent(q)}&topk=${topk}`),
    generatePlan: (body) => requestJson<PlanGenerateResponse>(baseUrl, '/plan/generate', { method: 'POST', body: JSON.stringify(body) }),
  };
}
