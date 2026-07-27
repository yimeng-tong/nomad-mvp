import { randomUUID } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import { getPrisma } from '../db/prisma.js';
import { dbUserIdFor } from '../ingest/store.js';
import {
  PlannerExecutionLeaseLost,
  PlannerRepositoryConflict,
  type CreatePlannerJobInput,
  type PlanJobEvent,
  type PlannerHqJobRecord,
  type PlannerJobRecord,
  type PlannerPlanRecord,
  type PlannerRepository,
  type PlannerVersionPayload,
  type PlannerVersionRecord,
} from './repository.js';
import { zonedLocalToUtc } from './time-windows.js';
import { resolveCityTimezone } from './city-timezones.js';

type SqlClient = Pick<PrismaClient, '$queryRaw' | '$executeRaw'>;

type JobRow = {
  id: string;
  plan_id: string;
  actor_id: string;
  request_hash: string;
  request_snapshot_json: Prisma.JsonValue;
  trace_id: string | null;
  attempt: number;
  state: PlannerJobRecord['status'];
  quick_version_id: string | null;
  hq_job_id: string | null;
  error_code: string | null;
  retriable: boolean | null;
  created_at: Date;
  updated_at: Date;
};

type VersionRow = {
  id: string;
  plan_id: string;
  kind: PlannerVersionRecord['kind'];
  state: PlannerVersionRecord['state'];
  payload_json: Prisma.JsonValue;
  created_at: Date;
};

type HqJobRow = {
  id: string;
  plan_id: string;
  actor_id: string;
  base_version_id: string;
  request_hash: string;
  attempt: number;
  state: PlannerHqJobRecord['state'];
  version_id: string | null;
  error_code: string | null;
  retriable: boolean | null;
  trace_id: string | null;
  created_at: Date;
  updated_at: Date;
};

