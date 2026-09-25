import type { components } from '../../../../packages/types/src/api-types.js';
import { AuthFault } from '../auth/errors.js';
import { parsingSubStages, type IngestEvent, type ParsingSubStage } from './types.js';
export type IngestSnapshot = components['schemas']['IngestSnapshot'];
export type IngestResult = components['schemas']['IngestResultSummary'];
export type IngestPatch = Partial<Pick<IngestEvent, 'state' | 'fetched_count' | 'parsed_count' | 'candidate_count' | 'stored_count' | 'error_code' | 'retriable'>> & {
  source_title?: string; partial?: boolean; result?: IngestResult; sub_stage?: ParsingSubStage;
};
const ranks = { created: 0, fetching: 1, parsing: 2, geo: 3, storing: 4, done: 5, failed: 5 };
export function initialSnapshot(id: string, attempt = 1, version = 0): IngestSnapshot {
  return { ingest_id: id, attempt, state_version: version, state: 'created', sub_stage: null, source_title: null,
    fetched_count: null, parsed_count: null, candidate_count: null, stored_count: null, result: null,
    partial: false, retriable: false, error_code: null, updated_at: new Date().toISOString(), actions: { retry: false, view: false } };
}
export function advanceSnapshot(before: IngestSnapshot, patch: IngestPatch, expectedAttempt: number): IngestSnapshot {
  const state = patch.state ?? before.state;
  if (before.attempt !== expectedAttempt) throw new AuthFault('INGEST_ATTEMPT_CHANGED', 409);
  if (before.state === 'done' || before.state === 'failed' || ranks[state] < ranks[before.state]) throw new AuthFault('INGEST_STATE_CHANGED', 409);
  if (patch.sub_stage !== undefined && (!parsingSubStages.includes(patch.sub_stage) || state !== 'parsing')) throw new AuthFault('INGEST_FACT_INVALID', 500);
  const next: IngestSnapshot = { ...before, state, state_version: before.state_version + 1, updated_at: new Date().toISOString() };
  next.sub_stage = state === 'parsing' ? patch.sub_stage ?? before.sub_stage ?? null : null;
  for (const key of ['fetched_count','parsed_count','candidate_count','stored_count'] as const) {
    const value = patch[key];
    if (value !== undefined) {
      if (!Number.isSafeInteger(value) || value < 0) throw new AuthFault('INGEST_FACT_INVALID', 500);
      next[key] = value;
    }
  }
  if (patch.source_title !== undefined) next.source_title = patch.source_title.replace(/[\p{Cc}]/gu, ' ').trim().slice(0,240) || null;
  if (patch.result) { next.result = patch.result; next.stored_count = 1; }
  if (patch.partial !== undefined) next.partial = patch.partial;
  if (patch.error_code !== undefined) next.error_code = /^INGEST_[A-Z_]{1,80}$/.test(patch.error_code) ? patch.error_code : 'INGEST_FAILED';
  next.retriable = state === 'failed' && patch.retriable === true;
  if (state === 'done' && (!next.result || !next.stored_count)) throw new AuthFault('INGEST_RESULT_MISSING', 500);
  if (state === 'failed' && next.result) next.partial = true;
  next.actions = { retry: next.retriable, view: !!next.result };
  return next;
}
export function retrySnapshot(before: IngestSnapshot, expectedAttempt: number, expectedVersion: number): IngestSnapshot {
  if (before.attempt !== expectedAttempt || before.state_version !== expectedVersion) throw new AuthFault('INGEST_STATE_CHANGED', 409);
  if (before.state !== 'failed' || !before.retriable) throw new AuthFault('INGEST_RETRY_NOT_ALLOWED', 409);
  const next = initialSnapshot(before.ingest_id, before.attempt + 1, before.state_version + 1);
  return { ...next, result: before.result, stored_count: before.stored_count, source_title: before.source_title,
    partial: !!before.result, actions: { retry: false, view: !!before.result } };
}
