import { createHash, randomUUID } from 'node:crypto';
import { getPrisma } from '../db/prisma.js';
import type { RankedBranchCandidate } from './branch-rules.js';
import type { RehostedAsset, StandardizedCandidate, XhsFetchedPost } from './adapters.js';
import type { IngestEvent, IngestJobRecord, IngestStage, IngestWarning, StoredInspirationResult } from './types.js';

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
    const cityName = input.highConfidence?.cityName || null;
    memoryInspirations.set(inspirationId, {
      id: inspirationId,
      user_id: input.job.userId,
      title: input.post.title,
      summary: input.post.text,
      locate_status: locateStatus,
      city_id: cityName ? `mem_city_${createHash('sha1').update(cityName).digest('hex').slice(0, 10)}` : null,
      city_name: cityName,
      poi_id: input.highConfidence ? `mem_poi_${createHash('sha1').update(input.highConfidence.amapId || input.highConfidence.name).digest('hex').slice(0, 10)}` : null,
      poi_name: input.highConfidence?.name ?? null,
      poi_address: input.highConfidence?.address ?? null,
      asset_count: input.assets.length,
      candidate_count: input.candidates.length,
      created_at: new Date().toISOString(),
      candidates: input.candidates.slice(0, 5).map((candidate) => ({
        candidate_id: `${inspirationId}_cand_${candidate.rank}`,
        name: candidate.name,
        address: candidate.address || '待确认地址',
      })),
    });
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
  memoryInspirations.clear();
}

function toLibraryItem(item: MemoryInspiration): LibraryInspirationRecord {
  const { user_id: _userId, candidates: _candidates, ...safeItem } = item;
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

  const rows = (await prisma.inspiration.findMany({
    where: {
      userId: dbUserId,
      ...(filters.cityId ? { cityId: filters.cityId } : {}),
      ...(filters.locateStatus ? { locateStatus: filters.locateStatus } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      city: true,
      poi: true,
      assets: { select: { id: true } },
      candidates: { select: { id: true } },
    },
  } as any)) as any[];

  return rows.map((row: any): LibraryInspirationRecord => ({
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
  }));
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

  const inspiration = (await prisma.inspiration.findFirst({
    where: { id: inspirationId, userId: dbUserId, locateStatus: 'pending' },
    include: { candidates: { orderBy: { rank: 'asc' } } },
  } as any)) as any | null;
  if (!inspiration) return null;

  return inspiration.candidates.slice(0, 5).map((candidate: any): LibraryCandidateRecord => {
    const snapshot = candidate.poiSnapshot && typeof candidate.poiSnapshot === 'object' ? candidate.poiSnapshot : {};
    return {
      candidate_id: candidate.id,
      name: typeof snapshot.name === 'string' ? snapshot.name : '待确认地点',
      address: typeof snapshot.address === 'string' ? snapshot.address : '待确认地址',
    };
  });
}
