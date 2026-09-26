import { createHash, randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { getPrisma } from '../db/prisma.js';
import { dbOwnerId, fixtureAuth, lockJobOwner, lockQualifiedOwner, retainedSourceHashes } from '../auth/owner.js';
import { AuthFault, authAuthority } from '../auth/errors.js';
import { lockIngestLease, markIngestPending, type IngestLease } from './execution-lease.js';
import { writeIngestCheckpoint, type IngestExecutionCheckpoint } from './execution-checkpoint.js';
import { appendSnapshotEvent } from './event-log.js';
import { normalizeImportSourceUrl, type ImportUrlDecision } from './url-normalization-policy.js';
import { loadImportUrlKeyring, sealImportOriginalUrl } from './import-url-protection.js';
import { encodeIngestCursor } from './cursor.js';
import { advanceSnapshot, initialSnapshot, retrySnapshot, type IngestSnapshot } from './job-state.js';
import { refreshAnchorPoolForCity } from '../planner/anchor-pool.js';
import {
  resolveCityTimezone,
  UnsupportedPlannerCityError,
} from '../planner/city-timezones.js';
import type { RankedBranchCandidate } from './branch-rules.js';
import type { RehostedAsset, StandardizedCandidate, XhsFetchedPost } from './adapters.js';
import type { ExtractedTimeEvidence } from './evidence.js';
import type { IngestEvent, IngestWriteEvent, IngestJobRecord, IngestWarning, StoredInspirationResult } from './types.js';

type Subscriber = (event: IngestEvent) => void;
export type LibraryCitySummaryRecord = {
  city_id: string;
  name: string;
  inspiration_count: number;
  pending_count: number;
};

export type LibraryInspirationRecord = {
  id: string;
  title: string | null;
  summary: string | null;
  locate_status: 'resolved' | 'pending';
  city_id: string | null;
  city_name: string | null;
  poi_id: string | null;
  poi_name: string | null;
  poi_address: string | null;
  asset_count: number;
  candidate_count: number;
  created_at: string;
};

export type LibraryCandidateRecord = {
  candidate_id: string;
  name: string;
  address: string;
};

type MemoryInspiration = LibraryInspirationRecord & {
  user_id: string;
  asset_keys: string[];
  candidates: LibraryCandidateRecord[];
};
type CityGroupCount = {
  cityId: string | null;
  _count: { _all: number };
};
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const jobs = new Map<string, IngestJobRecord>();
const sourceHashIndex = new Map<string, string>();
const subscribers = new Map<string, Set<Subscriber>>();
const memoryInspirations = new Map<string, MemoryInspiration>();

function uuidFromStableId(value: string) {
  const hex = createHash('sha256').update(value).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export function dbUserIdFor(userId: string) {
  return dbOwnerId(userId);
}

export function sourceHashFor(userId: string, normalizedUrl: string) {
  return createHash('sha256').update(`${userId}:${normalizedUrl}`).digest('hex');
}

export function getJob(id: string) {
  return jobs.get(id);
}

type PersistedJob = Prisma.IngestJobGetPayload<{}>;
type Command = { kind: string; requestHash: string; jobId: string; attempt: number; disposition: 'created' | 'reused' | 'retried' };
const commands = new Map<string, Command>();
let memoryTail = Promise.resolve();
async function memoryAuthority<T>(work: () => Promise<T> | T): Promise<T> {
  if (!fixtureAuth()) throw new AuthFault('AUTH_AUTHORITY_UNAVAILABLE', 503, true);
  const result = memoryTail.then(work); memoryTail = result.then(() => undefined, () => undefined); return result;
}
const commandHash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function snapshotFromDb(row: PersistedJob): IngestSnapshot {
  if (row.snapshotJson) {
    const snapshot = row.snapshotJson as unknown as IngestSnapshot;
    if (snapshot.ingest_id !== `ing_${row.id}` || snapshot.attempt !== row.retryCount + 1 || snapshot.state_version !== row.stateVersion
      || snapshot.state !== row.status || !snapshot.actions || typeof snapshot.retriable !== 'boolean') throw new AuthFault('INGEST_STATE_UNAVAILABLE', 503);
    return { ...structuredClone(snapshot), ...(row.eventStreamId ? { head_cursor: encodeIngestCursor(row.eventStreamId,row.lastEventSeq) } : {}) };
  }
  return { ...initialSnapshot(`ing_${row.id}`, row.retryCount + 1, row.stateVersion), state: row.status,
    error_code: row.lastError && /^INGEST_[A-Z_]+$/.test(row.lastError) ? row.lastError : null, updated_at: row.updatedAt.toISOString() };
}
async function ensureDbEventLog(tx: Prisma.TransactionClient, row: PersistedJob): Promise<PersistedJob> {
  if (row.eventStreamId && row.lastEventSeq > 0n) return row;
  await tx.$queryRaw`SELECT id FROM "IngestJob" WHERE id=${row.id}::uuid AND "userId"=${row.userId}::uuid FOR UPDATE`;
  const current = await tx.ingestJob.findFirst({where:{id:row.id,userId:row.userId}});
  if (!current) throw new AuthFault('INGEST_JOB_NOT_FOUND',404);
  if (current.eventStreamId && current.lastEventSeq > 0n) return current;
  if (current.eventStreamId !== null || current.lastEventSeq !== 0n) throw new AuthFault('INGEST_EVENT_STATE_UNAVAILABLE',503,true);
  const snapshot = snapshotFromDb(current);
  if (!current.snapshotJson && !snapshot.result) {
    const result = await tx.inspiration.findFirst({where:{jobId:current.id,userId:current.userId},include:{assets:true,city:true}});
    if (result) {
      snapshot.result={inspiration_id:result.id,locate_status:result.locateStatus === 'resolved'?'resolved':'pending',asset_count:result.assets.length,city_name:result.city?.name ?? null};
      snapshot.stored_count=1;snapshot.source_title=result.title?.slice(0,240) ?? null;snapshot.actions.view=true;
      if (snapshot.state==='failed') snapshot.partial=true;
    }
  }
  return (await appendSnapshotEvent(tx,current,snapshot,'checkpoint')).row;
}
function hydrateJobFromDb(row: PersistedJob, fallback: { traceId: string; sourceUrl?: string; warning?: IngestWarning }) {
  const id = `ing_${row.id}`, snapshot = snapshotFromDb(row), prior = jobs.get(id);
  if (prior?.snapshot && prior.snapshot.state_version > snapshot.state_version) return prior;
  const traceId = row.traceId && (uuidPattern.test(row.traceId) || fixtureAuth() && /^[a-zA-Z0-9_-]{1,128}$/.test(row.traceId)) ? row.traceId : uuidFromStableId(`ingest-trace:${row.id}`);
  const event: IngestEvent = { ingest_id: id, trace_id: traceId, state: row.status,
    retry: row.retryCount, attempt: snapshot.attempt, state_version: snapshot.state_version, snapshot, ts: row.updatedAt.getTime() };
  const job: IngestJobRecord = { id, dbId: row.id, userId: row.userId, dbUserId: row.userId, authVersion: row.authVersion ?? undefined,
    sourceUrl: row.sourceUrl || fallback.sourceUrl || '', sourceHash: row.sourceHash, status: row.status, retryCount: row.retryCount,
    traceId, warning: fallback.warning, snapshot, legacySnapshot: row.snapshotJson === null,
    events: prior?.snapshot?.state_version === row.stateVersion ? prior.events : [...(prior?.events ?? []).filter((item)=>(item.state_version ?? -1)<row.stateVersion),event].slice(-128) };
  jobs.set(id, job); sourceHashIndex.set(row.sourceHash, id); return job;
}
function freshMemoryJob(input: { userId: string; sourceUrl: string; traceId: string; warning?: IngestWarning }): IngestJobRecord {
  const dbId = randomUUID(), id = `ing_${dbId}`, snapshot = initialSnapshot(id);
  const job: IngestJobRecord = { id, dbId, userId: input.userId, dbUserId: dbUserIdFor(input.userId), sourceUrl: input.sourceUrl,
    sourceHash: sourceHashFor(input.userId, input.sourceUrl), traceId: input.traceId, status: 'created', retryCount: 0, snapshot, warning: input.warning,
    events: [{ ingest_id: id, trace_id: input.traceId, state: 'created', attempt: 1, state_version: 0, retry: 0, snapshot, ts: Date.now() }] };
  jobs.set(id, job); sourceHashIndex.set(job.sourceHash, id); return job;
}
function replayCommand(old: Command, kind: string, hash: string) {
  if (old.kind !== kind || old.requestHash !== hash) throw new AuthFault('INGEST_COMMAND_CONFLICT', 409);
}
async function qualifyAcceptance(tx: Prisma.TransactionClient, userId: string, ownerId: string) {
  if (fixtureAuth()) { const row=await tx.user.upsert({ where: { id: ownerId }, create: { id: ownerId,authState:'active' }, update: {} }); if(row.authState!=='active')throw new AuthFault('AUTH_ACCOUNT_UNAVAILABLE',403); return row.authVersion; }
  return lockQualifiedOwner(tx, ownerId);
}
/** enqueue=false is reserved for internal isolated producer probes; HTTP never exposes that option. */
export async function acceptIngestCommand(input: { userId: string; sourceUrl: string; originalSourceUrl?: string; traceId: string; operationId: string; warning?: IngestWarning; canDispatch?: () => void; enqueue?: boolean }) {
  const ownerId = dbUserIdFor(input.userId), originalUrl = input.originalSourceUrl ?? input.sourceUrl;
  const hash = commandHash(['start', originalUrl]), db = getPrisma();
  if (!uuidPattern.test(input.operationId)) throw new AuthFault('INGEST_PARAMS_INVALID', 400);
  if (!db) return memoryAuthority(() => {
    const key = `${ownerId}:${input.operationId}`, old = commands.get(key);
    if (old) { replayCommand(old,'start',hash); return { job: jobs.get(old.jobId)!, disposition: old.disposition, shouldRun: false }; }
    const sourceHash = sourceHashFor(input.userId, input.sourceUrl), existingId = sourceHashIndex.get(sourceHash);
    if (!existingId) input.canDispatch?.();
    const job = existingId ? jobs.get(existingId)! : freshMemoryJob(input), disposition = existingId ? 'reused' as const : 'created' as const;
    commands.set(key, { kind: 'start', requestHash: hash, jobId: job.id, attempt: job.retryCount + 1, disposition });
    return { job, disposition, shouldRun: !existingId };
  });
  let decision: ImportUrlDecision | undefined;
  const accepted = await authAuthority(() => db.$transaction(async (tx) => {
    const authVersion = await qualifyAcceptance(tx, input.userId, ownerId);
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`ingest-command:${ownerId}:${input.operationId}`},0))`;
    const old = await tx.ingestCommand.findUnique({ where: { userId_operationId: { userId: ownerId, operationId: input.operationId } } });
    if (old) { const row=await tx.ingestJob.findFirst({where:{id:old.jobId,userId:ownerId}}); if(!row)throw new AuthFault('INGEST_JOB_NOT_FOUND',404);
      const source = row.sourceUrl ? undefined : await tx.importRecord.findFirst({ where: { jobId: row.id, userId: ownerId }, select: { normalizedUrl: true } });
      if (source) replayCommand(old as Command,'start',hash);
      else if (old.kind !== 'start' || old.requestHash !== hash && old.requestHash !== commandHash(['start', input.sourceUrl]))
        throw new AuthFault('INGEST_COMMAND_CONFLICT',409);
      return { row: await ensureDbEventLog(tx,row), normalizedUrl: source?.normalizedUrl, disposition: old.disposition as Command['disposition'], shouldRun: false }; }
    try { decision = normalizeImportSourceUrl(originalUrl); }
    catch { throw new AuthFault('INGEST_URL_POLICY_UNSUPPORTED', 400); }
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`import-record:${ownerId}:${decision.normalizedUrl}`},0))`;
    const sourceHash = sourceHashFor(input.userId, input.sourceUrl);
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`ingest-source:${sourceHash}`},0))`;
    const hashes = fixtureAuth() ? [sourceHash] : await retainedSourceHashes(tx, ownerId, input.sourceUrl);
    const existing = await tx.ingestJob.findMany({ where: { userId: ownerId, sourceHash: { in: hashes } }, take: 2 });
    if (existing.length > 1) throw new AuthFault('AUTH_LEGACY_DEDUP_CONFLICT',409);
    if (existing[0] && !fixtureAuth() && existing[0].authVersion === null && existing[0].status !== 'done') throw new AuthFault('AUTH_LEGACY_OWNER_UNVERIFIED',403);
    const priorRecord = await tx.importRecord.findUnique({ where: { userId_normalizedUrl: {
      userId: ownerId, normalizedUrl: decision.normalizedUrl } }, select: { jobId: true } });
    if (priorRecord && existing[0] && priorRecord.jobId !== existing[0].id) throw new AuthFault('INGEST_NORMALIZATION_CONFLICT', 409);
    const priorJob = priorRecord ? await tx.ingestJob.findFirst({ where: { id: priorRecord.jobId, userId: ownerId } }) : existing[0];
    if (priorRecord && !priorJob) throw new AuthFault('INGEST_STATE_UNAVAILABLE', 503, true);
    if (priorJob && !fixtureAuth() && priorJob.authVersion === null && priorJob.status !== 'done') throw new AuthFault('AUTH_LEGACY_OWNER_UNVERIFIED',403);
    if (!priorJob) input.canDispatch?.();
    const id = randomUUID(), recordId = randomUUID();
    let createdOrExisting = priorJob;
    if (!createdOrExisting) {
      let protectedUrl: Prisma.InputJsonValue;
      try { protectedUrl = sealImportOriginalUrl({ ownerId, recordId, originalUrl: decision.originalUrl }, loadImportUrlKeyring(process.env)) as unknown as Prisma.InputJsonValue; }
      catch { throw new AuthFault('INGEST_URL_PROTECTION_UNAVAILABLE', 503, true); }
      createdOrExisting = await tx.ingestJob.create({ data: { id, userId: ownerId, authVersion, sourceType: 'xhs', sourceUrl: null,
        sourceHash, traceId: input.traceId, status: 'created', snapshotJson: initialSnapshot(`ing_${id}`) as Prisma.InputJsonValue } });
      await tx.importRecord.create({ data: { id: recordId, userId: ownerId, jobId: id,
        normalizedUrl: decision.normalizedUrl, normalizationVersion: decision.policyVersion,
        originalUrlProtected: protectedUrl } });
    }
    let row = priorJob ? await ensureDbEventLog(tx,createdOrExisting) : (await appendSnapshotEvent(tx,createdOrExisting,snapshotFromDb(createdOrExisting))).row;
    if(!priorJob&&input.enqueue!==false)row=await markIngestPending(tx,row.id);
    const disposition = priorJob ? 'reused' as const : 'created' as const;
    await tx.ingestCommand.create({ data: { userId: ownerId, operationId: input.operationId, kind: 'start', requestHash: hash,
      jobId: row.id, attempt: row.retryCount + 1, disposition } });
    return { row, normalizedUrl: decision.normalizedUrl, disposition, shouldRun: !priorJob };
  }));
  return { job: hydrateJobFromDb(accepted.row, { ...input, sourceUrl: accepted.normalizedUrl ?? input.sourceUrl }), disposition: accepted.disposition, shouldRun: accepted.shouldRun };
}
export async function createOrGetIngestJob(input: { userId: string; sourceUrl: string; traceId: string; warning?: IngestWarning }) {
  return (await acceptIngestCommand({ ...input, operationId: randomUUID() })).job;
}
export async function getOrHydrateJob(id: string) {
  const db = getPrisma();
  if (!db) { if (!fixtureAuth()) throw new AuthFault('AUTH_AUTHORITY_UNAVAILABLE',503,true); return jobs.get(id); }
  const dbId = id.startsWith('ing_') ? id.slice(4) : id;
  if (!uuidPattern.test(dbId)) return undefined;
  const row = await authAuthority(() => db.ingestJob.findUnique({ where: { id: dbId },
    include: { importRecord: { select: { normalizedUrl: true } } } }));
  return row ? hydrateJobFromDb(row, { traceId: row.traceId || randomUUID(), sourceUrl: row.importRecord?.normalizedUrl }) : undefined;
}
export async function getIngestSnapshot(userId: string, id: string): Promise<IngestSnapshot> {
  const db = getPrisma(), ownerId = dbUserIdFor(userId), dbId = id.startsWith('ing_') ? id.slice(4) : id;
  if (!db) {
    if (!fixtureAuth()) throw new AuthFault('AUTH_AUTHORITY_UNAVAILABLE',503,true);
    const job=jobs.get(id);if(!job||job.dbUserId!==ownerId)throw new AuthFault('INGEST_JOB_NOT_FOUND',404);
    return structuredClone(job.snapshot ?? initialSnapshot(job.id));
  }
  if (!uuidPattern.test(dbId)) throw new AuthFault('INGEST_JOB_NOT_FOUND',404);
  const committed = await authAuthority(()=>db.$transaction(async tx=>{
    await lockQualifiedOwner(tx,ownerId);
    const found=await tx.ingestJob.findFirst({where:{id:dbId,userId:ownerId}});
    if(!found)throw new AuthFault('INGEST_JOB_NOT_FOUND',404);
    const row=await ensureDbEventLog(tx,found);
    const snapshot=snapshotFromDb(row);
    if(snapshot.state==='done'&&!snapshot.result)throw new AuthFault('INGEST_RESULT_UNAVAILABLE',503,true);
    return {row,snapshot};
  }));
  hydrateJobFromDb(committed.row,{traceId:committed.row.traceId || committed.row.id});
  return committed.snapshot;
}
export async function readIngestCommand(userId: string, operationId: string) {
  const ownerId = dbUserIdFor(userId), db = getPrisma();
  if (!uuidPattern.test(operationId)) throw new AuthFault('INGEST_PARAMS_INVALID',400);
  if (!db && !fixtureAuth()) throw new AuthFault('AUTH_AUTHORITY_UNAVAILABLE',503,true);
  const command = db ? await authAuthority(() => db.ingestCommand.findUnique({ where: { userId_operationId: { userId: ownerId, operationId } } })) : commands.get(`${ownerId}:${operationId}`);
  if (!command) throw new AuthFault('INGEST_COMMAND_NOT_FOUND',404);
  const jobId = command.jobId.startsWith('ing_') ? command.jobId : `ing_${command.jobId}`;
  return { operation_id: operationId, disposition: command.disposition as Command['disposition'], ingest_id: jobId,
    snapshot: await getIngestSnapshot(userId, jobId), sse_url: `/ingest/${jobId}/events` };
}
export async function retryIngestCommand(input: { userId: string; jobId: string; operationId: string; expectedAttempt: number; expectedVersion: number; canDispatch?: () => void; enqueue?: boolean }) {
  const ownerId = dbUserIdFor(input.userId), hash = commandHash(['retry',input.jobId,input.expectedAttempt,input.expectedVersion]), db = getPrisma();
  if (!uuidPattern.test(input.operationId)) throw new AuthFault('INGEST_PARAMS_INVALID',400);
  if (!db) return memoryAuthority(() => {
    const old = commands.get(`${ownerId}:${input.operationId}`);
    if (old) { replayCommand(old,'retry',hash); return { job: jobs.get(old.jobId)!, shouldRun: false, disposition: old.disposition }; }
    const before = jobs.get(input.jobId);
    if (!before || before.dbUserId !== ownerId) throw new AuthFault('INGEST_JOB_NOT_FOUND',404);
    const snapshot = retrySnapshot(before.snapshot!,input.expectedAttempt,input.expectedVersion); input.canDispatch?.();
    const job = { ...before, status: snapshot.state, snapshot, retryCount: snapshot.attempt - 1, events: [] };
    jobs.set(job.id,job); commands.set(`${ownerId}:${input.operationId}`, { kind:'retry',requestHash:hash,jobId:job.id,attempt:snapshot.attempt,disposition:'retried' });
    return { job, shouldRun: true, disposition: 'retried' as const };
  });
  const accepted = await authAuthority(() => db.$transaction(async (tx) => {
    await qualifyAcceptance(tx,input.userId,ownerId);
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`ingest-command:${ownerId}:${input.operationId}`},0))`;
    const old = await tx.ingestCommand.findUnique({ where: { userId_operationId: { userId: ownerId, operationId: input.operationId } } });
    if (old) { replayCommand(old as Command,'retry',hash); const row=await tx.ingestJob.findFirst({where:{id:old.jobId,userId:ownerId}}); if(!row)throw new AuthFault('INGEST_JOB_NOT_FOUND',404);
      const source = row.sourceUrl ? undefined : await tx.importRecord.findFirst({ where: { jobId: row.id, userId: ownerId }, select: { normalizedUrl: true } });
      return { row:await ensureDbEventLog(tx,row), sourceUrl: source?.normalizedUrl, shouldRun:false, disposition:old.disposition as Command['disposition'] }; }
    const id = input.jobId.replace(/^ing_/, ''); if (!uuidPattern.test(id)) throw new AuthFault('INGEST_JOB_NOT_FOUND',404);
    await tx.$queryRaw`SELECT id FROM "IngestJob" WHERE id=${id}::uuid AND "userId"=${ownerId}::uuid FOR UPDATE`;
    let before = await tx.ingestJob.findFirst({where:{id,userId:ownerId}});
    if (!before) throw new AuthFault('INGEST_JOB_NOT_FOUND',404);
    if (!fixtureAuth()) await lockJobOwner(tx,'IngestJob',id);
    before = await ensureDbEventLog(tx,before);
    const snapshot = retrySnapshot(snapshotFromDb(before),input.expectedAttempt,input.expectedVersion); input.canDispatch?.();
    let row = (await appendSnapshotEvent(tx,before,snapshot)).row;
    if(input.enqueue!==false)row=await markIngestPending(tx,row.id);
    await tx.ingestCommand.create({ data:{userId:ownerId,operationId:input.operationId,kind:'retry',requestHash:hash,jobId:id,attempt:snapshot.attempt,disposition:'retried'} });
    const source = row.sourceUrl ? undefined : await tx.importRecord.findFirst({ where: { jobId: row.id, userId: ownerId }, select: { normalizedUrl: true } });
    return { row, sourceUrl: source?.normalizedUrl, shouldRun:true, disposition:'retried' as const };
  }));
  return { job:hydrateJobFromDb(accepted.row,{traceId:accepted.row.traceId || randomUUID(),sourceUrl:accepted.sourceUrl}),shouldRun:accepted.shouldRun,disposition:accepted.disposition };
}
function publish(job: IngestJobRecord, event: IngestEvent) {
  const current = jobs.get(job.id) ?? job;
  if (!event.snapshot || (current.snapshot && event.snapshot.state_version < current.snapshot.state_version)
    || event.snapshot.attempt < current.retryCount + 1) return;
  const updated = { ...current, retryCount: event.snapshot.attempt - 1, status: event.state, snapshot: event.snapshot, events: [...current.events,event].slice(-128) };
  jobs.set(job.id,updated);
  const set = subscribers.get(job.id);
  for (const subscriber of [...set ?? []]) { try { subscriber(event); } catch { set?.delete(subscriber); } }
  if (!set?.size) subscribers.delete(job.id);
}
export async function appendIngestEvent(jobId: string, event: IngestWriteEvent, expectedAttempt?:number, lease?:IngestLease) {
  const db = getPrisma(), cached = jobs.get(jobId);
  if (!cached) throw new AuthFault('INGEST_JOB_NOT_FOUND',404);
  const attempt = expectedAttempt ?? cached.retryCount + 1;
  let snapshot: IngestSnapshot;
  if (!db) snapshot = await memoryAuthority(() => {
    const current = jobs.get(jobId)!; const next = advanceSnapshot(current.snapshot!,event,attempt);
    const wrapped: IngestEvent = { ...event, error_message: event.error_code ? '导入暂未完成' : undefined, ingest_id:jobId,trace_id:current.traceId,
      state:next.state,retry:attempt-1,attempt,state_version:next.state_version,snapshot:next,ts:Date.now() };
    publish(current,wrapped); return next;
  });
  else {
    const committed = await authAuthority(() => db.$transaction(async (tx) => {
      await lockJobOwner(tx,'IngestJob',cached.dbId);
      await tx.$queryRaw`SELECT id FROM "IngestJob" WHERE id=${cached.dbId}::uuid FOR UPDATE`;
      const row = await ensureDbEventLog(tx,await tx.ingestJob.findUniqueOrThrow({where:{id:cached.dbId}}));
      const next = advanceSnapshot(snapshotFromDb(row),event,attempt);
      return appendSnapshotEvent(tx,row,next,'fact',lease);
    }));
    snapshot = committed.event.snapshot;
    publish(jobs.get(jobId) ?? cached,committed.event);

  }
  return snapshot;
}

