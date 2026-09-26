import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import type { components } from '../../../../packages/types/src/api-types.js';
import { AuthFault } from '../auth/errors.js';
import { fixtureAuth, lockQualifiedOwner } from '../auth/owner.js';
import { ingestLeasePredicate, lockIngestLease, type IngestLease } from './execution-lease.js';
import { encodeIngestCursor, MAX_INGEST_SEQ } from './cursor.js';
import { parsingSubStages, type ParsingSubStage } from './types.js';
import type { IngestSnapshot } from './job-state.js';
export type DurableIngestEvent = components['schemas']['IngestDurableEvent'] & { sub_stage?: ParsingSubStage; error_code?: string; error_message?: string; retriable?: boolean };
export type EventKind = 'fact' | 'checkpoint';
type Row = Prisma.IngestJobGetPayload<{}>;
const stages = ['created','fetching','parsing','geo','storing','done','failed'];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const invalid = () => new AuthFault('INGEST_EVENT_STATE_UNAVAILABLE',503,true);
const count = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const safeTitle = (value: string) => value.replace(/https?:\/\/\S+/gi,'[链接]').replace(/[\p{Cc}]/gu,' ').trim().slice(0,240);
function eventSnapshot(value: IngestSnapshot, jobId: string, cursor: string): IngestSnapshot {
  if (!value || value.ingest_id !== `ing_${jobId}` || !count(value.attempt) || value.attempt < 1 || !count(value.state_version)
    || !stages.includes(value.state) || typeof value.partial !== 'boolean' || typeof value.retriable !== 'boolean'
    || typeof value.updated_at !== 'string' || !Number.isFinite(Date.parse(value.updated_at))
    || !value.actions || value.actions.retry !== value.retriable || value.actions.view !== !!value.result
    || value.retriable && value.state !== 'failed') throw invalid();
  const subStage = value.sub_stage ?? null;
  if (subStage !== null && (!parsingSubStages.includes(subStage) || value.state !== 'parsing')) throw invalid();
  if (value.source_title !== null && typeof value.source_title !== 'string') throw invalid();
  const result = value.result;
  if (result && (typeof result.inspiration_id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(result.inspiration_id)
    || !['resolved','pending'].includes(result.locate_status) || !count(result.asset_count)
    || result.city_name !== null && typeof result.city_name !== 'string')) throw invalid();
  const snapshot: IngestSnapshot = {
    ingest_id:value.ingest_id,attempt:value.attempt,state_version:value.state_version,state:value.state,
    head_cursor:cursor,sub_stage:subStage,source_title:value.source_title === null ? null : safeTitle(value.source_title) || null,
    partial:value.partial,retriable:value.retriable,updated_at:value.updated_at,
    error_code: typeof value.error_code === 'string' ? /^INGEST_[A-Z_]{1,80}$/.test(value.error_code) ? value.error_code : 'INGEST_FAILED' : null,
    result:result ? Object.freeze({inspiration_id:result.inspiration_id,locate_status:result.locate_status,asset_count:result.asset_count,
      city_name:result.city_name === null ? null : safeTitle(result.city_name)}) : null,
    actions:Object.freeze({retry:value.actions.retry,view:value.actions.view}),
  };
  for (const key of ['fetched_count','parsed_count','candidate_count','stored_count'] as const) {
    const valueCount = value[key] ?? null; if (valueCount !== null && !count(valueCount)) throw invalid(); snapshot[key] = valueCount;
  }
  if (snapshot.state === 'done' && (!snapshot.result || !snapshot.stored_count)) throw invalid();
  return Object.freeze(snapshot);
}
export function buildDurableIngestEvent(input: { jobId: string; streamId: string; seq: bigint; kind: EventKind; traceId: string;
  snapshot: IngestSnapshot; occurredAt: Date }): DurableIngestEvent {
  if (typeof input.jobId !== 'string' || input.jobId.length !== 36 || !uuid.test(input.jobId) || input.seq <= 0n
    || !['fact','checkpoint'].includes(input.kind) || !(input.occurredAt instanceof Date) || !Number.isFinite(input.occurredAt.getTime())) throw invalid();
  const cursor = encodeIngestCursor(input.streamId,input.seq), snapshot = eventSnapshot(input.snapshot,input.jobId,cursor);
  return Object.freeze({schema_version:1,kind:input.kind,seq:input.seq.toString(),cursor,stage:snapshot.state,state:snapshot.state,
    ingest_id:snapshot.ingest_id,trace_id:typeof input.traceId === 'string' && input.traceId.length === 36 && uuid.test(input.traceId) ? input.traceId : input.jobId,
    attempt:snapshot.attempt,retry:snapshot.attempt-1,state_version:snapshot.state_version,snapshot,sub_stage:snapshot.sub_stage ?? undefined,
    occurred_at:input.occurredAt.toISOString(),ts:input.occurredAt.getTime(),
    fetched_count:snapshot.fetched_count ?? undefined,parsed_count:snapshot.parsed_count ?? undefined,
    candidate_count:snapshot.candidate_count ?? undefined,stored_count:snapshot.stored_count ?? undefined,
    error_code:snapshot.error_code ?? undefined,error_message:snapshot.error_code ? '导入暂未完成' : undefined,retriable:snapshot.retriable});
}

