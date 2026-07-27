import { createHash, createHmac, randomUUID } from 'node:crypto';
import type { FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { getPrisma } from '../db/prisma.js';
import { authGuard } from '../plugins/auth.js';
import {
  EmptySlotResolveBody,
  HqAdoptBody,
  HqStartBody,
  HqStatusQuery,
  PlanIdParams,
  PlanEditUndoBody,
  PlanGenerateBody,
  PlanRecentActionQuery,
  PlanRevisionBody,
  SeedUndoBody,
  PlanSlotParams,
  SlotEditBody,
} from '../schemas.js';
import { PrismaPlannerRepository } from '../planner/prisma-repository.js';
import {
  resumeHqPlanning,
  ServerManagedHqAdapter,
  startHqPlanning,
  type HqPlannerAdapter,
} from '../planner/hq.js';
import {
  PlannerExecutionLeaseLost,
  PlannerRepositoryConflict,
  type DayPlanResponse,
  type PlanGenerateRequest,
  type PlannerPlanRecord,
  type PlannerRepository,
  type PlannerVersionPayload,
  type PlannerVersionRecord,
} from '../planner/repository.js';
import {
  PlannerInputError,
  resolvePlannerInput,
  type PlannerSourceRepository,
} from '../planner/resolver.js';
import { runQuickPlannerJob } from '../planner/service.js';
import { applySlotEdit, PlannerEditError } from '../planner/edit.js';
import { getPlannerSourceRepository } from '../planner/source.js';
import {
  resolveCityTimezone,
  UnsupportedPlannerCityError,
} from '../planner/city-timezones.js';
import type { components } from '../../../../packages/types/src/api-types.js';

type PlanGenerateResponse = components['schemas']['PlanGenerateResponse'];
type EmptySlotResolveRequest = components['schemas']['EmptySlotResolveRequest'];
type PlanRevisionRequest = components['schemas']['PlanRevisionRequest'];
type SeedUndoRequest = components['schemas']['SeedUndoRequest'];
type SlotEditRequest = components['schemas']['SlotEditRequest'];
type PlanEditUndoRequest = components['schemas']['PlanEditUndoRequest'];

export type PlannerRouteOptions = {
  repository?: PlannerRepository;
  source?: PlannerSourceRepository;
  startHq?: Parameters<typeof runQuickPlannerJob>[0]['startHq'];
  hqAdapter?: HqPlannerAdapter;
  pollMs?: number;
};

class PlannerMutationError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'PlannerMutationError';
  }
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

function requestHash(request: PlanGenerateRequest, idempotencyKey?: string) {
  return createHash('sha256')
    .update(idempotencyKey ? `idempotency:${idempotencyKey}` : stableJson(request))
    .digest('hex');
}

function undoToken(planId: string, operationId: string) {
  const configuredSecret = process.env.PLANNER_UNDO_SECRET;
  if (!configuredSecret && ['production', 'staging'].includes(process.env.NODE_ENV ?? '')) {
    throw new Error('PLANNER_UNDO_SECRET is required outside local/test environments');
  }
  const secret = configuredSecret || 'nomad-local-planner-undo';
  return `u_${createHmac('sha256', secret).update(`${planId}:${operationId}`).digest('base64url')}`;
}

function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

const editLabels: Record<components['schemas']['PlanRecentAction']['kind'], string> = {
  replace: '替换了一个安排',
  move_day: '移动了一个安排',
  retime: '调整了时间',
  delete: '删除了一个安排',
};

function versionSummary(version: PlannerVersionRecord): components['schemas']['PlanVersionSummary'] {
  return {
    version_id: version.id,
    kind: version.kind,
    state: version.state,
    created_at: version.createdAt,
  };
}

function dayPlanResponse(
  plan: PlannerPlanRecord,
  version: PlannerVersionRecord,
): DayPlanResponse {
  const quick = plan.versions.find((candidate) => candidate.kind === 'quick');
  if (!quick) throw new PlannerMutationError('PLAN_NOT_READY', 'Quick plan is not ready');
  return {
    plan_id: plan.id,
    ...version.payload,
    plan_rev: plan.planRev,
    current_version_id: plan.currentVersionId ?? version.id,
    quick_version: versionSummary(quick),
    hq_job: plan.hqJob
      ? {
          hq_job_id: plan.hqJob.id,
          state: plan.hqJob.state,
          version_id: plan.hqJob.versionId,
          error_code: plan.hqJob.errorCode,
        }
      : null,
    versions: plan.versions.map(versionSummary),
  };
}