export function subscribeToIngest(jobId: string, subscriber: Subscriber) {
  const set = subscribers.get(jobId) ?? new Set<Subscriber>();
  set.add(subscriber);
  subscribers.set(jobId, set);
  return () => {
    set.delete(subscriber);
    if (set.size === 0) subscribers.delete(jobId);
  };
}

export async function persistIngestOutput(input: {
  job: IngestJobRecord;
  post: XhsFetchedPost;
  assets: RehostedAsset[];
  highConfidence?: StandardizedCandidate;
  candidates: RankedBranchCandidate[];
  timeEvidence: ExtractedTimeEvidence[];
  partial?: boolean;
  lease?: IngestLease;
  checkpoint?: IngestExecutionCheckpoint;
}): Promise<StoredInspirationResult> {
  const prisma = getPrisma();
  let highConfidence = input.highConfidence;
  let cityTimezone: string | null = null;
  if (highConfidence) {
    try {
      cityTimezone = resolveCityTimezone(highConfidence.cityName || '杭州');
    } catch (error) {
      if (!(error instanceof UnsupportedPlannerCityError)) throw error;
      highConfidence = undefined;
    }
  }
  const locateStatus = highConfidence ? 'resolved' : 'pending';
  const inspirationId = `mem_${input.job.id}`;

  if (!prisma) return memoryAuthority(() => {
    if (!fixtureAuth()) throw new AuthFault('AUTH_AUTHORITY_UNAVAILABLE',503,true);
    const current = jobs.get(input.job.id);
    if (!current || current.retryCount !== input.job.retryCount || ['done','failed'].includes(current.status)) throw new AuthFault('INGEST_ATTEMPT_CHANGED',409);
    const previous = memoryInspirations.get(inspirationId);
    const cityName = highConfidence?.cityName || previous?.city_name || null;
    const assetKeys = [...new Set([...(previous?.asset_keys ?? []),...input.assets.map(asset=>asset.cosKey)])];
    const record: MemoryInspiration = {
      id: inspirationId,
      user_id: input.job.userId,
      title: input.post.title || previous?.title || null,
      summary: input.post.text || previous?.summary || null,
      locate_status: highConfidence ? locateStatus : previous?.locate_status ?? locateStatus,
      city_id: cityName ? `mem_city_${createHash('sha1').update(cityName).digest('hex').slice(0, 10)}` : null,
      city_name: cityName,
      poi_id: highConfidence ? `mem_poi_${createHash('sha1').update(highConfidence.amapId || highConfidence.name).digest('hex').slice(0, 10)}` : previous?.poi_id ?? null,
      poi_name: highConfidence?.name ?? previous?.poi_name ?? null,
      poi_address: highConfidence?.address ?? previous?.poi_address ?? null,
      asset_keys: assetKeys,
      asset_count: assetKeys.length,
      candidate_count: input.candidates.length || previous?.candidate_count || 0,
      created_at: new Date().toISOString(),
      candidates: !input.candidates.length && previous ? previous.candidates : input.candidates.slice(0, 5).map((candidate) => ({
        candidate_id: `${inspirationId}_cand_${candidate.rank}`,
        name: candidate.name,
        address: candidate.address || '待确认地址',
      })),
    };
    const snapshot = advanceSnapshot(current.snapshot!,{source_title:record.title ?? undefined,partial:input.partial,
      result:{inspiration_id:inspirationId,locate_status:record.locate_status,asset_count:record.asset_count,city_name:record.city_name}},input.job.retryCount+1);
    memoryInspirations.set(inspirationId,record);
    publish(current,{ingest_id:current.id,trace_id:current.traceId,state:snapshot.state,attempt:snapshot.attempt,state_version:snapshot.state_version,snapshot,ts:Date.now()});
    return { inspirationId, locateStatus:record.locate_status, assetCount:record.asset_count, candidateCount:record.candidate_count,cityName:record.city_name };
  });

  return prisma.$transaction(async (tx) => {
    await lockJobOwner(tx, 'IngestJob', input.job.dbId);
    await tx.$queryRaw`SELECT id FROM "IngestJob" WHERE id=${input.job.dbId}::uuid FOR UPDATE`;
    const currentJob = await ensureDbEventLog(tx,await tx.ingestJob.findUniqueOrThrow({where:{id:input.job.dbId}}));
    if (currentJob.executionPending || currentJob.leaseOwner !== null) {
      if (!input.lease || input.lease.jobId !== currentJob.id) throw new AuthFault('INGEST_LEASE_LOST',409);
      await lockIngestLease(tx,input.lease);
    }
    if (currentJob.retryCount !== input.job.retryCount || ['done','failed'].includes(currentJob.status)) throw new AuthFault('INGEST_ATTEMPT_CHANGED',409);
    const importRecord = await tx.importRecord.findFirst({ where: { jobId: currentJob.id, userId: currentJob.userId }, select: { id: true } });
    const previous = await tx.inspiration.findUnique({where:{sourceHash:`${input.job.sourceHash}:inspiration`},include:{assets:true,city:true}});
    let cityId: string | undefined;
    let poiId: string | undefined;
    if (highConfidence && cityTimezone) {
    const cityName = highConfidence.cityName || '杭州';
    const cities = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      INSERT INTO "City" (id, name, tz)
      VALUES (${uuidFromStableId(`city:${cityName}`)}::uuid, ${cityName}, ${cityTimezone})
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `);
    cityId = cities[0]!.id;
    const canonicalId = uuidFromStableId(
      `poi:${highConfidence.amapId || highConfidence.name}`,
    );
    const poiRows = highConfidence.amapId
      ? await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          INSERT INTO "CanonicalPOI" (
            id, "cityId", name, address, amap_id, created_at, updated_at
          )
          VALUES (
            ${canonicalId}::uuid, ${cityId}::uuid, ${highConfidence.name},
            ${highConfidence.address}, ${highConfidence.amapId}, NOW(), NOW()
          )
          ON CONFLICT (amap_id) DO UPDATE
          SET name = EXCLUDED.name,
              address = EXCLUDED.address,
              "cityId" = EXCLUDED."cityId",
              updated_at = NOW()
          RETURNING id
        `)
      : await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          INSERT INTO "CanonicalPOI" (
            id, "cityId", name, address, created_at, updated_at
          )
          VALUES (
            ${canonicalId}::uuid, ${cityId}::uuid, ${highConfidence.name},
            ${highConfidence.address}, NOW(), NOW()
          )
          ON CONFLICT (id) DO UPDATE
          SET name = EXCLUDED.name,
              address = EXCLUDED.address,
              "cityId" = EXCLUDED."cityId",
              updated_at = NOW()
          RETURNING id
        `);
      poiId = poiRows[0]!.id;
    }

    const inspiration = await tx.inspiration.upsert({
    where: { sourceHash: `${input.job.sourceHash}:inspiration` },
    update: {
      jobId: input.job.dbId,
      title: input.post.title || undefined,
      text: input.post.text || undefined,
      canonicalUrl: importRecord ? null : input.job.sourceUrl,
      ...(importRecord ? { importRecordId: importRecord.id } : {}),
      locateStatus: poiId ? locateStatus : previous?.locateStatus ?? locateStatus,
      poiId: poiId ?? undefined,
      cityId: cityId ?? undefined,
    },
    create: {
      userId: input.job.dbUserId,
      jobId: input.job.dbId,
      title: input.post.title,
      text: input.post.text,
      tags: [],
      canonicalUrl: importRecord ? null : input.job.sourceUrl,
      ...(importRecord ? { importRecordId: importRecord.id } : {}),
      locateStatus,
      poiId,
      cityId,
      sourceHash: `${input.job.sourceHash}:inspiration`,
    },
  });

    // A retry's absent assets are not a deletion command. Keep committed partial output.
    for (const asset of input.assets) {
      if (previous?.assets.some((old) => old.cosKey === asset.cosKey)) continue;
      await tx.asset.create({
      data: {
        inspirationId: inspiration.id,
        kind: asset.kind,
        cosKey: asset.cosKey,
        sha256: asset.sha256,
        width: asset.width,
        height: asset.height,
        format: asset.format,
      },
    });
  }

    if (highConfidence) {
      await tx.locateCandidate.deleteMany({ where: { inspirationId: inspiration.id } });
    }

    if (!highConfidence && input.candidates.length) {
      for (const candidate of input.candidates) {
        await tx.locateCandidate.upsert({
        where: { inspirationId_rank: { inspirationId: inspiration.id, rank: candidate.rank } },
        update: { poiSnapshot: candidate },
        create: {
          inspirationId: inspiration.id,
          rank: candidate.rank,
          poiSnapshot: candidate,
        },
      });
    }
      await tx.locateCandidate.deleteMany({
      where: {
        inspirationId: inspiration.id,
        rank: { notIn: input.candidates.map((candidate) => candidate.rank) },
      },
    });
    }

    if (poiId && cityId && highConfidence) {
      await tx.$executeRaw(Prisma.sql`
        UPDATE "CanonicalPOI"
        SET latitude = ${highConfidence.lat ?? null},
            longitude = ${highConfidence.lon ?? null},
            provider = 'amap',
            verified = TRUE,
            verified_at = NOW(),
            provider_snapshot_json = ${JSON.stringify(highConfidence)}::jsonb,
            quality_grade = 'verified'::"QualityGrade",
            source_attribution = 'amap:ingest',
            updated_at = NOW()
        WHERE id = ${poiId}::uuid
      `);
    }
    if (cityTimezone && input.timeEvidence.length) await tx.$executeRaw(Prisma.sql`
      DELETE FROM "InspirationEvidence"
      WHERE inspiration_id = ${inspiration.id}::uuid
    `);
    for (const evidence of cityTimezone ? input.timeEvidence : []) {
      const evidenceRef = `${inspiration.id}:${evidence.evidenceRef}`;
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "InspirationEvidence" (
          id, inspiration_id, "poiId", date, start_local, end_local,
          timezone, time_hint, source,
          evidence_ref, source_attribution, quality, created_at, updated_at
        )
        VALUES (
          ${uuidFromStableId(evidenceRef)}::uuid, ${inspiration.id}::uuid,
          ${poiId ?? null}::uuid,
          ${evidence.date ? new Date(`${evidence.date}T00:00:00.000Z`) : null},
          ${evidence.startLocal}, ${evidence.endLocal}, ${cityTimezone},
          ${evidence.timeHint}::"PlannerTimeHint",
          ${evidence.source}::"EvidenceSource",
          ${evidenceRef}, ${importRecord ? 'xhs:owner-import' : input.job.sourceUrl},
          ${highConfidence ? 'high' : 'medium'}::"QualityGrade",
          NOW(), NOW()
        )
      `);
    }
    if (cityId && poiId) await refreshAnchorPoolForCity(tx as any, cityId);
    const assetCount = await tx.asset.count({where:{inspirationId:inspiration.id}});
    const candidateCount = await tx.locateCandidate.count({where:{inspirationId:inspiration.id}});
    const actualLocate = inspiration.locateStatus === 'resolved' ? 'resolved' as const : 'pending' as const;
    const cityName = highConfidence?.cityName ?? previous?.city?.name ?? null;
    const snapshot = advanceSnapshot(snapshotFromDb(currentJob),{ source_title:inspiration.title ?? undefined,partial:input.partial,candidate_count:candidateCount,
      result:{inspiration_id:inspiration.id,locate_status:actualLocate,asset_count:assetCount,city_name:cityName}},input.job.retryCount+1);
    if(input.checkpoint){
      if(!input.lease||input.checkpoint.phase!=='saved')throw new AuthFault('INGEST_CHECKPOINT_INVALID',503);
      await writeIngestCheckpoint(tx,currentJob,input.checkpoint,input.lease);
    }
    await appendSnapshotEvent(tx,currentJob,snapshot,'fact',input.lease);
    return { inspirationId:inspiration.id,locateStatus:actualLocate,assetCount,candidateCount,cityName };
  });
}

