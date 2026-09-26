import { createBoundJsonRequest } from '../auth/transport';
import { getAuthSnapshot } from '../auth/session-context';
import {watchBoundDurableStream,type OrderedStreamHandlers} from '../auth/ordered-stream';
import {parseIngestEvent,parseIngestControl,parseIngestRecovery,IngestProtocolError,type IngestRecovery} from './ingest-protocol';
import { watchBoundStream } from '../auth/stream';
import type { components } from 'nomad-types/src/api-types';
import { AuthApiError, getApiBaseUrl } from '../auth/api';

export type HomeInputParseRequest = components['schemas']['HomeInputParseRequest'];
export type HomeInputParseResponse = components['schemas']['HomeInputParseResponse'];
export type IngestXhsRequest = components['schemas']['IngestXhsRequest'];
export type IngestStartResponse = components['schemas']['IngestStartResponse'];
export type IngestSnapshot = components['schemas']['IngestSnapshot'];
export type IngestAcceptedResponse = components['schemas']['IngestAcceptedResponse'];
export type IngestRetryRequest = components['schemas']['IngestRetryRequest'];
export type LibraryCitySummary = components['schemas']['LibraryCitySummary'];
export type LibraryCitiesResponse = components['schemas']['LibraryCitiesResponse'];
export type LibraryInspirationItem = components['schemas']['LibraryInspirationItem'];
export type LibraryInspirationsResponse = components['schemas']['LibraryInspirationsResponse'];
export type LibraryCandidate = components['schemas']['LibraryCandidate'];
export type LibraryCandidatesResponse = components['schemas']['LibraryCandidatesResponse'];
export type LibraryImportRecordItem = components['schemas']['LibraryImportRecordItem'];
export type LibraryImportRecordsResponse = components['schemas']['LibraryImportRecordsResponse'];
export type LibraryImportRecordDetail = components['schemas']['LibraryImportRecordDetail'];
export type PlannerHandoff = components['schemas']['PlannerHandoff'];
export type PlannerHandoffSelectedItem = components['schemas']['PlannerHandoffSelectedItem'];

