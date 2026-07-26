import { randomUUID } from 'node:crypto';
import {
  PlannerExecutionLeaseLost,
  PlannerRepositoryConflict,
  type CreatePlannerJobInput,
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

export class InMemoryPlannerRepository implements PlannerRepository {
  private readonly jobs = new Map<string, PlannerJobRecord>();
  private readonly jobsByRequest = new Map<string, string>();
  private readonly plans = new Map<string, PlannerPlanRecord>();
  private readonly events = new Map<string, PlanJobEvent[]>();
  private readonly hqJobs = new Map<string, PlannerHqJobRecord>();
  private readonly hqJobsByRequest = new Map<string, string>();

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
    const planId = `pl_${randomUUID()}`;
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