/** The caller supplies an already locked/qualified row and an interactive transaction. No notifications occur here. */
export async function appendSnapshotEvent(tx: Prisma.TransactionClient, before: Row, proposed: IngestSnapshot, kind: EventKind = 'fact', lease?: IngestLease) {
  if (typeof (tx as unknown as { $transaction?: unknown }).$transaction !== 'undefined') throw invalid();
  if (before.deletedAt) throw new AuthFault('INGEST_JOB_NOT_FOUND',404);
  if (kind === 'fact' && before.authVersion === null && !fixtureAuth()) throw new AuthFault('AUTH_LEGACY_OWNER_UNVERIFIED',403);
  await lockQualifiedOwner(tx,before.userId,kind === 'fact' ? before.authVersion ?? undefined : undefined);
  if (before.lastEventSeq >= MAX_INGEST_SEQ || before.lastEventSeq < 0n || proposed.state_version < before.stateVersion
    || proposed.state_version > before.stateVersion+1 || proposed.attempt < before.retryCount+1 || proposed.attempt > before.retryCount+2
    || kind === 'checkpoint' && (before.lastEventSeq !== 0n || proposed.state_version !== before.stateVersion || proposed.attempt !== before.retryCount+1)
    || kind === 'fact' && before.lastEventSeq > 0n && proposed.state_version !== before.stateVersion+1) throw invalid();
  if (kind === 'fact' && before.lastEventSeq > 0n) {
    const retry = proposed.attempt === before.retryCount+2;
    const oldSnapshot = before.snapshotJson as unknown as IngestSnapshot;
    if (retry ? before.status !== 'failed' || proposed.state !== 'created' || oldSnapshot?.retriable !== true
      : ['done','failed'].includes(before.status) || stages.indexOf(proposed.state) < stages.indexOf(before.status))
      throw new AuthFault('INGEST_STATE_CHANGED',409);
  }
  if (lease || kind === 'fact' && proposed.attempt === before.retryCount+1 && (before.executionPending || before.leaseOwner !== null)) {
    if (!lease || lease.jobId !== before.id) throw new AuthFault('INGEST_LEASE_LOST',409);
    await lockIngestLease(tx,lease);
  }
  const streamId = before.eventStreamId ?? randomUUID(), seq = before.lastEventSeq+1n;
  const occurredAt = kind === 'checkpoint' ? new Date() : new Date(proposed.updated_at);
  const event = buildDurableIngestEvent({jobId:before.id,streamId,seq,kind,traceId:before.traceId ?? before.id,snapshot:proposed,occurredAt});
  const terminal = ['done','failed'].includes(event.snapshot.state);
  const changed = lease ? {count:await tx.$executeRaw(Prisma.sql`UPDATE "IngestJob" SET
    event_stream_id=${streamId}::uuid,last_event_seq=${seq},status=${event.snapshot.state}::"IngestStatus",
    retry_count=${event.snapshot.attempt-1},state_version=${event.snapshot.state_version},
    snapshot_json=${JSON.stringify(event.snapshot)}::jsonb,last_error_code=${event.snapshot.error_code ?? null},
    updated_at=${new Date(event.snapshot.updated_at)},
    execution_pending=CASE WHEN ${terminal} THEN false ELSE execution_pending END,
    lease_owner=CASE WHEN ${terminal} THEN NULL ELSE lease_owner END,
    lease_expires_at=CASE WHEN ${terminal} THEN NULL ELSE lease_expires_at END,
    next_execution_at=CASE WHEN ${terminal} THEN NULL ELSE next_execution_at END
    WHERE ${ingestLeasePredicate(lease)} AND deleted_at IS NULL AND state_version=${before.stateVersion} AND last_event_seq=${before.lastEventSeq}
      AND event_stream_id IS NOT DISTINCT FROM ${before.eventStreamId}::uuid`)} : await tx.ingestJob.updateMany({where:{id:before.id,userId:before.userId,deletedAt:null,stateVersion:before.stateVersion,
    lastEventSeq:before.lastEventSeq,eventStreamId:before.eventStreamId},data:{eventStreamId:streamId,lastEventSeq:seq,
      ...(['done','failed'].includes(event.snapshot.state) ? {executionPending:false,leaseOwner:null,leaseExpiresAt:null,nextExecutionAt:null} : {}),
      status:event.snapshot.state,retryCount:event.snapshot.attempt-1,stateVersion:event.snapshot.state_version,
      snapshotJson:event.snapshot as Prisma.InputJsonValue,lastError:event.snapshot.error_code ?? null,updatedAt:new Date(event.snapshot.updated_at)}});
  if (changed.count !== 1) throw new AuthFault(lease ? 'INGEST_LEASE_LOST' : 'INGEST_STATE_CHANGED',409);
  await tx.ingestEventRecord.create({data:{jobId:before.id,seq,kind,attempt:event.attempt,stateVersion:event.state_version,
    stage:event.state,subStage:event.sub_stage ?? null,traceId:event.trace_id,occurredAt,snapshotJson:event.snapshot as Prisma.InputJsonValue}});
  // A record's visible state is a projection of the same committed job fact.
  // Legacy jobs without an ImportRecord are preserved until audited backfill.
  const projected = await tx.importRecord.updateMany({ where: { jobId: before.id, userId: before.userId, deletedAt: null },
    data: { status: event.snapshot.state, sourceTitle: event.snapshot.source_title,
      updatedAt: new Date(event.snapshot.updated_at) } });
  if (projected.count && event.snapshot.result) {
    const record = await tx.importRecord.findFirstOrThrow({ where: { jobId: before.id, userId: before.userId, deletedAt: null }, select: { id: true } });
    const linked = await tx.inspiration.updateMany({ where: { id: event.snapshot.result.inspiration_id,
      jobId: before.id, userId: before.userId, deletedAt: null }, data: { importRecordId: record.id } });
    if (linked.count !== 1) throw new AuthFault('INGEST_RESULT_UNAVAILABLE', 503, true);
  }
  return {event,row:await tx.ingestJob.findUniqueOrThrow({where:{id:before.id}})};
}

export function eventFromRecord(record: Prisma.IngestEventRecordGetPayload<{}>, streamId: string): DurableIngestEvent {
  if (record.schemaVersion !== 1 || !['fact','checkpoint'].includes(record.kind)) throw invalid();
  if (!record.snapshotJson || typeof record.snapshotJson !== 'object' || Array.isArray(record.snapshotJson)) throw invalid();
  const snapshot = record.snapshotJson as unknown as IngestSnapshot;
  if (snapshot.state_version !== record.stateVersion || snapshot.attempt !== record.attempt || snapshot.state !== record.stage
    || (snapshot.sub_stage ?? null) !== record.subStage) throw invalid();
  return buildDurableIngestEvent({jobId:record.jobId,streamId,seq:record.seq,kind:record.kind as EventKind,traceId:record.traceId,snapshot,occurredAt:record.occurredAt});
}