export type HomeApiClient = {
  getCities: () => Promise<LibraryCitiesResponse>;
  getInspirations: (filters?: { cityId?: string; locateStatus?: 'resolved' | 'pending' }) => Promise<LibraryInspirationsResponse>;
  getCandidates: (inspirationId: string) => Promise<LibraryCandidatesResponse>;
  getImportRecords?: (input?: { limit?: number; cursor?: string }, signal?: AbortSignal) => Promise<LibraryImportRecordsResponse>;
  getImportRecordDetail?: (recordId: string, signal?: AbortSignal) => Promise<LibraryImportRecordDetail>;
  parseInput: (request: HomeInputParseRequest) => Promise<HomeInputParseResponse>;
  startIngest: (request: IngestXhsRequest) => Promise<IngestStartResponse>;
  getIngestResult?: (jobId: string) => Promise<LibraryInspirationItem>;
  getIngestSnapshot?: (jobId: string) => Promise<IngestSnapshot>;
  getIngestCommand?: (operationId: string) => Promise<IngestAcceptedResponse>;
  retryIngest?: (jobId: string, request: IngestRetryRequest) => Promise<IngestAcceptedResponse>;
  getIngestRecovery?: (jobId:string,input:{mode:'replay'|'resync';cursor?:string},signal?:AbortSignal)=>Promise<IngestRecovery>;
  watchDurableIngest?: (jobId:string,handlers:OrderedStreamHandlers)=>()=>void;
  watchIngest?: (jobId: string, onSnapshot: (snapshot: IngestSnapshot) => boolean, onError: () => void) => () => void;
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


function queryString(filters?: { cityId?: string; locateStatus?: 'resolved' | 'pending' }) {
  const search = new URLSearchParams();
  if (filters?.cityId) search.set('city_id', filters.cityId);
  if (filters?.locateStatus) search.set('locate_status', filters.locateStatus);
  const value = search.toString();
  return value ? `?${value}` : '';
}

export function createHomeApiClient(baseUrl: string = getApiBaseUrl() as string): HomeApiClient {
  const scope = getAuthSnapshot();
  const bound = createBoundJsonRequest(baseUrl, parseError);
  const requestJson = <T>(_baseUrl: string, path: string, init?: RequestInit) => bound<T>(path, init);
  return {
    getCities: () => requestJson<LibraryCitiesResponse>(baseUrl, '/library/cities'),
    getInspirations: (filters) => requestJson<LibraryInspirationsResponse>(baseUrl, `/library/inspirations${queryString(filters)}`),
    getCandidates: (inspirationId) => requestJson<LibraryCandidatesResponse>(baseUrl, `/library/inspirations/${encodeURIComponent(inspirationId)}/candidates`),
    getImportRecords: (input, signal) => {
      const query = new URLSearchParams();
      if (input?.limit !== undefined) query.set('limit', String(input.limit));
      if (input?.cursor) query.set('cursor', input.cursor);
      const suffix = query.toString();
      return bound<LibraryImportRecordsResponse>(`/library/import-records${suffix ? `?${suffix}` : ''}`, { signal });
    },
    getImportRecordDetail: (id, signal) => bound<LibraryImportRecordDetail>(`/library/import-records/${encodeURIComponent(id)}`, { signal }),
    parseInput: (body) => requestJson<HomeInputParseResponse>(baseUrl, '/home/input/parse', { method: 'POST', body: JSON.stringify(body) }),
    startIngest: (body) => requestJson<IngestStartResponse>(baseUrl, '/ingest/xhs', { method: 'POST', body: JSON.stringify(body) }),
    getIngestResult: (id) => bound<LibraryInspirationItem>(`/ingest/${encodeURIComponent(id)}/result`),
    getIngestSnapshot: (id) => bound<IngestSnapshot>(`/ingest/${encodeURIComponent(id)}`),
    getIngestCommand: (id) => bound<IngestAcceptedResponse>(`/ingest/commands/${encodeURIComponent(id)}`),
    retryIngest: (id, body) => bound<IngestAcceptedResponse>(`/ingest/${encodeURIComponent(id)}/retry`, { method: 'POST', body: JSON.stringify(body) }),
    getIngestRecovery: async(id,input,signal)=>{
      const query=new URLSearchParams({mode:input.mode});if(input.cursor)query.set('last_event_id',input.cursor);
      const response=parseIngestRecovery(await bound<unknown>(`/ingest/${encodeURIComponent(id)}/recovery?${query}`,{signal}),id);
      if(input.mode==='resync'&&response.mode!=='resync'||response.mode==='replay'&&input.cursor!==undefined&&response.cursor!==input.cursor
        ||input.mode==='replay'&&response.mode==='resync'&&response.reason!=='retention')throw new IngestProtocolError();
      return response;
    },
    watchDurableIngest:(id,handlers)=>{
      const current=getAuthSnapshot();if(current.epoch!==scope.epoch)throw new Error('AUTH_CONTEXT_CHANGED');
      return watchBoundDurableStream(current,baseUrl,`/ingest/${encodeURIComponent(id)}/events`,{...handlers,
        onEvent:async(value,context)=>{const event=parseIngestEvent(value,id);if(context.id!==event.cursor)throw new IngestProtocolError();await handlers.onEvent(event,context);},
        onControl:async(value,context)=>handlers.onControl(parseIngestControl(value,id),context),
      });
    },
    watchIngest: (id, onSnapshot, onError) => watchBoundStream<components['schemas']['IngestEvent']>(scope,baseUrl,`/ingest/${encodeURIComponent(id)}/events`,'ingest',(event)=>{
      if (!event.snapshot) throw new Error('INGEST_SNAPSHOT_INVALID');
      return onSnapshot(event.snapshot);
    },onError),
  };
}
