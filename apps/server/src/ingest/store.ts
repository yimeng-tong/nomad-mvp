import { createHash, randomUUID } from 'node:crypto';
import { getPrisma } from '../db/prisma.js';
import type { RankedBranchCandidate } from './branch-rules.js';
import type { RehostedAsset, StandardizedCandidate, XhsFetchedPost } from './adapters.js';
import type { IngestEvent, IngestJobRecord, IngestStage, IngestWarning, StoredInspirationResult } from './types.js';

type Subscriber = (event: IngestEvent) => void;

const jobs = new Map<string, IngestJobRecord>();
const sourceHashIndex = new Map<string, string>();
const subscribers = new Map<string, Set<Subscriber>>();

function uuidFromStableId(value: string) {
  const hex = createHash('sha256').update(value).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export function dbUserIdFor(userId: string) {
  return uuidFromStableId(userId);
}

export function sourceHashFor(userId: string, normalizedUrl: string) {
  return createHash('sha256').update(`${userId}:${normalizedUrl}`).digest('hex');
}

export function getJob(id: string) {
  return jobs.get(id);
}

function hydrateJobFromDb(persisted: {
  id: string;
  userId: string;
  sourceUrl: string | null;
  sourceHash: string;
  status: string;
  retryCount: number;
  lastError: string | null;
  traceId: string | null;
}, fallback: { traceId: string; sourceUrl?: string; warning?: IngestWarning }) {
  const id = `ing_${persisted.id}`;
  const status = persisted.status as IngestStage;
  const traceId = persisted.traceId || fallback.traceId;
  const event: IngestEvent = {
    trace_id: traceId,
    ingest_id: id,
    state: status,
    retry: persisted.retryCount,
    error_code: persisted.lastError ?? undefined,
    ts: Date.now(),
  };
  const job: IngestJobRecord = {
    id,
    dbId: persisted.id,
    userId: persisted.userId,
    dbUserId: persisted.userId,
    sourceUrl: persisted.sourceUrl || fallback.sourceUrl || '',
    sourceHash: persisted.sourceHash,
    status,
    traceId,
    retryCount: persisted.retryCount,
    warning: fallback.warning,
    events: [event],
  };
  jobs.set(id, job);
  sourceHashIndex.set(persisted.sourceHash, id);
  return job;
}

export async function getOrHydrateJob(id: string) {
  const job = jobs.get(id);
  if (job) return job;

  const prisma = getPrisma();
  const dbId = id.startsWith('ing_') ? id.slice(4) : id;
  if (!prisma || !dbId) return undefined;

  const persisted = await prisma.ingestJob.findUnique({ where: { id: dbId } }).catch(() => null);
  if (!persisted) return undefined;
  return hydrateJobFromDb(persisted, { traceId: persisted.traceId || randomUUID() });
}

export async function createOrGetIngestJob(input: {
  userId: string;
  sourceUrl: string;
  traceId: string;
  warning?: IngestWarning;
}) {
  const dbUserId = uuidFromStableId(input.userId);
  const sourceHash = sourceHashFor(input.userId, input.sourceUrl);
  const existingId = sourceHashIndex.get(sourceHash);
  if (existingId) return jobs.get(existingId)!;

  let dbId = randomUUID();
  let id = `ing_${dbId}`;
  const prisma = getPrisma();
  if (prisma) {
    await prisma.user.upsert({
      where: { id: dbUserId },
      update: {},
      create: { id: dbUserId },
    });
    const existing = await prisma.ingestJob.findUnique({ where: { sourceHash } });
    if (existing) return hydrateJobFromDb(existing, { traceId: input.traceId, sourceUrl: input.sourceUrl, warning: input.warning });

    const persisted = await prisma.ingestJob.create({
      data: {
        id: dbId,
        userId: dbUserId,
        sourceType: 'xhs',
        sourceUrl: input.sourceUrl,
        sourceHash,
        status: 'created' as any,
        traceId: input.traceId,
      },
    });
    dbId = persisted.id as typeof dbId;
    id = `ing_${dbId}`;
  }

  const event: IngestEvent = {
    trace_id: input.traceId,
    ingest_id: id,
    state: 'created',
    retry: 0,
    ts: Date.now(),
  };
  const job: IngestJobRecord = {
    id,
    dbId,
    userId: input.userId,
    dbUserId,
    sourceUrl: input.sourceUrl,
    sourceHash,
    status: 'created',
    traceId: input.traceId,
    retryCount: 0,
    warning: input.warning,
    events: [event],
  };
  jobs.set(id, job);
  sourceHashIndex.set(sourceHash, id);

  return job;
}

export async function appendIngestEvent(jobId: string, event: Omit<IngestEvent, 'ingest_id' | 'trace_id' | 'ts'> & { ts?: number }) {
  const job = jobs.get(jobId);
  if (!job) return;
  const next: IngestEvent = {
    trace_id: job.traceId,
    ingest_id: job.id,
    retry: job.retryCount,
    ...event,
    ts: event.ts ?? Date.now(),
  };
  job.status = next.state;
  job.events.push(next);
  const set = subscribers.get(jobId);
  for (const subscriber of Array.from(set ?? [])) {
    try {
      subscriber(next);
    } catch {
      set?.delete(subscriber);
    }
  }
  if (set?.size === 0) subscribers.delete(jobId);

  const prisma = getPrisma();
  if (prisma) {
    await prisma.ingestJob.update({
      where: { id: job.dbId },
      data: {
        status: next.state as any,
        retryCount: job.retryCount,
        lastError: next.error_code,
      } as any,
    }).catch(() => undefined);
  }
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
}): Promise<StoredInspirationResult> {
  const prisma = getPrisma();
  const locateStatus = input.highConfidence ? 'resolved' : 'pending';
  const inspirationId = `mem_${input.job.id}`;

  if (!prisma) {
    return {
      inspirationId,
      locateStatus,
      assetCount: input.assets.length,
      candidateCount: input.candidates.length,
    };
  }

  let cityId: string | undefined;
  let poiId: string | undefined;
  if (input.highConfidence) {
    const city = await prisma.city.upsert({
      where: { id: uuidFromStableId(`city:${input.highConfidence.cityName || '杭州'}`) },
      update: {},
      create: { id: uuidFromStableId(`city:${input.highConfidence.cityName || '杭州'}`), name: input.highConfidence.cityName || '杭州' },
    });
    cityId = city.id;
    const poi = await prisma.canonicalPOI.upsert({
      where: { id: uuidFromStableId(`poi:${input.highConfidence.amapId || input.highConfidence.name}`) },
      update: {
        name: input.highConfidence.name,
        address: input.highConfidence.address,
        amapId: input.highConfidence.amapId,
      },
      create: {
        id: uuidFromStableId(`poi:${input.highConfidence.amapId || input.highConfidence.name}`),
        cityId,
        name: input.highConfidence.name,
        address: input.highConfidence.address,
        amapId: input.highConfidence.amapId,
      },
    });
    poiId = poi.id;
  }

  const inspiration = await prisma.inspiration.upsert({
    where: { sourceHash: `${input.job.sourceHash}:inspiration` },
    update: {
      jobId: input.job.dbId,
      title: input.post.title,
      text: input.post.text,
      canonicalUrl: input.job.sourceUrl,
      locateStatus,
      poiId: poiId ?? null,
      cityId: cityId ?? null,
    } as any,
    create: {
      userId: input.job.dbUserId,
      jobId: input.job.dbId,
      title: input.post.title,
      text: input.post.text,
      tags: [],
      canonicalUrl: input.job.sourceUrl,
      locateStatus,
      poiId,
      cityId,
      sourceHash: `${input.job.sourceHash}:inspiration`,
    } as any,
  });

  await prisma.asset.deleteMany({ where: { inspirationId: inspiration.id } });
  for (const asset of input.assets) {
    await prisma.asset.create({
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

  if (input.highConfidence || input.candidates.length === 0) {
    await prisma.locateCandidate.deleteMany({ where: { inspirationId: inspiration.id } });
  }

  if (!input.highConfidence) {
    for (const candidate of input.candidates) {
      await prisma.locateCandidate.upsert({
        where: { inspirationId_rank: { inspirationId: inspiration.id, rank: candidate.rank } },
        update: { poiSnapshot: candidate },
        create: {
          inspirationId: inspiration.id,
          rank: candidate.rank,
          poiSnapshot: candidate,
        },
      });
    }
    await prisma.locateCandidate.deleteMany({
      where: {
        inspirationId: inspiration.id,
        rank: { notIn: input.candidates.map((candidate) => candidate.rank) },
      },
    });
  }

  return {
    inspirationId: inspiration.id,
    locateStatus,
    assetCount: input.assets.length,
    candidateCount: input.candidates.length,
  };
}

export function clearIngestStateForTests() {
  jobs.clear();
  sourceHashIndex.clear();
  subscribers.clear();
}