export function clearIngestStateForTests() {
  commands.clear();
  jobs.clear();
  sourceHashIndex.clear();
  subscribers.clear();
  memoryInspirations.clear();
}

function toLibraryItem(item: MemoryInspiration): LibraryInspirationRecord {
  const { user_id: _userId, candidates: _candidates, asset_keys: _assetKeys, ...safeItem } = item;
  return safeItem;
}

export async function listLibraryCitiesForUser(userId: string): Promise<{ cities: LibraryCitySummaryRecord[]; unlocated_count: number }> {
  const prisma = getPrisma();
  const dbUserId = dbUserIdFor(userId);

  if (!prisma) {
    const aggregate = new Map<string, LibraryCitySummaryRecord>();
    let unlocatedCount = 0;
    for (const item of memoryInspirations.values()) {
      if (item.user_id !== userId) continue;
      if (!item.city_id || !item.city_name) {
        unlocatedCount += 1;
        continue;
      }
      const current = aggregate.get(item.city_id) ?? {
        city_id: item.city_id,
        name: item.city_name,
        inspiration_count: 0,
        pending_count: 0,
      };
      current.inspiration_count += 1;
      if (item.locate_status === 'pending') current.pending_count += 1;
      aggregate.set(item.city_id, current);
    }
    return {
      cities: Array.from(aggregate.values()).sort((a, b) => b.inspiration_count - a.inspiration_count || a.name.localeCompare(b.name)),
      unlocated_count: unlocatedCount,
    };
  }

  const grouped = (await prisma.inspiration.groupBy({
    by: ['cityId'],
    where: { userId: dbUserId, cityId: { not: null } },
    _count: { _all: true },
  } as any)) as CityGroupCount[];
  const cityIds = grouped.map((entry: { cityId: string | null }) => entry.cityId).filter(Boolean) as string[];
  const cities = await prisma.city.findMany({ where: { id: { in: cityIds } } });
  const cityNames = new Map(cities.map((city: { id: string; name: string }) => [city.id, city.name]));
  const pendingByCity = (await prisma.inspiration.groupBy({
    by: ['cityId'],
    where: { userId: dbUserId, cityId: { in: cityIds }, locateStatus: 'pending' },
    _count: { _all: true },
  } as any)) as CityGroupCount[];
  const pendingCounts = new Map(pendingByCity.map((entry) => [entry.cityId, entry._count._all]));
  const unlocatedCount = await prisma.inspiration.count({ where: { userId: dbUserId, cityId: null } });

  return {
    cities: grouped
      .map((entry) => ({
        city_id: entry.cityId!,
        name: cityNames.get(entry.cityId!) || '未知城市',
        inspiration_count: entry._count._all,
        pending_count: pendingCounts.get(entry.cityId) ?? 0,
      }))
      .sort((a: LibraryCitySummaryRecord, b: LibraryCitySummaryRecord) => b.inspiration_count - a.inspiration_count || a.name.localeCompare(b.name)),
    unlocated_count: unlocatedCount,
  };
}