function clearSeed(payload: PlannerVersionPayload) {
  const next = structuredClone(payload);
  const clearedPoiIds = new Set<string>();
  for (const day of next.day_plans) {
    for (const slot of day.slots) {
      if (slot.origin !== 'ai_seed') continue;
      if (slot.poi) clearedPoiIds.add(slot.poi.poi_id);
      slot.type = 'unresolved';
      slot.origin = 'free';
      slot.title = null;
      slot.poi = null;
      slot.inspiration_id = null;
      slot.constraint = null;
    }
  }
  for (const candidate of next.candidates) {
    if (candidate.status === 'used' && candidate.poi && clearedPoiIds.has(candidate.poi.poi_id)) {
      candidate.status = 'available';
    }
  }
  next.seed_undo_token = null;
  next.seed_undo_expires_at = null;
  return next;
}

function resolveEmptySlot(
  payload: PlannerVersionPayload,
  slotId: string,
  body: EmptySlotResolveRequest,
) {
  const next = structuredClone(payload);
  const slot = next.day_plans.flatMap((day) => day.slots).find((candidate) => candidate.slot_id === slotId);
  if (!slot) throw new PlannerMutationError('PLAN_SLOT_NOT_FOUND', 'slot not found');
  if (slot.type !== 'unresolved') {
    throw new PlannerMutationError('PLAN_SLOT_OCCUPIED', 'only an empty slot can be resolved');
  }
  if (body.op === 'set_free_activity') {
    slot.type = 'free';
    slot.origin = 'free';
    slot.title = '自由活动';
    return { payload: next, slot };
  }
  const candidate = next.candidates.find((entry) => entry.candidate_id === body.candidate_id);
  if (!candidate || candidate.status !== 'available' || !candidate.poi) {
    throw new PlannerMutationError('PLAN_CANDIDATE_UNAVAILABLE', 'candidate is not available');
  }
  slot.type = 'place';
  slot.origin = 'hand';
  slot.title = candidate.poi.name;
  slot.poi = candidate.poi;
  candidate.status = 'used';
  return { payload: next, slot };
}

function mutationError(reply: FastifyReply, error: unknown) {
  if (error instanceof PlannerRepositoryConflict) {
    return reply.sendError(error.code, error.message, 409, false);
  }
  if (error instanceof PlannerEditError) {
    const status = error.code === 'PLAN_SLOT_NOT_FOUND' ? 404 : 409;
    return reply.sendError(error.code, error.message, status, false);
  }
  if (error instanceof PlannerMutationError) {
    const status = error.code.endsWith('NOT_FOUND') ? 404 : error.code === 'PLAN_NOT_READY' ? 409 : 409;
    return reply.sendError(error.code, error.message, status, false);
  }
  throw error;
}