function jobRecord(row: JobRow, userId: string): PlannerJobRecord {
  return {
    id: row.id,
    planId: row.plan_id,
    userId,
    requestHash: row.request_hash,
    request: row.request_snapshot_json as unknown as CreatePlannerJobInput['request'],
    traceId: row.trace_id ?? '',
    attempt: row.attempt,
    status: row.state,
    quickVersionId: row.quick_version_id,
    hqJobId: row.hq_job_id,
    errorCode: row.error_code,
    retriable: row.retriable,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function versionRecord(row: VersionRow): PlannerVersionRecord {
  return {
    id: row.id,
    planId: row.plan_id,
    kind: row.kind,
    state: row.state,
    payload: row.payload_json as unknown as PlannerVersionPayload,
    createdAt: row.created_at.toISOString(),
  };
}

function hqJobRecord(row: HqJobRow, userId: string): PlannerHqJobRecord {
  return {
    id: row.id,
    planId: row.plan_id,
    userId,
    requestHash: row.request_hash,
    baseVersionId: row.base_version_id,
    traceId: row.trace_id ?? '',
    attempt: row.attempt,
    state: row.state,
    versionId: row.version_id,
    errorCode: row.error_code,
    retriable: row.retriable,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

async function findJobByRequest(client: SqlClient, userId: string, requestHash: string) {
  const rows = await client.$queryRaw<JobRow[]>(Prisma.sql`
    SELECT id, "planId" AS plan_id, external_user_id AS actor_id,
           request_hash, request_snapshot_json, trace_id, attempt, state,
           quick_version_id, hq_job_id, error_code, retriable, created_at, updated_at
    FROM "PlanJob"
    WHERE "userId" = ${dbUserIdFor(userId)}::uuid AND request_hash = ${requestHash}
    LIMIT 1
  `);
  return rows[0] ?? null;
}

function isUniqueViolation(error: unknown) {
  const typed = error as { code?: string; meta?: { code?: string } };
  return typed.code === '23505' || typed.code === 'P2002' || typed.meta?.code === '23505';
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export class PrismaPlannerRepository implements PlannerRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma = getPrisma()) {
    if (!prisma) throw new Error('DATABASE_URL is required for PrismaPlannerRepository');
    this.prisma = prisma;
  }

  async createOrGetJob(input: CreatePlannerJobInput) {
    const existing = await findJobByRequest(this.prisma, input.userId, input.requestHash);
    if (existing) {
      if (stableJson(existing.request_snapshot_json) !== stableJson(input.request)) {
        return { job: jobRecord(existing, input.userId), created: false };
      }
      const staleBefore = Date.now() - Math.max(10_000, Number(process.env.PLANNER_JOB_LEASE_MS || 60_000));
      const recoverable =
        (existing.state === 'failed' && existing.retriable) ||
        ((existing.state === 'queued' || existing.state === 'running') &&
          existing.updated_at.getTime() <= staleBefore);
      if (recoverable) {
        const recovered = await this.prisma.$transaction(async (tx) => {
          const rows = await tx.$queryRaw<JobRow[]>(Prisma.sql`
            UPDATE "PlanJob"
            SET state = 'queued'::"PlanJobState", phase = 'started'::"PlanJobPhase",
                trace_id = ${input.traceId}, error_code = NULL, error_message = NULL,
                retriable = NULL, terminal_at = NULL, attempt = attempt + 1, updated_at = NOW()
            WHERE id = ${existing.id}::uuid
              AND (
                (state = 'failed'::"PlanJobState" AND retriable = TRUE)
                OR (state IN ('queued'::"PlanJobState", 'running'::"PlanJobState")
                    AND updated_at <= ${new Date(staleBefore)})
              )
            RETURNING id, "planId" AS plan_id, external_user_id AS actor_id,
                      request_hash, request_snapshot_json, trace_id, attempt, state,
                      quick_version_id, hq_job_id, error_code, retriable, created_at, updated_at
          `);
          if (rows[0]) {
            await tx.$executeRaw(Prisma.sql`
              DELETE FROM "PlanJobEventRecord" WHERE job_id = ${existing.id}::uuid
            `);
          }
          return rows[0] ?? null;
        });
        if (recovered) return { job: jobRecord(recovered, input.userId), created: true };
      }
      return { job: jobRecord(existing, input.userId), created: false };
    }

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const userId = dbUserIdFor(input.userId);
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO "User" (id, created_at)
          VALUES (${userId}::uuid, NOW())
          ON CONFLICT (id) DO NOTHING
        `);
        let cities = await tx.$queryRaw<Array<{ id: string; tz: string }>>(Prisma.sql`
          SELECT id, tz FROM "City" WHERE name = ${input.request.city} ORDER BY id LIMIT 1
        `);
        if (!cities[0]) {
          const cityId = randomUUID();
          const timezone = resolveCityTimezone(input.request.city);
          cities = await tx.$queryRaw<Array<{ id: string; tz: string }>>(Prisma.sql`
            INSERT INTO "City" (id, name, tz)
            VALUES (${cityId}::uuid, ${input.request.city}, ${timezone})
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
            RETURNING id, tz
          `);
        }

        const planId = randomUUID();
        const jobId = randomUUID();
        const luggage = input.request.luggage_plan;
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO "Plan" (
            id, "userId", "cityId", request_hash, tz, start_date, days, pace, status,
            smart_planning, luggage_mode, luggage_notes, hotel_change_help_needed,
            wake_preference, input_snapshot_json, rev, is_locked, created_at, updated_at
          )
          VALUES (
            ${planId}::uuid, ${userId}::uuid, ${cities[0]!.id}::uuid, ${input.requestHash},
            ${cities[0]!.tz},
            ${new Date(`${input.request.start_date}T00:00:00.000Z`)}, ${input.request.days},
            ${input.request.pace}::"PlanPace", 'planning', ${input.request.smart_planning ?? true},
            ${luggage?.mode ?? 'undecided'}, ${luggage?.notes ?? null},
            ${luggage?.hotel_change_help_needed ?? false}, ${input.request.wake_preference ?? null},
            ${JSON.stringify(input.request)}::jsonb, 1, false, NOW(), NOW()
          )
        `);
        for (const hotel of input.request.hotels ?? []) {
          await tx.$executeRaw(Prisma.sql`
            INSERT INTO "PlanHotelConstraint" (
              id, "planId", date, hotel_name, address, leave_blank,
              breakfast_included, provider_snapshot_json, created_at, updated_at
            )
            VALUES (
              ${randomUUID()}::uuid, ${planId}::uuid,
              ${new Date(`${hotel.date}T00:00:00.000Z`)},
              ${hotel.hotel_name ?? null}, ${hotel.address ?? null},
              ${hotel.leave_blank ?? false}, ${hotel.breakfast_included ?? false},
              ${JSON.stringify({
                submitted_poi_reference: hotel.poi_id ?? null,
              })}::jsonb,
              NOW(), NOW()
            )
          `);
        }
        const rows = await tx.$queryRaw<JobRow[]>(Prisma.sql`
          INSERT INTO "PlanJob" (
            id, "userId", external_user_id, "planId", request_hash, request_snapshot_json, state, phase,
            trace_id, placed_count, remaining_count, created_at, updated_at
          )
          VALUES (
            ${jobId}::uuid, ${userId}::uuid, ${input.userId}, ${planId}::uuid, ${input.requestHash},
            ${JSON.stringify(input.request)}::jsonb, 'queued'::"PlanJobState",
            'started'::"PlanJobPhase", ${input.traceId}, 0, 0, NOW(), NOW()
          )
          RETURNING id, "planId" AS plan_id, external_user_id AS actor_id,
                    request_hash, request_snapshot_json, trace_id, attempt, state,
                    quick_version_id, hq_job_id, error_code, retriable, created_at, updated_at
        `);
        return rows[0]!;
      });
      return { job: jobRecord(created, input.userId), created: true };
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const raced = await findJobByRequest(this.prisma, input.userId, input.requestHash);
      if (!raced) throw error;
      return { job: jobRecord(raced, input.userId), created: false };
    }
  }

  async getJob(jobId: string, userId: string) {
    const rows = await this.prisma.$queryRaw<JobRow[]>(Prisma.sql`
      SELECT id, "planId" AS plan_id, external_user_id AS actor_id,
             request_hash, request_snapshot_json, trace_id, attempt, state,
             quick_version_id, hq_job_id, error_code, retriable, created_at, updated_at
      FROM "PlanJob"
      WHERE id = ${jobId}::uuid AND "userId" = ${dbUserIdFor(userId)}::uuid
      LIMIT 1
    `);
    return rows[0] ? jobRecord(rows[0], userId) : null;
  }

  async heartbeatJob(jobId: string, attempt: number) {
    const updated = await this.prisma.$executeRaw(Prisma.sql`
      UPDATE "PlanJob"
      SET updated_at = NOW()
      WHERE id = ${jobId}::uuid
        AND attempt = ${attempt}
        AND state IN ('queued'::"PlanJobState", 'running'::"PlanJobState")
    `);
    if (updated !== 1) throw new PlannerExecutionLeaseLost();
  }

  async appendJobEvent(jobId: string, attempt: number, event: PlanJobEvent) {
    await this.prisma.$transaction(async (tx) => {
      const jobs = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT id
        FROM "PlanJob"
        WHERE id = ${jobId}::uuid
          AND attempt = ${attempt}
          AND state IN ('queued'::"PlanJobState", 'running'::"PlanJobState")
        FOR UPDATE
      `);
      if (!jobs[0]) throw new PlannerExecutionLeaseLost();
      const rows = await tx.$queryRaw<Array<{ next_sequence: number }>>(Prisma.sql`
        SELECT COALESCE(MAX(sequence), 0)::int + 1 AS next_sequence
        FROM "PlanJobEventRecord"
        WHERE job_id = ${jobId}::uuid
      `);
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "PlanJobEventRecord" (id, job_id, sequence, phase, payload_json, created_at)
        VALUES (
          ${randomUUID()}::uuid, ${jobId}::uuid, ${rows[0]!.next_sequence},
          ${event.phase}::"PlanJobPhase", ${JSON.stringify(event)}::jsonb, NOW()
        )
      `);
      const state = event.phase === 'failed' ? 'failed' : event.phase === 'done' ? 'done' : 'running';
      const terminalAt = event.phase === 'done' || event.phase === 'failed' ? new Date(event.ts) : null;
      await tx.$executeRaw(Prisma.sql`
        UPDATE "PlanJob"
        SET state = ${state}::"PlanJobState",
            phase = ${event.phase}::"PlanJobPhase",
            placed_count = COALESCE(${event.placed_count ?? null}, placed_count),
            remaining_count = COALESCE(${event.remaining_count ?? null}, remaining_count),
            quick_version_id = COALESCE(${event.quick_version_id ?? null}::uuid, quick_version_id),
            hq_job_id = COALESCE(${event.hq_job_id ?? null}::uuid, hq_job_id),
            error_code = ${event.error_code ?? null},
            error_message = ${event.error_message ?? null},
            retriable = ${event.retriable ?? null},
            terminal_at = ${terminalAt},
            updated_at = NOW()
        WHERE id = ${jobId}::uuid
      `);
    });
  }

  async listJobEvents(jobId: string, userId: string, afterIndex = 0) {
    const rows = await this.prisma.$queryRaw<Array<{ payload_json: Prisma.JsonValue }>>(Prisma.sql`
      SELECT event.payload_json
      FROM "PlanJobEventRecord" event
      JOIN "PlanJob" job ON job.id = event.job_id
      WHERE event.job_id = ${jobId}::uuid
        AND job."userId" = ${dbUserIdFor(userId)}::uuid
        AND event.sequence > ${afterIndex}
      ORDER BY event.sequence ASC
    `);
    return rows.map((row) => row.payload_json as unknown as PlanJobEvent);
  }

  async saveQuickVersion(jobId: string, attempt: number, payload: PlannerVersionPayload) {
    return this.prisma.$transaction(async (tx) => {
      const jobs = await tx.$queryRaw<Array<{ plan_id: string; quick_version_id: string | null }>>(Prisma.sql`
        SELECT "planId" AS plan_id, quick_version_id
        FROM "PlanJob"
        WHERE id = ${jobId}::uuid
          AND attempt = ${attempt}
          AND state IN ('queued'::"PlanJobState", 'running'::"PlanJobState")
        FOR UPDATE
      `);
      if (!jobs[0]) throw new PlannerExecutionLeaseLost();
      if (jobs[0].quick_version_id) {
        const existing = await tx.$queryRaw<VersionRow[]>(Prisma.sql`
          SELECT id, "planId" AS plan_id, kind, state, payload_json, created_at
          FROM "PlanVersion"
          WHERE id = ${jobs[0].quick_version_id}::uuid
          LIMIT 1
        `);
        if (existing[0]) return versionRecord(existing[0]);
      }
      const version = await this.insertReadyVersion(tx, jobs[0].plan_id, 'quick', payload);
      await tx.$executeRaw(Prisma.sql`
        UPDATE "Plan" SET current_version_id = ${version.id}::uuid, status = 'ready', updated_at = NOW()
        WHERE id = ${jobs[0].plan_id}::uuid
      `);
      await tx.$executeRaw(Prisma.sql`
        UPDATE "PlanJob" SET quick_version_id = ${version.id}::uuid, updated_at = NOW()
        WHERE id = ${jobId}::uuid
      `);
      return versionRecord(version);
    });
  }

  async saveHqVersion(planId: string, userId: string, payload: PlannerVersionPayload) {
    return this.prisma.$transaction(async (tx) => {
      const plans = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT id FROM "Plan"
        WHERE id = ${planId}::uuid AND "userId" = ${dbUserIdFor(userId)}::uuid
        FOR UPDATE
      `);
      if (!plans[0]) throw new Error('plan not found');
      return versionRecord(await this.insertReadyVersion(tx, planId, 'hq', payload));
    });
  }

  async saveHqVersionAndComplete(
    hqJobId: string,
    userId: string,
    attempt: number,
    payload: PlannerVersionPayload,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const jobs = await tx.$queryRaw<Array<{ plan_id: string }>>(Prisma.sql`
        SELECT "planId" AS plan_id
        FROM "HqJob"
        WHERE id = ${hqJobId}::uuid
          AND "userId" = ${dbUserIdFor(userId)}::uuid
          AND attempt = ${attempt}
          AND state = 'running'::"HqJobState"
        FOR UPDATE
      `);
      if (!jobs[0]) throw new PlannerExecutionLeaseLost('HQ execution lease is no longer current');
      const version = await this.insertReadyVersion(tx, jobs[0].plan_id, 'hq', payload);
      await tx.$executeRaw(Prisma.sql`
        UPDATE "HqJob"
        SET state = 'done'::"HqJobState", version_id = ${version.id}::uuid,
            error_code = NULL, error_message = NULL, retriable = NULL,
            finished_at = NOW(), updated_at = NOW()
        WHERE id = ${hqJobId}::uuid
      `);
      return versionRecord(version);
    });
  }

  async createOrGetHqJob(input: {
    planId: string;
    userId: string;
    requestHash: string;
    baseVersionId: string;
    traceId: string;
  }) {
    const userId = dbUserIdFor(input.userId);
    const existing = await this.prisma.$queryRaw<HqJobRow[]>(Prisma.sql`
      SELECT id, "planId" AS plan_id, external_user_id AS actor_id, base_version_id,
             request_hash, attempt, state, version_id, error_code, retriable, trace_id, created_at, updated_at
      FROM "HqJob"
      WHERE "userId" = ${userId}::uuid AND request_hash = ${input.requestHash}
      LIMIT 1
    `);
    if (existing[0]) {
      if (existing[0].state === 'failed' && existing[0].retriable) {
        const retried = await this.prisma.$queryRaw<HqJobRow[]>(Prisma.sql`
          UPDATE "HqJob"
          SET state = 'running'::"HqJobState", attempt = attempt + 1,
              version_id = NULL, error_code = NULL, error_message = NULL,
              retriable = NULL, trace_id = ${input.traceId},
              started_at = NOW(), finished_at = NULL, updated_at = NOW()
          WHERE id = ${existing[0].id}::uuid
            AND "userId" = ${userId}::uuid
            AND state = 'failed'::"HqJobState"
            AND retriable = TRUE
          RETURNING id, "planId" AS plan_id, external_user_id AS actor_id, base_version_id,
                    request_hash, attempt, state, version_id, error_code, retriable, trace_id, created_at, updated_at
        `);
        if (retried[0]) return { job: hqJobRecord(retried[0], input.userId), created: true };
        const raced = await this.prisma.$queryRaw<HqJobRow[]>(Prisma.sql`
          SELECT id, "planId" AS plan_id, external_user_id AS actor_id, base_version_id,
                 request_hash, attempt, state, version_id, error_code, retriable, trace_id, created_at, updated_at
          FROM "HqJob"
          WHERE id = ${existing[0].id}::uuid AND "userId" = ${userId}::uuid
          LIMIT 1
        `);
        if (raced[0]) return { job: hqJobRecord(raced[0], input.userId), created: false };
      }
      return { job: hqJobRecord(existing[0], input.userId), created: false };
    }
    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const plans = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          SELECT id FROM "Plan"
          WHERE id = ${input.planId}::uuid AND "userId" = ${userId}::uuid
          FOR UPDATE
        `);
        if (!plans[0]) throw new Error('plan not found');
        const rows = await tx.$queryRaw<HqJobRow[]>(Prisma.sql`
          INSERT INTO "HqJob" (
            id, "userId", external_user_id, "planId", base_version_id, request_hash,
            state, attempt, trace_id, started_at, created_at, updated_at
          )
          VALUES (
            ${randomUUID()}::uuid, ${userId}::uuid, ${input.userId}, ${input.planId}::uuid,
            ${input.baseVersionId}::uuid, ${input.requestHash},
            'running'::"HqJobState", 1, ${input.traceId}, NOW(), NOW(), NOW()
          )
          RETURNING id, "planId" AS plan_id, external_user_id AS actor_id, base_version_id,
                    request_hash, attempt, state, version_id, error_code, retriable, trace_id, created_at, updated_at
        `);
        await tx.$executeRaw(Prisma.sql`
          UPDATE "PlanJob" SET hq_job_id = ${rows[0]!.id}::uuid, updated_at = NOW()
          WHERE "planId" = ${input.planId}::uuid
        `);
        return rows[0]!;
      });
      return { job: hqJobRecord(created, input.userId), created: true };
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const raced = await this.prisma.$queryRaw<HqJobRow[]>(Prisma.sql`
        SELECT id, "planId" AS plan_id, external_user_id AS actor_id, base_version_id,
               request_hash, attempt, state, version_id, error_code, retriable, trace_id, created_at, updated_at
        FROM "HqJob"
        WHERE "userId" = ${userId}::uuid AND request_hash = ${input.requestHash}
        LIMIT 1
      `);
      if (!raced[0]) throw error;
      return { job: hqJobRecord(raced[0], input.userId), created: false };
    }
  }

  async getHqJob(hqJobId: string, userId: string) {
    const rows = await this.prisma.$queryRaw<HqJobRow[]>(Prisma.sql`
      SELECT id, "planId" AS plan_id, external_user_id AS actor_id, base_version_id,
             request_hash, attempt, state, version_id, error_code, retriable, trace_id, created_at, updated_at
      FROM "HqJob"
      WHERE id = ${hqJobId}::uuid AND "userId" = ${dbUserIdFor(userId)}::uuid
      LIMIT 1
    `);
    return rows[0] ? hqJobRecord(rows[0], userId) : null;
  }

  async heartbeatHqJob(hqJobId: string, userId: string, attempt: number) {
    const updated = await this.prisma.$executeRaw(Prisma.sql`
      UPDATE "HqJob"
      SET updated_at = NOW()
      WHERE id = ${hqJobId}::uuid
        AND "userId" = ${dbUserIdFor(userId)}::uuid
        AND attempt = ${attempt}
        AND state = 'running'::"HqJobState"
    `);
    if (updated !== 1) {
      throw new PlannerExecutionLeaseLost('HQ execution lease is no longer current');
    }
  }

  async completeHqJob(hqJobId: string, userId: string, attempt: number, versionId: string) {
    const rows = await this.prisma.$queryRaw<HqJobRow[]>(Prisma.sql`
      UPDATE "HqJob"
      SET state = 'done'::"HqJobState", version_id = ${versionId}::uuid,
          error_code = NULL, error_message = NULL, retriable = NULL,
          finished_at = NOW(), updated_at = NOW()
      WHERE id = ${hqJobId}::uuid
        AND "userId" = ${dbUserIdFor(userId)}::uuid
        AND attempt = ${attempt}
        AND state = 'running'::"HqJobState"
      RETURNING id, "planId" AS plan_id, external_user_id AS actor_id, base_version_id,
                request_hash, attempt, state, version_id, error_code, retriable, trace_id, created_at, updated_at
    `);
    if (!rows[0]) throw new PlannerExecutionLeaseLost('HQ execution lease is no longer current');
    return hqJobRecord(rows[0], userId);
  }

  async failHqJob(
    hqJobId: string,
    userId: string,
    attempt: number,
    errorCode: string,
    retriable: boolean,
  ) {
    const rows = await this.prisma.$queryRaw<HqJobRow[]>(Prisma.sql`
      UPDATE "HqJob"
      SET state = 'failed'::"HqJobState", error_code = ${errorCode},
          error_message = 'HQ planning failed', retriable = ${retriable},
          finished_at = NOW(), updated_at = NOW()
      WHERE id = ${hqJobId}::uuid
        AND "userId" = ${dbUserIdFor(userId)}::uuid
        AND attempt = ${attempt}
        AND state = 'running'::"HqJobState"
      RETURNING id, "planId" AS plan_id, external_user_id AS actor_id, base_version_id,
                request_hash, attempt, state, version_id, error_code, retriable, trace_id, created_at, updated_at
    `);
    if (!rows[0]) throw new PlannerExecutionLeaseLost('HQ execution lease is no longer current');
    return hqJobRecord(rows[0], userId);
  }

  async claimRecoverableJobs(staleBefore: string, limit: number) {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<JobRow[]>(Prisma.sql`
        WITH candidates AS (
          SELECT id
          FROM "PlanJob"
          WHERE updated_at <= ${new Date(staleBefore)}
            AND (
              state IN ('queued'::"PlanJobState", 'running'::"PlanJobState")
              OR (state = 'failed'::"PlanJobState" AND retriable = TRUE)
            )
          ORDER BY updated_at
          FOR UPDATE SKIP LOCKED
          LIMIT ${Math.max(1, Math.min(100, limit))}
        )
        UPDATE "PlanJob" job
        SET state = 'queued'::"PlanJobState", phase = 'started'::"PlanJobPhase",
            error_code = NULL, error_message = NULL, retriable = NULL,
            terminal_at = NULL, attempt = attempt + 1, updated_at = NOW()
        FROM candidates
        WHERE job.id = candidates.id
        RETURNING job.id, job."planId" AS plan_id, job.external_user_id AS actor_id,
                  job.request_hash, job.request_snapshot_json, job.trace_id, job.attempt, job.state,
                  job.quick_version_id, job.hq_job_id, job.error_code, job.retriable,
                  job.created_at, job.updated_at
      `);
      for (const row of rows) {
        await tx.$executeRaw(Prisma.sql`
          DELETE FROM "PlanJobEventRecord" WHERE job_id = ${row.id}::uuid
        `);
      }
      return rows.map((row) => jobRecord(row, row.actor_id));
    });
  }

  async claimRecoverableHqJobs(staleBefore: string, limit: number) {
    const rows = await this.prisma.$queryRaw<HqJobRow[]>(Prisma.sql`
      WITH candidates AS (
        SELECT id
        FROM "HqJob"
        WHERE updated_at <= ${new Date(staleBefore)}
          AND (
            state = 'running'::"HqJobState"
            OR (state = 'failed'::"HqJobState" AND retriable = TRUE)
          )
        ORDER BY updated_at
        FOR UPDATE SKIP LOCKED
        LIMIT ${Math.max(1, Math.min(100, limit))}
      )
      UPDATE "HqJob" job
      SET state = 'running'::"HqJobState", attempt = attempt + 1,
          version_id = NULL, error_code = NULL, error_message = NULL,
          retriable = NULL, started_at = NOW(), finished_at = NULL, updated_at = NOW()
      FROM candidates
      WHERE job.id = candidates.id
      RETURNING job.id, job."planId" AS plan_id, job.external_user_id AS actor_id,
                job.base_version_id, job.request_hash, job.attempt, job.state, job.version_id,
                job.error_code, job.retriable, job.trace_id, job.created_at, job.updated_at
    `);
    return rows.map((row) => hqJobRecord(row, row.actor_id));
  }

  async getPlan(planId: string, userId: string): Promise<PlannerPlanRecord | null> {
    const plans = await this.prisma.$queryRaw<
      Array<{
        id: string;
        rev: number;
        current_version_id: string | null;
        created_at: Date;
        updated_at: Date;
      }>
    >(Prisma.sql`
      SELECT id, rev, current_version_id, created_at, updated_at
      FROM "Plan"
      WHERE id = ${planId}::uuid AND "userId" = ${dbUserIdFor(userId)}::uuid
      LIMIT 1
    `);
    if (!plans[0]) return null;
    const versions = await this.prisma.$queryRaw<VersionRow[]>(Prisma.sql`
      SELECT id, "planId" AS plan_id, kind, state, payload_json, created_at
      FROM "PlanVersion"
      WHERE "planId" = ${planId}::uuid
      ORDER BY version_number ASC
    `);
    const hqJobs = await this.prisma.$queryRaw<HqJobRow[]>(Prisma.sql`
      SELECT id, "planId" AS plan_id, external_user_id AS actor_id, base_version_id,
             request_hash, attempt, state, version_id, error_code, retriable, trace_id, created_at, updated_at
      FROM "HqJob"
      WHERE "planId" = ${planId}::uuid AND "userId" = ${dbUserIdFor(userId)}::uuid
      ORDER BY created_at DESC
      LIMIT 1
    `);
    return {
      id: plans[0].id,
      userId,
      planRev: plans[0].rev,
      currentVersionId: plans[0].current_version_id,
      versions: versions.map(versionRecord),
      hqJob: hqJobs[0] ? hqJobRecord(hqJobs[0], userId) : null,
      createdAt: plans[0].created_at.toISOString(),
      updatedAt: plans[0].updated_at.toISOString(),
    };
  }

  async getVersion(planId: string, versionId: string, userId: string) {
    const rows = await this.prisma.$queryRaw<VersionRow[]>(Prisma.sql`
      SELECT version.id, version."planId" AS plan_id, version.kind, version.state,
             version.payload_json, version.created_at
      FROM "PlanVersion" version
      JOIN "Plan" plan ON plan.id = version."planId"
      WHERE version.id = ${versionId}::uuid
        AND version."planId" = ${planId}::uuid
        AND plan."userId" = ${dbUserIdFor(userId)}::uuid
      LIMIT 1
    `);
    return rows[0] ? versionRecord(rows[0]) : null;
  }

  async updateCurrentVersion(input: {
    planId: string;
    userId: string;
    expectedPlanRev: number;
    mutate: (payload: PlannerVersionPayload) => PlannerVersionPayload;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const plans = await tx.$queryRaw<Array<{ rev: number; current_version_id: string | null }>>(Prisma.sql`
        SELECT rev, current_version_id
        FROM "Plan"
        WHERE id = ${input.planId}::uuid AND "userId" = ${dbUserIdFor(input.userId)}::uuid
        FOR UPDATE
      `);
      if (!plans[0]) throw new Error('plan not found');
      if (plans[0].rev !== input.expectedPlanRev) throw new PlannerRepositoryConflict('plan revision changed');
      if (!plans[0].current_version_id) throw new Error('current plan version not found');
      const currentRows = await tx.$queryRaw<VersionRow[]>(Prisma.sql`
        SELECT id, "planId" AS plan_id, kind, state, payload_json, created_at
        FROM "PlanVersion"
        WHERE id = ${plans[0].current_version_id}::uuid
        LIMIT 1
      `);
      if (!currentRows[0]) throw new Error('current plan version not found');
      const payload = input.mutate(currentRows[0].payload_json as unknown as PlannerVersionPayload);
      const version = await this.insertReadyVersion(tx, input.planId, currentRows[0].kind, payload);
      await tx.$executeRaw(Prisma.sql`
        UPDATE "Plan"
        SET current_version_id = ${version.id}::uuid, rev = rev + 1, updated_at = NOW()
        WHERE id = ${input.planId}::uuid
      `);
      return { planRev: input.expectedPlanRev + 1, version: versionRecord(version) };
    });
  }

  async adoptHqVersion(input: {
    planId: string;
    hqVersionId: string;
    baseVersionId: string;
    userId: string;
    expectedPlanRev: number;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const plans = await tx.$queryRaw<Array<{ rev: number; current_version_id: string | null }>>(Prisma.sql`
        SELECT rev, current_version_id FROM "Plan"
        WHERE id = ${input.planId}::uuid AND "userId" = ${dbUserIdFor(input.userId)}::uuid
        FOR UPDATE
      `);
      if (!plans[0]) throw new Error('plan not found');
      if (plans[0].current_version_id === input.hqVersionId) {
        return { planRev: plans[0].rev, currentVersionId: input.hqVersionId };
      }
      if (plans[0].rev !== input.expectedPlanRev) throw new PlannerRepositoryConflict('plan revision changed');
      if (plans[0].current_version_id !== input.baseVersionId) {
        throw new PlannerRepositoryConflict('HQ base version changed');
      }
      const versions = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT id FROM "PlanVersion"
        WHERE id = ${input.hqVersionId}::uuid
          AND "planId" = ${input.planId}::uuid
          AND kind = 'hq'::"PlanVersionKind"
          AND state IN ('ready'::"PlanVersionState", 'adopted'::"PlanVersionState")
        LIMIT 1
      `);
      if (!versions[0]) throw new Error('HQ version not ready');
      await tx.$executeRaw(Prisma.sql`
        UPDATE "Plan"
        SET current_version_id = ${input.hqVersionId}::uuid, rev = rev + 1, updated_at = NOW()
        WHERE id = ${input.planId}::uuid
      `);
      await tx.$executeRaw(Prisma.sql`
        UPDATE "PlanVersion"
        SET state = 'adopted'::"PlanVersionState", adopted_at = NOW(), updated_at = NOW()
        WHERE id = ${input.hqVersionId}::uuid
      `);
      return { planRev: input.expectedPlanRev + 1, currentVersionId: input.hqVersionId };
    });
  }

  private async insertReadyVersion(
    client: SqlClient,
    planId: string,
    kind: PlannerVersionRecord['kind'],
    payload: PlannerVersionPayload,
  ) {
    const plans = await client.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id FROM "Plan" WHERE id = ${planId}::uuid FOR UPDATE
    `);
    if (!plans[0]) throw new Error('plan not found while creating version');
    const counts = await client.$queryRaw<Array<{ next_version: number }>>(Prisma.sql`
      SELECT COALESCE(MAX(version_number), 0)::int + 1 AS next_version
      FROM "PlanVersion"
      WHERE "planId" = ${planId}::uuid
    `);
    const rows = await client.$queryRaw<VersionRow[]>(Prisma.sql`
      INSERT INTO "PlanVersion" (
        id, "planId", version_number, kind, state, payload_json, created_at, updated_at, ready_at
      )
      VALUES (
        ${randomUUID()}::uuid, ${planId}::uuid, ${counts[0]!.next_version},
        ${kind}::"PlanVersionKind", 'ready'::"PlanVersionState",
        ${JSON.stringify(payload)}::jsonb, NOW(), NOW(), NOW()
      )
      RETURNING id, "planId" AS plan_id, kind, state, payload_json, created_at
    `);
    await this.materializeVersion(client, planId, rows[0]!.id, payload);
    return rows[0]!;
  }

  private async materializeVersion(
    client: SqlClient,
    planId: string,
    versionId: string,
    payload: PlannerVersionPayload,
  ) {
    const slotIds = new Map<string, string>();
    const plans = await client.$queryRaw<Array<{ timezone: string }>>(Prisma.sql`
      SELECT tz AS timezone FROM "Plan" WHERE id = ${planId}::uuid LIMIT 1
    `);
    if (!plans[0]) throw new Error('plan not found while materializing version');
    const timezone = plans[0].timezone;
    for (const day of payload.day_plans) {
      const dayId = randomUUID();
      await client.$executeRaw(Prisma.sql`
        INSERT INTO "PlanDay" (id, "planId", version_id, day_index, date)
        VALUES (
          ${dayId}::uuid, ${planId}::uuid, ${versionId}::uuid,
          ${day.day_index}, ${new Date(`${day.date}T00:00:00.000Z`)}
        )
      `);
      for (const slot of day.slots) {
        const slotId = randomUUID();
        slotIds.set(slot.slot_id, slotId);
        await client.$executeRaw(Prisma.sql`
          INSERT INTO "PlanSlot" (
            id, "dayId", slot_index, start_at, end_at, start_local, end_local,
            timezone, type, origin, title,
            "poiId", "inspirationId", candidate_metadata_json, notes_json,
            conflict, created_at, updated_at
          )
          VALUES (
            ${slotId}::uuid, ${dayId}::uuid, ${slot.slot_index},
            ${zonedLocalToUtc(day.date, slot.start_local, timezone)},
            ${zonedLocalToUtc(day.date, slot.end_local, timezone)},
            ${slot.start_local}, ${slot.end_local}, ${timezone},
            ${slot.type}::"SlotType", ${slot.origin}::"SlotOrigin", ${slot.title ?? null},
            (SELECT id FROM "CanonicalPOI" WHERE id::text = ${slot.poi?.poi_id ?? ''} LIMIT 1),
            (SELECT id FROM "Inspiration" WHERE id::text = ${slot.inspiration_id ?? ''} LIMIT 1),
            ${JSON.stringify({ api_slot_id: slot.slot_id })}::jsonb,
            ${JSON.stringify({ warning_codes: slot.warning_codes ?? [] })}::jsonb,
            'none'::"Conflict", NOW(), NOW()
          )
        `);
        if (slot.constraint) {
          const constraint = slot.constraint;
          await client.$executeRaw(Prisma.sql`
            INSERT INTO "PlanEvidenceConstraint" (
              id, "planId", version_id, item_id, inspiration_id, "poiId", date,
              start_local, end_local, timezone, time_hint, source, evidence_ref,
              source_attribution, quality, slot_id, created_at, updated_at
            )
            VALUES (
              ${randomUUID()}::uuid, ${planId}::uuid, ${versionId}::uuid,
              ${constraint.item_id},
              (SELECT id FROM "Inspiration" WHERE id::text = ${slot.inspiration_id ?? ''} LIMIT 1),
              (SELECT id FROM "CanonicalPOI" WHERE id::text = ${constraint.poi_id ?? ''} LIMIT 1),
              ${constraint.date ? new Date(`${constraint.date}T00:00:00.000Z`) : null},
              ${constraint.start_local ?? null}, ${constraint.end_local ?? null},
              ${constraint.timezone}, ${constraint.time_hint}::"PlannerTimeHint",
              ${constraint.source}::"EvidenceSource", ${constraint.evidence_ref},
              ${constraint.source_attribution ?? null}, ${constraint.quality}::"QualityGrade",
              ${slotId}::uuid, NOW(), NOW()
            )
          `);
        }
      }
      await client.$executeRaw(Prisma.sql`
        INSERT INTO "PlanHotelSlot" (
          id, "dayId", "versionId", date, leave_blank, breakfast_included,
          "poiId", provider_snapshot_json, created_at, updated_at
        )
        VALUES (
          ${randomUUID()}::uuid, ${dayId}::uuid, ${versionId}::uuid,
          ${new Date(`${day.hotel.date}T00:00:00.000Z`)},
          ${day.hotel.leave_blank}, ${day.hotel.breakfast_included ?? false},
          (SELECT id FROM "CanonicalPOI" WHERE id::text = ${day.hotel.poi?.poi_id ?? ''} LIMIT 1),
          ${JSON.stringify(day.hotel.poi ?? null)}::jsonb, NOW(), NOW()
        )
      `);
    }

    for (const candidate of payload.candidates) {
      await client.$executeRaw(Prisma.sql`
        INSERT INTO "SlotCandidate" (
          id, "planId", version_id, item_id, inspiration_id, "poiId", status,
          source, poi_snapshot_json, reason_short, quality_grade,
          source_attribution, metadata_json, created_at, updated_at
        )
        VALUES (
          ${randomUUID()}::uuid, ${planId}::uuid, ${versionId}::uuid,
          ${candidate.item_id},
          (SELECT id FROM "Inspiration" WHERE id::text = ${candidate.item_id} LIMIT 1),
          (SELECT id FROM "CanonicalPOI" WHERE id::text = ${candidate.poi?.poi_id ?? ''} LIMIT 1),
          ${candidate.status}, ${candidate.source}, ${JSON.stringify(candidate.poi ?? {})}::jsonb,
          ${candidate.reason}, ${candidate.quality ?? null}::"QualityGrade",
          ${candidate.source_attribution ?? null},
          ${JSON.stringify({ candidate_id: candidate.candidate_id })}::jsonb,
          NOW(), NOW()
        )
      `);
    }
    for (const warning of payload.warnings) {
      await client.$executeRaw(Prisma.sql`
        INSERT INTO "PlanWarning" (
          id, "planId", version_id, slot_id, item_id, code, severity,
          message, created_at
        )
        VALUES (
          ${randomUUID()}::uuid, ${planId}::uuid, ${versionId}::uuid,
          ${warning.slot_id ? slotIds.get(warning.slot_id) ?? null : null}::uuid,
          ${warning.item_id ?? null}, ${warning.code},
          ${warning.severity}::"WarningSeverity", ${warning.message}, NOW()
        )
      `);
    }
    for (const unresolved of payload.unresolved_required) {
      await client.$executeRaw(Prisma.sql`
        INSERT INTO "UnresolvedRequiredItem" (
          id, "planId", version_id, item_id, inspiration_id, "poiId",
          reason_code, message, created_at
        )
        VALUES (
          ${randomUUID()}::uuid, ${planId}::uuid, ${versionId}::uuid,
          ${unresolved.item_id},
          (SELECT id FROM "Inspiration" WHERE id::text = ${unresolved.item_id} LIMIT 1),
          (SELECT id FROM "CanonicalPOI" WHERE id::text = ${unresolved.poi_id ?? ''} LIMIT 1),
          ${unresolved.reason_code}::"UnresolvedReason", ${unresolved.message}, NOW()
        )
      `);
    }
  }
}
