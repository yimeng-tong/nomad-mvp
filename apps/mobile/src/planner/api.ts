import type { components } from 'nomad-types/src/api-types';
import { AuthApiError, getApiBaseUrl } from '../auth/api';
import type { LibraryCitiesResponse, LibraryInspirationsResponse } from '../home/api';

export type PlanGenerateRequest = components['schemas']['PlanGenerateRequest'];
export type PlanGenerateResponse = components['schemas']['PlanGenerateResponse'];
export type PlannerTimeHint = components['schemas']['PlannerTimeHint'];
export type SearchPoiItem = components['schemas']['SearchPoiItem'];
export type PlanJobEvent = components['schemas']['PlanJobEvent'];
export type DayPlanResponse = components['schemas']['DayPlanResponse'];
export type EmptySlotResolveRequest = components['schemas']['EmptySlotResolveRequest'];
export type EmptySlotResolveResponse = components['schemas']['EmptySlotResolveResponse'];
export type HqStatusResponse = components['schemas']['HqStatusResponse'];
export type HqAdoptResponse = components['schemas']['HqAdoptResponse'];
export type SlotEditRequest = components['schemas']['SlotEditRequest'];
export type SlotEditResponse = components['schemas']['SlotEditResponse'];
export type PlanRecentAction = components['schemas']['PlanRecentAction'];
export type PlanRecentActionResponse = components['schemas']['PlanRecentActionResponse'];
export type PlanEditUndoRequest = components['schemas']['PlanEditUndoRequest'];
export type PlanEditUndoResponse = components['schemas']['PlanEditUndoResponse'];

export type PlannerApiClient = {
  getCities: () => Promise<LibraryCitiesResponse>;
  getInspirations: () => Promise<LibraryInspirationsResponse>;
  searchPoi: (request: { city: string; q: string; topk?: number }) => Promise<{ items?: SearchPoiItem[] }>;
  generatePlan: (request: PlanGenerateRequest) => Promise<PlanGenerateResponse>;
  watchPlanJob: (request: {
    sseUrl: string;
    onEvent: (event: PlanJobEvent) => void;
    onError: () => void;
  }) => () => void;
  getPlan: (planId: string) => Promise<DayPlanResponse>;
  getPlanVersion: (planId: string, versionId: string) => Promise<DayPlanResponse>;
  resolveEmptySlot: (
    planId: string,
    slotId: string,
    request: EmptySlotResolveRequest,
  ) => Promise<EmptySlotResolveResponse>;
  editSlot: (planId: string, slotId: string, request: SlotEditRequest) => Promise<SlotEditResponse>;
  getRecentAction: (planId: string, dayIndex: number) => Promise<PlanRecentActionResponse>;
  undoEdit: (planId: string, request: PlanEditUndoRequest) => Promise<PlanEditUndoResponse>;
  resetSeed: (planId: string, expectedPlanRev: number) => Promise<{ plan_id: string; plan_rev: number }>;
  undoSeed: (
    planId: string,
    expectedPlanRev: number,
    undoToken: string,
  ) => Promise<{ plan_id: string; plan_rev: number }>;
  getHqStatus: (hqJobId: string) => Promise<HqStatusResponse>;
  adoptHq: (request: {
    plan_id: string;
    hq_job_id: string;
    expected_plan_rev: number;
  }) => Promise<HqAdoptResponse>;
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
    generatePlan: (body) => requestJson<PlanGenerateResponse>(baseUrl, '/plan/generate', {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify(body),
    }),
    watchPlanJob: ({ sseUrl, onEvent, onError }) => {
      const source = new EventSource(`${baseUrl}${sseUrl}`, { withCredentials: true });
      source.addEventListener('plan', (message) => {
        try {
          const event = JSON.parse((message as MessageEvent<string>).data) as PlanJobEvent;
          if (event.phase === 'done' || event.phase === 'failed') source.close();
          onEvent(event);
        } catch {
          onError();
        }
      });
      source.onerror = () => {
        if (source.readyState !== EventSource.CLOSED) onError();
      };
      return () => source.close();
    },
    getPlan: (planId) => requestJson<DayPlanResponse>(baseUrl, `/plan/${encodeURIComponent(planId)}`),
    getPlanVersion: (planId, versionId) =>
      requestJson<DayPlanResponse>(
        baseUrl,
        `/plan/${encodeURIComponent(planId)}/versions/${encodeURIComponent(versionId)}`,
      ),
    resolveEmptySlot: (planId, slotId, body) =>
      requestJson<EmptySlotResolveResponse>(
        baseUrl,
        `/plan/${encodeURIComponent(planId)}/slots/${encodeURIComponent(slotId)}/resolve`,
        { method: 'POST', body: JSON.stringify(body) },
      ),
    editSlot: (planId, slotId, body) =>
      requestJson<SlotEditResponse>(
        baseUrl,
        `/plan/${encodeURIComponent(planId)}/slots/${encodeURIComponent(slotId)}`,
        { method: 'PATCH', body: JSON.stringify(body) },
      ),
    getRecentAction: (planId, dayIndex) =>
      requestJson<PlanRecentActionResponse>(
        baseUrl,
        `/plan/${encodeURIComponent(planId)}/recent-actions?day_index=${dayIndex}`,
      ),
    undoEdit: (planId, body) =>
      requestJson<PlanEditUndoResponse>(
        baseUrl,
        `/plan/${encodeURIComponent(planId)}/edits/undo`,
        { method: 'POST', body: JSON.stringify(body) },
      ),
    resetSeed: (planId, expectedPlanRev) =>
      requestJson(baseUrl, `/plan/${encodeURIComponent(planId)}/seed/reset`, {
        method: 'POST',
        body: JSON.stringify({ expected_plan_rev: expectedPlanRev }),
      }),
    undoSeed: (planId, expectedPlanRev, undoToken) =>
      requestJson(baseUrl, `/plan/${encodeURIComponent(planId)}/seed/undo`, {
        method: 'POST',
        body: JSON.stringify({ expected_plan_rev: expectedPlanRev, undo_token: undoToken }),
      }),
    getHqStatus: (hqJobId) =>
      requestJson<HqStatusResponse>(baseUrl, `/plan/hq/status?hq_job_id=${encodeURIComponent(hqJobId)}`),
    adoptHq: (body) =>
      requestJson<HqAdoptResponse>(baseUrl, '/plan/hq/adopt', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  };
}