export default fp<PlannerRouteOptions>(async (app, options) => {
  const prisma = getPrisma();
  if (!options.repository && !prisma) {
    throw new Error('DATABASE_URL is required for production Planner persistence');
  }
  const repository = options.repository ?? new PrismaPlannerRepository(prisma!);
  const source = options.source ?? getPlannerSourceRepository();
  if (!source) throw new Error('DATABASE_URL is required for production Planner sources');
  const hqAdapter = options.hqAdapter ?? new ServerManagedHqAdapter();
  const startHq =
    options.startHq ??
    (async ({ job, quickVersion }: Parameters<NonNullable<PlannerRouteOptions['startHq']>>[0]) => {
      const hqJob = await startHqPlanning({
        repository,
        adapter: hqAdapter,
        planId: job.planId,
        userId: job.userId,
        quickVersion,
        traceId: job.traceId,
      });
      return hqJob.id;
    });
  const sseHeartbeatMs = Number(process.env.SSE_HEARTBEAT_MS || 10000);
  const pollMs = options.pollMs ?? 100;
  const leaseMs = Math.max(10_000, Number(process.env.PLANNER_JOB_LEASE_MS || 60_000));
  const reportQuickPlannerResult = (
    result: Awaited<ReturnType<typeof runQuickPlannerJob>>,
    job: { id: string; planId: string; attempt: number },
  ) => {
    if (result.ok) return;
    const context = {
      err: result.error,
      planJobId: job.id,
      planId: job.planId,
      attempt: job.attempt,
    };
    if (
      result.error instanceof PlannerInputError
      || result.error instanceof PlannerExecutionLeaseLost
    ) {
      app.log.warn(context, 'quick planner job stopped');
    } else {
      app.log.error(context, 'quick planner job failed');
    }
  };

  let recoveryRunning = false;
  const recoverPlannerJobs = async () => {
    if (recoveryRunning) return;
    recoveryRunning = true;
    try {
      const staleBefore = new Date(Date.now() - leaseMs).toISOString();
      const quickJobs = await repository.claimRecoverableJobs(staleBefore, 20);
      for (const job of quickJobs) {
        const result = await runQuickPlannerJob({
          job,
          repository,
          resolveInput: () =>
            resolvePlannerInput(job.userId, job.planId, job.request, source),
          startHq,
        });
        reportQuickPlannerResult(result, job);
      }
      const hqJobs = await repository.claimRecoverableHqJobs(staleBefore, 20);
      for (const job of hqJobs) {
        const quickVersion = await repository.getVersion(
          job.planId,
          job.baseVersionId,
          job.userId,
        );
        if (quickVersion) {
          resumeHqPlanning({ repository, adapter: hqAdapter, job, quickVersion });
        } else {
          await repository.failHqJob(
            job.id,
            job.userId,
            job.attempt,
            'HQ_BASE_VERSION_MISSING',
            false,
          );
        }
      }
    } catch (error) {
      app.log.error({ error }, 'planner recovery failed');
    } finally {
      recoveryRunning = false;
    }
  };
  queueMicrotask(() => {
    void recoverPlannerJobs();
  });
  const recoveryTimer = setInterval(
    () => void recoverPlannerJobs(),
    Math.max(5_000, Math.floor(leaseMs / 2)),
  );
  recoveryTimer.unref();
  app.addHook('onClose', async () => clearInterval(recoveryTimer));

  app.post<{ Body: PlanGenerateRequest; Reply: PlanGenerateResponse | any }>(
    '/plan/generate',
    {
      preHandler: authGuard,
      config: { rateLimit: { max: 60, timeWindow: 24 * 60 * 60 * 1000 } },
    },
    async (req, reply) => {
      const traceId = req.traceId || randomUUID();
      const parsed = PlanGenerateBody.safeParse((req as any).body ?? {});
      if (!parsed.success) {
        return reply.sendError('PLAN_PARAMS_INVALID', 'invalid plan body', 400, false, {
          issues: parsed.error.issues,
        });
      }
      const userId = req.user!.id;
      const request = parsed.data as PlanGenerateRequest;
      try {
        resolveCityTimezone(request.city);
      } catch (error) {
        if (error instanceof UnsupportedPlannerCityError) {
          return reply.sendError(
            'PLAN_CITY_UNSUPPORTED',
            `暂不支持“${error.city}”的时区，请选择已支持城市`,
            400,
            false,
          );
        }
        throw error;
      }
      const idempotencyKey = String(req.headers['idempotency-key'] ?? '').trim();
      if (idempotencyKey && (idempotencyKey.length < 8 || idempotencyKey.length > 128)) {
        return reply.sendError('PLAN_IDEMPOTENCY_KEY_INVALID', 'invalid idempotency key', 400, false);
      }
      let result;
      try {
        result = await repository.createOrGetJob({
          userId,
          requestHash: requestHash(request, idempotencyKey || undefined),
          request,
          traceId,
        });
      } catch (error) {
        if (error instanceof UnsupportedPlannerCityError) {
          return reply.sendError(
            'PLAN_CITY_UNSUPPORTED',
            `暂不支持“${error.city}”的时区，请选择已支持城市`,
            400,
            false,
          );
        }
        throw error;
      }
      if (
        idempotencyKey &&
        !result.created &&
        stableJson(result.job.request) !== stableJson(request)
      ) {
        return reply.sendError(
          'PLAN_IDEMPOTENCY_CONFLICT',
          'idempotency key was already used for another request',
          409,
          false,
        );
      }
      if (result.created) {
        queueMicrotask(() => {
          void runQuickPlannerJob({
            job: result.job,
            repository,
            resolveInput: () =>
              resolvePlannerInput(userId, result.job.planId, result.job.request, source),
            startHq,
          })
            .then((runResult) => reportQuickPlannerResult(runResult, result.job))
            .catch((error) => {
              app.log.error({
                err: error,
                planJobId: result.job.id,
                planId: result.job.planId,
                attempt: result.job.attempt,
              }, 'quick planner job execution crashed');
            });
        });
      }
      const response: PlanGenerateResponse = {
        plan_id: result.job.planId,
        plan_job_id: result.job.id,
        sse_url: `/sse/plan/${result.job.id}`,
      };
      return reply.header('X-Trace-Id', traceId).code(202).send(response);
    },
  );

  app.get('/sse/plan/:jobId', { preHandler: authGuard }, async (req, reply) => {
    const jobId = (req.params as { jobId: string }).jobId;
    const userId = req.user!.id;
    const job = await repository.getJob(jobId, userId);
    if (!job) return reply.sendError('PLAN_JOB_NOT_FOUND', 'plan job not found', 404, false);

    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Connection', 'keep-alive');
    const lastEventId = String(req.headers['last-event-id'] ?? '');
    const [requestedAttemptText, requestedSequenceText] = lastEventId.includes(':')
      ? lastEventId.split(':', 2)
      : [String(job.attempt), lastEventId];
    let streamAttempt = Math.max(1, Number(requestedAttemptText) || job.attempt);
    let cursor = Math.max(0, Number(requestedSequenceText) || 0);
    if (streamAttempt !== job.attempt) {
      streamAttempt = job.attempt;
      cursor = 0;
    }
    let closed = false;
    let polling = false;
    let pollTimer: NodeJS.Timeout | undefined;
    let pingTimer: NodeJS.Timeout | undefined;
    const cleanup = () => {
      if (closed) return;
      closed = true;
      if (pollTimer) clearInterval(pollTimer);
      if (pingTimer) clearInterval(pingTimer);
    };
    req.raw.once('close', cleanup);
    reply.raw.once('close', cleanup);

    const replay = async () => {
      if (closed || polling) return;
      polling = true;
      try {
        const latest = await repository.getJob(jobId, userId);
        if (!latest) {
          cleanup();
          (reply as any).sseContext?.source?.end();
          return;
        }
        if (latest.attempt !== streamAttempt) {
          streamAttempt = latest.attempt;
          cursor = 0;
        }
        const events = await repository.listJobEvents(jobId, userId, cursor);
        for (const event of events) {
          cursor += 1;
          reply.sse({ id: `${streamAttempt}:${cursor}`, event: 'plan', data: JSON.stringify(event) });
          if (event.phase === 'done' || event.phase === 'failed') {
            cleanup();
            (reply as any).sseContext?.source?.end();
            break;
          }
        }
        if (!closed && events.length === 0) {
          if (latest.status === 'done' || latest.status === 'failed') {
            cleanup();
            (reply as any).sseContext?.source?.end();
          }
        }
      } finally {
        polling = false;
      }
    };
    await replay();
    if (!closed) {
      pollTimer = setInterval(() => void replay(), pollMs);
      pingTimer = setInterval(() => {
        if (!closed) {
          reply.sse({
            event: 'ping',
            data: JSON.stringify({
              trace_id: job.traceId,
              seq: Date.now(),
              heartbeat_ms: sseHeartbeatMs,
              ts: Date.now(),
            }),
          });
        }
      }, sseHeartbeatMs);
    }
  });

  app.get('/plan/:planId', { preHandler: authGuard }, async (req, reply) => {
    const plan = await repository.getPlan((req.params as { planId: string }).planId, req.user!.id);
    if (!plan) return reply.sendError('PLAN_NOT_FOUND', 'plan not found', 404, false);
    const current = plan.versions.find((version) => version.id === plan.currentVersionId);
    if (!current) return reply.sendError('PLAN_NOT_READY', 'Quick plan is not ready', 409, true);
    return reply.send(dayPlanResponse(plan, current));
  });

  app.get('/plan/:planId/versions/:versionId', { preHandler: authGuard }, async (req, reply) => {
    const params = req.params as { planId: string; versionId: string };
    const plan = await repository.getPlan(params.planId, req.user!.id);
    if (!plan) return reply.sendError('PLAN_NOT_FOUND', 'plan not found', 404, false);
    const version = await repository.getVersion(params.planId, params.versionId, req.user!.id);
    if (!version) return reply.sendError('PLAN_VERSION_NOT_FOUND', 'plan version not found', 404, false);
    return reply.send(dayPlanResponse(plan, version));
  });

  app.post<{ Body: EmptySlotResolveRequest }>(
    '/plan/:planId/slots/:slotId/resolve',
    { preHandler: authGuard },
    async (req, reply) => {
      const parsed = EmptySlotResolveBody.safeParse(req.body);
      if (!parsed.success) {
        return reply.sendError('PLAN_PARAMS_INVALID', 'invalid empty slot operation', 400, false, {
          issues: parsed.error.issues,
        });
      }
      const params = req.params as { planId: string; slotId: string };
      let resolvedSlot: components['schemas']['DayPlanSlot'] | null = null;
      try {
        const result = await repository.updateCurrentVersion({
          planId: params.planId,
          userId: req.user!.id,
          expectedPlanRev: parsed.data.expected_plan_rev,
          mutate: (payload) => {
            const resolved = resolveEmptySlot(payload, params.slotId, parsed.data);
            resolvedSlot = resolved.slot;
            return resolved.payload;
          },
        });
        return reply.send({ plan_id: params.planId, plan_rev: result.planRev, slot: resolvedSlot });
      } catch (error) {
        return mutationError(reply, error);
      }
    },
  );

  app.patch<{ Body: SlotEditRequest }>(
    '/plan/:planId/slots/:slotId',
    { preHandler: authGuard },
    async (req, reply) => {
      const parsedParams = PlanSlotParams.safeParse(req.params);
      if (!parsedParams.success) {
        return reply.sendError('PLAN_PARAMS_INVALID', 'invalid plan or slot id', 400, false);
      }
      const parsed = SlotEditBody.safeParse(req.body);
      if (!parsed.success) {
        return reply.sendError('PLAN_PARAMS_INVALID', 'invalid slot edit operation', 400, false, {
          issues: parsed.error.issues,
        });
      }
      const params = parsedParams.data;
      const owned = await repository.getPlan(params.planId, req.user!.id);
      if (!owned) return reply.sendError('PLAN_NOT_FOUND', 'plan not found', 404, false);
      const token = undoToken(params.planId, parsed.data.operation_id);
      let changedSlotId = params.slotId;
      if (
        (parsed.data.op === 'move_day' || parsed.data.op === 'retime')
        && parsed.data.target_day_index >= 0
      ) {
        const current = owned.versions.find(
          (version) => version.id === owned.currentVersionId,
        );
        const source = current?.payload.day_plans
          .flatMap((day) => day.slots.map((slot, index) => ({ day, slot, index })))
          .find((entry) => entry.slot.slot_id === params.slotId);
        if (source && source.day.day_index !== parsed.data.target_day_index) {
          changedSlotId = current?.payload.day_plans[parsed.data.target_day_index]
            ?.slots[source.index]?.slot_id ?? params.slotId;
        }
      }
      try {
        const result = await repository.applyEdit({
          planId: params.planId,
          userId: req.user!.id,
          expectedPlanRev: parsed.data.expected_plan_rev,
          operationId: parsed.data.operation_id,
          requestHash: createHash('sha256').update(stableJson(parsed.data)).digest('hex'),
          kind: parsed.data.op,
          slotId: params.slotId,
          undoTokenHash: tokenHash(token),
          undoTtlMs: 8_000,
          mutate: (payload) => {
            const edited = applySlotEdit(payload, params.slotId, parsed.data as SlotEditRequest);
            changedSlotId = edited.changedSlot.slot_id;
            return { payload: edited.payload, dayIndex: edited.dayIndex };
          },
        });
        const changedSlot = result.version.payload.day_plans
          .flatMap((day) => day.slots)
          .find((slot) => slot.slot_id === changedSlotId);
        if (!changedSlot) {
          throw new PlannerMutationError('PLAN_SLOT_NOT_FOUND', 'edited slot not found');
        }
        return reply.send({
          plan_id: params.planId,
          plan_rev: result.planRev,
          current_version_id: result.version.id,
          edit_event_id: result.editEvent.id,
          undo_token: token,
          undo_expires_at: result.editEvent.undoExpiresAt,
          changed_slot: changedSlot,
        });
      } catch (error) {
        return mutationError(reply, error);
      }
    },
  );

  app.get('/plan/:planId/recent-actions', { preHandler: authGuard }, async (req, reply) => {
    const parsedParams = PlanIdParams.safeParse(req.params);
    if (!parsedParams.success) {
      return reply.sendError('PLAN_PARAMS_INVALID', 'invalid plan id', 400, false);
    }
    const parsed = PlanRecentActionQuery.safeParse(req.query);
    if (!parsed.success) {
      return reply.sendError('PLAN_PARAMS_INVALID', 'invalid recent action query', 400, false);
    }
    const planId = parsedParams.data.planId;
    const snapshot = await repository.getRecentEdit(
      planId,
      req.user!.id,
      parsed.data.day_index,
    );
    if (!snapshot) return reply.sendError('PLAN_NOT_FOUND', 'plan not found', 404, false);
    const event = snapshot.event;
    return reply.send({
      plan_id: planId,
      plan_rev: snapshot.planRev,
      action: event && event.kind !== 'undo'
        ? {
            edit_event_id: event.id,
            kind: event.kind,
            day_index: event.dayIndex,
            slot_id: event.slotId,
            label: editLabels[event.kind],
            can_undo: true,
            created_at: event.createdAt,
          }
        : null,
    });
  });

  app.post<{ Body: PlanEditUndoRequest }>(
    '/plan/:planId/edits/undo',
    { preHandler: authGuard },
    async (req, reply) => {
      const parsedParams = PlanIdParams.safeParse(req.params);
      if (!parsedParams.success) {
        return reply.sendError('PLAN_PARAMS_INVALID', 'invalid plan id', 400, false);
      }
      const parsed = PlanEditUndoBody.safeParse(req.body);
      if (!parsed.success) {
        return reply.sendError('PLAN_PARAMS_INVALID', 'invalid edit undo request', 400, false);
      }
      const planId = parsedParams.data.planId;
      const plan = await repository.getPlan(planId, req.user!.id);
      if (!plan) return reply.sendError('PLAN_NOT_FOUND', 'plan not found', 404, false);
      try {
        const result = await repository.undoEdit({
          planId,
          userId: req.user!.id,
          expectedPlanRev: parsed.data.expected_plan_rev,
          ...('undo_token' in parsed.data
            ? { undoTokenHash: tokenHash(parsed.data.undo_token) }
            : { editEventId: parsed.data.edit_event_id }),
        });
        return reply.send({
          plan_id: planId,
          plan_rev: result.planRev,
          current_version_id: result.version.id,
          undo_event_id: result.undoEventId,
          undone_edit_event_id: result.undoneEditEventId,
        });
      } catch (error) {
        return mutationError(reply, error);
      }
    },
  );

  app.post<{ Body: PlanRevisionRequest }>(
    '/plan/:planId/seed/reset',
    { preHandler: authGuard },
    async (req, reply) => {
      const parsed = PlanRevisionBody.safeParse(req.body);
      if (!parsed.success) return reply.sendError('PLAN_PARAMS_INVALID', 'invalid seed reset', 400, false);
      const planId = (req.params as { planId: string }).planId;
      try {
        const result = await repository.updateCurrentVersion({
          planId,
          userId: req.user!.id,
          expectedPlanRev: parsed.data.expected_plan_rev,
          mutate: clearSeed,
        });
        return reply.send({ plan_id: planId, plan_rev: result.planRev });
      } catch (error) {
        return mutationError(reply, error);
      }
    },
  );

  app.post<{ Body: SeedUndoRequest }>(
    '/plan/:planId/seed/undo',
    { preHandler: authGuard },
    async (req, reply) => {
      const parsed = SeedUndoBody.safeParse(req.body);
      if (!parsed.success) return reply.sendError('PLAN_PARAMS_INVALID', 'invalid seed undo', 400, false);
      const planId = (req.params as { planId: string }).planId;
      try {
        const result = await repository.updateCurrentVersion({
          planId,
          userId: req.user!.id,
          expectedPlanRev: parsed.data.expected_plan_rev,
          mutate: (payload) => {
            const expiresAt = payload.seed_undo_expires_at
              ? Date.parse(payload.seed_undo_expires_at)
              : Number.NaN;
            if (
              !payload.seed_undo_token ||
              payload.seed_undo_token !== parsed.data.undo_token ||
              !Number.isFinite(expiresAt) ||
              expiresAt <= Date.now()
            ) {
              throw new PlannerMutationError('PLAN_UNDO_TOKEN_INVALID', 'seed undo token is invalid or expired');
            }
            return clearSeed(payload);
          },
        });
        return reply.send({ plan_id: planId, plan_rev: result.planRev });
      } catch (error) {
        return mutationError(reply, error);
      }
    },
  );

  app.post('/plan/hq/start', { preHandler: authGuard }, async (req, reply) => {
    const parsed = HqStartBody.safeParse(req.body);
    if (!parsed.success) return reply.sendError('PLAN_PARAMS_INVALID', 'invalid HQ start request', 400, false);
    const plan = await repository.getPlan(parsed.data.plan_id, req.user!.id);
    if (!plan) return reply.sendError('PLAN_NOT_FOUND', 'plan not found', 404, false);
    const quick = [...plan.versions].reverse().find((version) => version.kind === 'quick');
    if (!quick) return reply.sendError('PLAN_NOT_READY', 'Quick plan is not ready', 409, true);
    const job = await startHqPlanning({
      repository,
      adapter: hqAdapter,
      planId: plan.id,
      userId: req.user!.id,
      quickVersion: quick,
      traceId: req.traceId || randomUUID(),
    });
    return reply.code(202).send({ hq_job_id: job.id, state: job.state });
  });

  app.get('/plan/hq/status', { preHandler: authGuard }, async (req, reply) => {
    const parsed = HqStatusQuery.safeParse(req.query);
    if (!parsed.success) return reply.sendError('PLAN_PARAMS_INVALID', 'invalid HQ status request', 400, false);
    const job = await repository.getHqJob(parsed.data.hq_job_id, req.user!.id);
    if (!job) return reply.sendError('HQ_JOB_NOT_FOUND', 'HQ job not found', 404, false);
    return reply.send({
      hq_job_id: job.id,
      state: job.state,
      plan_id: job.planId,
      version_id: job.versionId,
      error_code: job.errorCode,
      retriable: job.retriable,
    });
  });

  app.post('/plan/hq/adopt', { preHandler: authGuard }, async (req, reply) => {
    const parsed = HqAdoptBody.safeParse(req.body);
    if (!parsed.success) return reply.sendError('PLAN_PARAMS_INVALID', 'invalid HQ adopt request', 400, false);
    const job = await repository.getHqJob(parsed.data.hq_job_id, req.user!.id);
    if (!job || job.planId !== parsed.data.plan_id) {
      return reply.sendError('HQ_JOB_NOT_FOUND', 'HQ job not found', 404, false);
    }
    if (job.state !== 'done' || !job.versionId) {
      return reply.sendError('HQ_NOT_READY', 'HQ plan is not ready', 409, job.retriable ?? true);
    }
    try {
      const adopted = await repository.adoptHqVersion({
        planId: parsed.data.plan_id,
        hqVersionId: job.versionId,
        baseVersionId: job.baseVersionId,
        userId: req.user!.id,
        expectedPlanRev: parsed.data.expected_plan_rev,
      });
      return reply.send({
        plan_id: parsed.data.plan_id,
        plan_rev: adopted.planRev,
        current_version_id: adopted.currentVersionId,
      });
    } catch (error) {
      return mutationError(reply, error);
    }
  });

});
