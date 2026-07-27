import { randomUUID } from 'node:crypto';
import {
  PlannerExecutionLeaseLost,
  PlannerRepositoryConflict,
  type CreatePlannerJobInput,
  type ApplyPlannerEditInput,
  type PlannerEditEventRecord,
  type PlannerJobRecord,
  type PlannerHqJobRecord,
  type PlannerPlanRecord,
  type PlannerRepository,
  type PlannerVersionPayload,
  type PlannerVersionRecord,
  type PlanJobEvent,
} from '../repository.js';

function nowIso() {
  return new Date().toISOString();
}

function clone<T>(value: T): T {
  return structuredClone(value);
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

function directUndoForVersion(events: PlannerEditEventRecord[], versionId: string | null) {
  return versionId
    ? [...events].reverse().find(
        (event) => event.kind === 'undo' && event.resultVersionId === versionId,
      ) ?? null
    : null;
}

function effectiveVersionId(events: PlannerEditEventRecord[], versionId: string) {
  let effective = versionId;
  const visited = new Set<string>();
  while (!visited.has(effective)) {
    visited.add(effective);
    const undo = directUndoForVersion(events, effective);
    if (!undo?.targetEventId) return effective;
    const target = events.find((event) => event.id === undo.targetEventId);
    if (!target) return effective;
    effective = target.baseVersionId;
  }
  throw new Error('planner undo lineage contains a cycle');
}

export class InMemoryPlannerRepository implements PlannerRepository {
  private readonly jobs = new Map<string, PlannerJobRecord>();
  private readonly jobsByRequest = new Map<string, string>();
  private readonly plans = new Map<string, PlannerPlanRecord>();
  private readonly events = new Map<string, PlanJobEvent[]>();
  private readonly hqJobs = new Map<string, PlannerHqJobRecord>();
  private readonly hqJobsByRequest = new Map<string, string>();
  private readonly editEvents = new Map<string, PlannerEditEventRecord[]>();

  async createOrGetJob(input: CreatePlannerJobInput) {
    const requestKey = `${input.userId}:${input.requestHash}`;
    const existingId = this.jobsByRequest.get(requestKey);
    if (existingId) {
      const existing = this.jobs.get(existingId)!;
      if (stableJson(existing.request) !== stableJson(input.request)) {
        return { job: clone(existing), created: false };
      }
      if (existing.status === 'failed' && existing.retriable) {
        existing.status = 'queued';
        existing.errorCode = null;
        existing.retriable = null;
        existing.traceId = input.traceId;
        existing.attempt += 1;
        existing.traceId = input.traceId;
        existing.updatedAt = nowIso();
        this.events.set(existing.id, []);
        return { job: clone(existing), created: true };
      }
      return { job: clone(existing), created: false };
    }

    const createdAt = nowIso();
    const planId = randomUUID();
    const job: PlannerJobRecord = {
      id: `pj_${randomUUID()}`,
      planId,
      userId: input.userId,
      requestHash: input.requestHash,
      request: clone(input.request),
      traceId: input.traceId,
      attempt: 1,
      status: 'queued',
      quickVersionId: null,
      hqJobId: null,
      errorCode: null,
      retriable: null,
      createdAt,
      updatedAt: createdAt,
    };
    this.jobs.set(job.id, job);
    this.jobsByRequest.set(requestKey, job.id);
    this.plans.set(planId, {
      id: planId,
      userId: input.userId,
      planRev: 1,
      currentVersionId: null,
      versions: [],
      hqJob: null,
      createdAt,
      updatedAt: createdAt,
    });
    this.events.set(job.id, []);
    this.editEvents.set(planId, []);
    return { job: clone(job), created: true };
  }

  async getJob(jobId: string, userId: string) {
    const job = this.jobs.get(jobId);
    return job?.userId === userId ? clone(job) : null;
  }

  async heartbeatJob(jobId: string, attempt: number) {
    const job = this.jobs.get(jobId);
    if (!job || job.attempt !== attempt || !['queued', 'running'].includes(job.status)) {
      throw new PlannerExecutionLeaseLost();
    }
    job.updatedAt = nowIso();
  }

  async appendJobEvent(jobId: string, attempt: number, event: PlanJobEvent) {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error('planner job not found');
    if (job.attempt !== attempt || job.status === 'done' || job.status === 'failed') {
      throw new PlannerExecutionLeaseLost();
    }
    this.events.get(jobId)?.push(clone(event));
    job.updatedAt = nowIso();
    if (event.phase === 'done') job.status = 'done';
    if (event.phase === 'failed') {
      job.status = 'failed';
      job.errorCode = event.error_code ?? 'PLAN_GENERATION_FAILED';
      job.retriable = event.retriable ?? false;
    }
    if (event.phase === 'done') job.retriable = null;
  }

  async listJobEvents(jobId: string, userId: string, afterIndex = 0) {
    const job = this.jobs.get(jobId);
    if (!job || job.userId !== userId) return [];
    return clone((this.events.get(jobId) ?? []).slice(afterIndex));
  }

  async saveQuickVersion(jobId: string, attempt: number, payload: PlannerVersionPayload) {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error('planner job not found');
    if (job.attempt !== attempt || job.status === 'done' || job.status === 'failed') {
      throw new PlannerExecutionLeaseLost();
    }
    if (job.quickVersionId) {
      const existing = this.plans
        .get(job.planId)!
        .versions.find((version) => version.id === job.quickVersionId);
      if (existing) return clone(existing);
    }
    const version = this.createVersion(job.planId, 'quick', payload);
    const plan = this.plans.get(job.planId)!;
    plan.currentVersionId = version.id;
    plan.updatedAt = nowIso();
    job.quickVersionId = version.id;
    job.updatedAt = plan.updatedAt;
    return clone(version);
  }

  async saveHqVersion(planId: string, userId: string, payload: PlannerVersionPayload) {
    const plan = this.plans.get(planId);
    if (!plan || plan.userId !== userId) throw new Error('plan not found');
    return clone(this.createVersion(planId, 'hq', payload));
  }

  async saveHqVersionAndComplete(
    hqJobId: string,
    userId: string,
    attempt: number,
    payload: PlannerVersionPayload,
  ) {
    const job = this.hqJobs.get(hqJobId);
    if (!job || job.userId !== userId) {
      throw new Error('HQ job not found');
    }
    if (job.attempt !== attempt || job.state !== 'running') {
      throw new PlannerExecutionLeaseLost('HQ execution lease is no longer current');
    }
    const version = this.createVersion(job.planId, 'hq', payload);
    job.state = 'done';
    job.versionId = version.id;
    job.errorCode = null;
    job.retriable = null;
    job.updatedAt = nowIso();
    this.plans.get(job.planId)!.hqJob = clone(job);
    return clone(version);
  }

  async createOrGetHqJob(input: {
    planId: string;
    userId: string;
    requestHash: string;
    baseVersionId: string;
    traceId: string;
  }) {
    const plan = this.plans.get(input.planId);
    if (!plan || plan.userId !== input.userId) throw new Error('plan not found');
    const key = `${input.userId}:${input.requestHash}`;
    const existingId = this.hqJobsByRequest.get(key);
    if (existingId) {
      const existing = this.hqJobs.get(existingId)!;
      if (existing.state === 'failed' && existing.retriable) {
        existing.state = 'running';
        existing.attempt += 1;
        existing.versionId = null;
        existing.errorCode = null;
        existing.retriable = null;
        existing.updatedAt = nowIso();
        plan.hqJob = clone(existing);
        return { job: clone(existing), created: true };
      }
      return { job: clone(existing), created: false };
    }
    const createdAt = nowIso();
    const job: PlannerHqJobRecord = {
      id: `hq_${randomUUID()}`,
      planId: input.planId,
      userId: input.userId,
      requestHash: input.requestHash,
      baseVersionId: input.baseVersionId,
      traceId: input.traceId,
      attempt: 1,
      state: 'running',
      versionId: null,
      errorCode: null,
      retriable: null,
      createdAt,
      updatedAt: createdAt,
    };
    this.hqJobs.set(job.id, job);
    this.hqJobsByRequest.set(key, job.id);
    const planJob = [...this.jobs.values()].find((candidate) => candidate.planId === input.planId);
    if (planJob) planJob.hqJobId = job.id;
    plan.hqJob = clone(job);
    return { job: clone(job), created: true };
  }

  async getHqJob(hqJobId: string, userId: string) {
    const job = this.hqJobs.get(hqJobId);
    return job?.userId === userId ? clone(job) : null;
  }

  async heartbeatHqJob(hqJobId: string, userId: string, attempt: number) {
    const job = this.hqJobs.get(hqJobId);
    if (!job || job.userId !== userId || job.attempt !== attempt || job.state !== 'running') {
      throw new PlannerExecutionLeaseLost('HQ execution lease is no longer current');
    }
    job.updatedAt = nowIso();
  }

  async claimRecoverableJobs() {
    return [];
  }

  async claimRecoverableHqJobs() {
    return [];
  }

  async completeHqJob(hqJobId: string, userId: string, attempt: number, versionId: string) {
    const job = this.hqJobs.get(hqJobId);
    if (!job || job.userId !== userId) throw new Error('HQ job not found');
    if (job.attempt !== attempt || job.state !== 'running') {
      throw new PlannerExecutionLeaseLost('HQ execution lease is no longer current');
    }
    job.state = 'done';
    job.versionId = versionId;
    job.errorCode = null;
    job.retriable = null;
    job.updatedAt = nowIso();
    this.plans.get(job.planId)!.hqJob = clone(job);
    return clone(job);
  }

  async failHqJob(
    hqJobId: string,
    userId: string,
    attempt: number,
    errorCode: string,
    retriable: boolean,
  ) {
    const job = this.hqJobs.get(hqJobId);
    if (!job || job.userId !== userId) throw new Error('HQ job not found');
    if (job.attempt !== attempt || job.state !== 'running') {
      throw new PlannerExecutionLeaseLost('HQ execution lease is no longer current');
    }
    job.state = 'failed';
    job.errorCode = errorCode;
    job.retriable = retriable;
    job.updatedAt = nowIso();
    this.plans.get(job.planId)!.hqJob = clone(job);
    return clone(job);
  }

  async getPlan(planId: string, userId: string) {
    const plan = this.plans.get(planId);
    return plan?.userId === userId ? clone(plan) : null;
  }

  async getVersion(planId: string, versionId: string, userId: string) {
    const plan = this.plans.get(planId);
    if (!plan || plan.userId !== userId) return null;
    const version = plan.versions.find((item) => item.id === versionId);
    return version ? clone(version) : null;
  }

  async updateCurrentVersion(input: {
    planId: string;
    userId: string;
    expectedPlanRev: number;
    mutate: (payload: PlannerVersionPayload) => PlannerVersionPayload;
  }) {
    const plan = this.plans.get(input.planId);
    if (!plan || plan.userId !== input.userId) throw new Error('plan not found');
    if (plan.planRev !== input.expectedPlanRev) throw new PlannerRepositoryConflict('plan revision changed');
    const current = plan.versions.find((version) => version.id === plan.currentVersionId);
    if (!current) throw new Error('current plan version not found');
    const version = this.createVersion(input.planId, current.kind, input.mutate(clone(current.payload)));
    plan.currentVersionId = version.id;
    plan.planRev += 1;
    plan.updatedAt = nowIso();
    return { planRev: plan.planRev, version: clone(version) };
  }

  async applyEdit(input: ApplyPlannerEditInput) {
    const plan = this.plans.get(input.planId);
    if (!plan || plan.userId !== input.userId) throw new Error('plan not found');
    const events = this.editEvents.get(input.planId) ?? [];
    const duplicate = events.find((event) => event.operationId === input.operationId);
    if (duplicate) {
      if (
        duplicate.requestHash !== input.requestHash
        || duplicate.kind !== input.kind
        || duplicate.slotId !== input.slotId
      ) {
        throw new PlannerRepositoryConflict(
          'operation id was already used for another edit',
          'PLAN_EDIT_IDEMPOTENCY_CONFLICT',
        );
      }
      const version = plan.versions.find((item) => item.id === duplicate.resultVersionId);
      if (!version) throw new Error('edit result version not found');
      return {
        planRev: duplicate.resultPlanRev,
        version: clone(version),
        editEvent: clone(duplicate),
      };
    }
    if (plan.planRev !== input.expectedPlanRev) {
      throw new PlannerRepositoryConflict('plan revision changed');
    }
    const current = plan.versions.find((version) => version.id === plan.currentVersionId);
    if (!current) throw new Error('current plan version not found');
    const mutated = input.mutate(clone(current.payload));
    const version = this.createVersion(input.planId, current.kind, mutated.payload);
    const createdAt = nowIso();
    const undoExpiresAt = new Date(Date.now() + input.undoTtlMs).toISOString();
    const editEvent: PlannerEditEventRecord = {
      id: `edit_${randomUUID()}`,
      planId: input.planId,
      kind: input.kind,
      operationId: input.operationId,
      requestHash: input.requestHash,
      slotId: input.slotId,
      dayIndex: mutated.dayIndex,
      baseVersionId: effectiveVersionId(events, current.id),
      resultVersionId: version.id,
      resultPlanRev: plan.planRev + 1,
      undoTokenHash: input.undoTokenHash,
      undoExpiresAt,
      targetEventId: null,
      undoneByEventId: null,
      createdAt,
    };
    plan.currentVersionId = version.id;
    plan.planRev += 1;
    plan.updatedAt = createdAt;
    events.push(editEvent);
    this.editEvents.set(input.planId, events);
    return { planRev: plan.planRev, version: clone(version), editEvent: clone(editEvent) };
  }

  async getRecentEdit(planId: string, userId: string, dayIndex?: number) {
    const plan = this.plans.get(planId);
    if (!plan || plan.userId !== userId) return null;
    const events = this.editEvents.get(planId) ?? [];
    if (!plan.currentVersionId) return { planRev: plan.planRev, event: null };
    const latest = [...events]
      .reverse()
      .find((event) => event.kind !== 'undo' && !event.undoneByEventId);
    const currentUndo = directUndoForVersion(events, plan.currentVersionId);
    const eligible = latest
      && (!currentUndo || !currentUndo.operationId.startsWith('undo:recent:'))
      && effectiveVersionId(events, plan.currentVersionId) === latest.resultVersionId
      && (dayIndex === undefined || latest.dayIndex === dayIndex)
        ? clone(latest)
        : null;
    return { planRev: plan.planRev, event: eligible };
  }

  async undoEdit(input: {
    planId: string;
    userId: string;
    expectedPlanRev: number;
    undoTokenHash?: string;
    editEventId?: string;
  }) {
    const plan = this.plans.get(input.planId);
    if (!plan || plan.userId !== input.userId) throw new Error('plan not found');
    if (plan.planRev !== input.expectedPlanRev) {
      throw new PlannerRepositoryConflict('plan revision changed');
    }
    const events = this.editEvents.get(input.planId) ?? [];
    const target = [...events]
      .reverse()
      .find((event) => event.kind !== 'undo' && !event.undoneByEventId);
    if (!target) {
      throw new PlannerRepositoryConflict(
        'no edit is eligible for undo',
        'PLAN_EDIT_UNDO_NOT_ELIGIBLE',
      );
    }
    if (input.editEventId) {
      if (input.editEventId !== target.id) {
        throw new PlannerRepositoryConflict(
          'only the latest effective edit can be undone',
          'PLAN_EDIT_UNDO_NOT_ELIGIBLE',
        );
      }
    } else {
      const expiresAt = target.undoExpiresAt ? Date.parse(target.undoExpiresAt) : Number.NaN;
      if (
        !input.undoTokenHash
        || input.undoTokenHash !== target.undoTokenHash
        || !Number.isFinite(expiresAt)
        || expiresAt <= Date.now()
      ) {
        throw new PlannerRepositoryConflict(
          'undo token is invalid or expired',
          'PLAN_EDIT_UNDO_INVALID',
        );
      }
    }
    const current = plan.versions.find((version) => version.id === plan.currentVersionId);
    const base = plan.versions.find((version) => version.id === target.baseVersionId);
    if (!current || !base) throw new Error('edit version not found');
    const currentUndo = directUndoForVersion(events, current.id);
    if (
      input.editEventId
      && currentUndo?.operationId.startsWith('undo:recent:')
    ) {
      throw new PlannerRepositoryConflict(
        'the additional recent-action undo was already used',
        'PLAN_EDIT_UNDO_NOT_ELIGIBLE',
      );
    }
    if (effectiveVersionId(events, current.id) !== target.resultVersionId) {
      throw new PlannerRepositoryConflict(
        'the current plan has changes after this edit',
        'PLAN_EDIT_UNDO_NOT_ELIGIBLE',
      );
    }
    const version = this.createVersion(input.planId, current.kind, base.payload);
    const createdAt = nowIso();
    const undoEvent: PlannerEditEventRecord = {
      id: `edit_${randomUUID()}`,
      planId: input.planId,
      kind: 'undo',
      operationId: `undo:${input.editEventId ? 'recent' : 'token'}:${target.id}`,
      requestHash: `undo:${input.editEventId ? 'recent' : 'token'}:${target.id}`,
      slotId: target.slotId,
      dayIndex: target.dayIndex,
      baseVersionId: current.id,
      resultVersionId: version.id,
      resultPlanRev: plan.planRev + 1,
      undoTokenHash: null,
      undoExpiresAt: null,
      targetEventId: target.id,
      undoneByEventId: null,
      createdAt,
    };
    target.undoneByEventId = undoEvent.id;
    events.push(undoEvent);
    plan.currentVersionId = version.id;
    plan.planRev += 1;
    plan.updatedAt = createdAt;
    return {
      planRev: plan.planRev,
      version: clone(version),
      undoEventId: undoEvent.id,
      undoneEditEventId: target.id,
    };
  }

  async adoptHqVersion(input: {
    planId: string;
    hqVersionId: string;
    baseVersionId: string;
    userId: string;
    expectedPlanRev: number;
  }) {
    const plan = this.plans.get(input.planId);
    if (!plan || plan.userId !== input.userId) throw new Error('plan not found');
    if (plan.currentVersionId === input.hqVersionId) {
      return { planRev: plan.planRev, currentVersionId: input.hqVersionId };
    }
    if (plan.planRev !== input.expectedPlanRev) throw new PlannerRepositoryConflict('plan revision changed');
    if (plan.currentVersionId !== input.baseVersionId) {
      throw new PlannerRepositoryConflict('HQ base version changed');
    }
    const version = plan.versions.find((item) => item.id === input.hqVersionId && item.kind === 'hq');
    if (!version || version.state === 'failed') throw new Error('HQ version not ready');
    version.state = 'adopted';
    plan.currentVersionId = version.id;
    plan.planRev += 1;
    plan.updatedAt = nowIso();
    return { planRev: plan.planRev, currentVersionId: version.id };
  }

  private createVersion(planId: string, kind: 'quick' | 'hq', payload: PlannerVersionPayload) {
    const plan = this.plans.get(planId);
    if (!plan) throw new Error('plan not found');
    const version: PlannerVersionRecord = {
      id: `pv_${randomUUID()}`,
      planId,
      kind,
      state: 'ready',
      payload: clone(payload),
      createdAt: nowIso(),
    };
    plan.versions.push(version);
    return version;
  }
}