export async function listLibraryInspirationsForUser(userId: string, filters: { cityId?: string; locateStatus?: string; limit?: number } = {}) {
  const prisma = getPrisma();
  const dbUserId = dbUserIdFor(userId);
  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 100);

  if (!prisma) {
    return Array.from(memoryInspirations.values())
      .filter((item) => item.user_id === userId)
      .filter((item) => !filters.cityId || item.city_id === filters.cityId)
      .filter((item) => !filters.locateStatus || item.locate_status === filters.locateStatus)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit)
      .map(toLibraryItem);
  }

  const rows = await prisma.inspiration.findMany({
    where: {
      userId: dbUserId,
      ...(filters.cityId ? { cityId: filters.cityId } : {}),
      ...(filters.locateStatus ? { locateStatus: filters.locateStatus } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: libraryInclude,
  });

  return rows.map(toPrismaLibraryItem);
}

const libraryInclude = { city: true, poi: true, assets: { select: { id: true } },
  candidates: { select: { id: true } } } as const;
type LibraryRow = Prisma.InspirationGetPayload<{ include: typeof libraryInclude }>;

function toPrismaLibraryItem(row: LibraryRow): LibraryInspirationRecord {
  return {
    id: row.id,
    title: row.title,
    summary: row.text,
    locate_status: row.locateStatus === 'resolved' ? 'resolved' : 'pending',
    city_id: row.cityId,
    city_name: row.city?.name ?? null,
    poi_id: row.poiId,
    poi_name: row.poi?.name ?? null,
    poi_address: row.poi?.address ?? null,
    asset_count: row.assets.length,
    candidate_count: row.candidates.length,
    created_at: row.createdAt.toISOString(),
  };
}

export async function getIngestResult(userId: string, jobId: string): Promise<LibraryInspirationRecord> {
  const snapshot = await getIngestSnapshot(userId,jobId);
  if (!snapshot.result) throw new AuthFault('INGEST_RESULT_NOT_FOUND',404);
  const db = getPrisma(), ownerId = dbUserIdFor(userId);
  if (!db) {
    const row = memoryInspirations.get(snapshot.result.inspiration_id);
    if (!row || row.user_id !== userId) throw new AuthFault('INGEST_RESULT_NOT_FOUND',404);
    return toLibraryItem(row);
  }
  const row = await authAuthority(() => db.inspiration.findFirst({where:{id:snapshot.result!.inspiration_id,userId:ownerId},
    include:libraryInclude}));
  if (!row) throw new AuthFault('INGEST_RESULT_NOT_FOUND',404);
  return toPrismaLibraryItem(row);
}

export async function listLibraryCandidatesForUser(userId: string, inspirationId: string): Promise<LibraryCandidateRecord[] | null> {
  const prisma = getPrisma();
  const dbUserId = dbUserIdFor(userId);

  if (!prisma) {
    const item = memoryInspirations.get(inspirationId);
    if (!item || item.user_id !== userId) return null;
    if (item.locate_status !== 'pending') return null;
    return item.candidates;
  }
  if (!uuidPattern.test(inspirationId)) return null;

  const inspiration = await prisma.inspiration.findFirst({
    where: { id: inspirationId, userId: dbUserId, locateStatus: 'pending' },
    include: { candidates: { orderBy: { rank: 'asc' } } },
  });
  if (!inspiration) return null;

  return inspiration.candidates.slice(0, 5).map((candidate): LibraryCandidateRecord => {
    const raw = candidate.poiSnapshot;
    const snapshot: Record<string, unknown> = raw && typeof raw === 'object' && !Array.isArray(raw)
      ? raw as Record<string, unknown> : {};
    return {
      candidate_id: candidate.id,
      name: typeof snapshot.name === 'string' ? snapshot.name : '待确认地点',
      address: typeof snapshot.address === 'string' ? snapshot.address : '待确认地址',
    };
  });
}

/** Fail startup before advertising a runtime whose required additive schema has not been applied. */
export async function assertIngestSchema() {
  const db = getPrisma();
  if (!db) { if (!fixtureAuth()) throw new AuthFault('AUTH_AUTHORITY_UNAVAILABLE',503,true); return; }
  await authAuthority(async () => {
    await db.$queryRaw`SELECT state_version,snapshot_json,event_stream_id,last_event_seq,replay_floor_seq,execution_pending,lease_fence,lease_owner,lease_expires_at,next_execution_at,checkpoint_version,checkpoint_json,execution_failure_count,auth_version,retry_count FROM "IngestJob" LIMIT 0`;
    await db.$queryRaw`SELECT job_id,seq,snapshot_json,occurred_at FROM "IngestEventRecord" LIMIT 0`;
    await db.$queryRaw`SELECT user_id,operation_id,request_hash,job_id,attempt FROM "IngestCommand" LIMIT 0`;
    const guards = await db.$queryRaw<Array<{ok:boolean}>>`SELECT (
      EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='"IngestEventRecord"'::regclass AND conname='IngestEventRecord_pkey' AND contype='p')
      AND EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='"IngestEventRecord"'::regclass AND tgname='IngestEventRecord_no_update' AND tgenabled IN ('O','A'))
      AND (SELECT count(*) FROM pg_constraint WHERE conrelid='"IngestJob"'::regclass AND convalidated AND conname IN ('IngestJob_log_bounds_check','IngestJob_execution_bounds_check','IngestJob_lease_pair_check'))=3
    ) AS ok`;
    if (!guards[0]?.ok) throw new AuthFault('INGEST_SCHEMA_NOT_READY',503,true);
  });
}
