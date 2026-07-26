import type { components } from '../../../../packages/types/src/api-types.js';

export type PlanGenerateRequest = components['schemas']['PlanGenerateRequest'];
export type DayPlanResponse = components['schemas']['DayPlanResponse'];
export type PlanJobEvent = components['schemas']['PlanJobEvent'];

export type PlannerVersionPayload = Pick<
  DayPlanResponse,
  'city' | 'start_date' | 'days' | 'pace' | 'day_plans' | 'candidates' | 'warnings' | 'unresolved_required'
> & {
  seed_undo_token?: string | null;
  seed_undo_expires_at?: string | null;
};

export type PlannerJobRecord = {
  id: string;
  planId: string;
  userId: string;
  requestHash: string;
  request: PlanGenerateRequest;
  traceId: string;
  attempt: number;
  status: 'queued' | 'running' | 'done' | 'failed';
  quickVersionId: string | null;
  hqJobId: string | null;
  errorCode: string | null;
  retriable: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type PlannerVersionRecord = {
  id: string;
  planId: string;
  kind: 'quick' | 'hq';
  state: 'running' | 'ready' | 'failed' | 'adopted';
  payload: PlannerVersionPayload;
  createdAt: string;
};

export type PlannerPlanRecord = {
  id: string;
  userId: string;
  planRev: number;
  currentVersionId: string | null;
  versions: PlannerVersionRecord[];
  hqJob: PlannerHqJobRecord | null;
  createdAt: string;
  updatedAt: string;
};

export type PlannerHqJobRecord = {
  id: string;
  planId: string;
  userId: string;
  requestHash: string;
  baseVersionId: string;
  traceId: string;
  attempt: number;
  state: 'running' | 'done' | 'failed';
  versionId: string | null;
  errorCode: string | null;
  retriable: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePlannerJobInput = {
  userId: string;
  requestHash: string;
  request: PlanGenerateRequest;
  traceId: string;
};

export interface PlannerRepository {
  createOrGetJob(input: CreatePlannerJobInput): Promise<{ job: PlannerJobRecord; created: boolean }>;
  getJob(jobId: string, userId: string): Promise<PlannerJobRecord | null>;
  heartbeatJob(jobId: string, attempt: number): Promise<void>;
  appendJobEvent(jobId: string, attempt: number, event: PlanJobEvent): Promise<void>;
  listJobEvents(jobId: string, userId: string, afterIndex?: number): Promise<PlanJobEvent[]>;
  saveQuickVersion(
    jobId: string,
    attempt: number,
    payload: PlannerVersionPayload,
  ): Promise<PlannerVersionRecord>;
  saveHqVersion(planId: string, userId: string, payload: PlannerVersionPayload): Promise<PlannerVersionRecord>;
  saveHqVersionAndComplete(
    hqJobId: string,
    userId: string,
    attempt: number,
    payload: PlannerVersionPayload,
  ): Promise<PlannerVersionRecord>;
  createOrGetHqJob(input: {
    planId: string;
    userId: string;
    requestHash: string;
    baseVersionId: string;
    traceId: string;
  }): Promise<{ job: PlannerHqJobRecord; created: boolean }>;
  getHqJob(hqJobId: string, userId: string): Promise<PlannerHqJobRecord | null>;
  heartbeatHqJob(hqJobId: string, userId: string, attempt: number): Promise<void>;
  completeHqJob(
    hqJobId: string,
    userId: string,
    attempt: number,
    versionId: string,
  ): Promise<PlannerHqJobRecord>;
  failHqJob(
    hqJobId: string,
    userId: string,
    attempt: number,
    errorCode: string,
    retriable: boolean,
  ): Promise<PlannerHqJobRecord>;
  claimRecoverableJobs(staleBefore: string, limit: number): Promise<PlannerJobRecord[]>;
  claimRecoverableHqJobs(staleBefore: string, limit: number): Promise<PlannerHqJobRecord[]>;
  getPlan(planId: string, userId: string): Promise<PlannerPlanRecord | null>;
  getVersion(planId: string, versionId: string, userId: string): Promise<PlannerVersionRecord | null>;
  updateCurrentVersion(input: {
    planId: string;
    userId: string;
    expectedPlanRev: number;
    mutate: (payload: PlannerVersionPayload) => PlannerVersionPayload;
  }): Promise<{ planRev: number; version: PlannerVersionRecord }>;
  adoptHqVersion(input: {
    planId: string;
    hqVersionId: string;
    baseVersionId: string;
    userId: string;
    expectedPlanRev: number;
  }): Promise<{ planRev: number; currentVersionId: string }>;
}

export class PlannerRepositoryConflict extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlannerRepositoryConflict';
  }
}

export class PlannerExecutionLeaseLost extends PlannerRepositoryConflict {
  constructor(message = 'planner execution lease is no longer current') {
    super(message);
    this.name = 'PlannerExecutionLeaseLost';
  }
}
