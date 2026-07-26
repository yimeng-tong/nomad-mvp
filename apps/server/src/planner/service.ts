import { buildQuickPlan } from './quick.js';
import { PlannerInputError } from './resolver.js';
import { PlannerExecutionLeaseLost } from './repository.js';
import type {
  PlanJobEvent,
  PlannerJobRecord,
  PlannerRepository,
  PlannerVersionPayload,
  PlannerVersionRecord,
} from './repository.js';
import type { QuickPlannerInput } from './types.js';

type RunQuickPlannerJobInput = {
  job: PlannerJobRecord;
  repository: PlannerRepository;
  resolveInput: () => Promise<QuickPlannerInput>;
  startHq?: (input: {
    job: PlannerJobRecord;
    quickVersion: PlannerVersionRecord;
    payload: PlannerVersionPayload;
  }) => Promise<string | null>;
};

export async function runQuickPlannerJob(input: RunQuickPlannerJobInput) {
  const base = {
    trace_id: input.job.traceId,
    plan_id: input.job.planId,
    plan_job_id: input.job.id,
  };
  const emit = async (event: Omit<PlanJobEvent, keyof typeof base | 'ts'>) => {
    await input.repository.appendJobEvent(
      input.job.id,
      input.job.attempt,
      { ...base, ...event, ts: Date.now() },
    );
  };
  const leaseMs = Math.max(10_000, Number(process.env.PLANNER_JOB_LEASE_MS || 60_000));
  const heartbeat = setInterval(
    () => void input.repository.heartbeatJob(input.job.id, input.job.attempt).catch(() => undefined),
    Math.max(1_000, Math.floor(leaseMs / 3)),
  );
  heartbeat.unref();

  try {
    await emit({ phase: 'started' });
    await emit({ phase: 'freeze' });
    const resolved = await input.resolveInput();
    await emit({ phase: 'selected_anchor', placed_count: resolved.selectedItems.length });
    await emit({ phase: 'quota' });
    await emit({ phase: 'candidates', remaining_count: resolved.candidateItems.length });
    const payload = buildQuickPlan(resolved);
    if (payload.seed_undo_token) {
      payload.seed_undo_expires_at = new Date(Date.now() + 7_000).toISOString();
    }
    const placedCount = payload.day_plans
      .flatMap((day) => day.slots)
      .filter((slot) => slot.type === 'place').length;
    const remainingCount =
      payload.candidates.filter((candidate) => candidate.status !== 'used').length +
      payload.unresolved_required.length;
    await emit({ phase: 'place', placed_count: placedCount, remaining_count: remainingCount });
    await emit({ phase: 'validate', placed_count: placedCount, remaining_count: remainingCount });
    await emit({ phase: 'persist', placed_count: placedCount, remaining_count: remainingCount });
    const quickVersion = await input.repository.saveQuickVersion(
      input.job.id,
      input.job.attempt,
      payload,
    );
    let hqJobId: string | null = null;
    if (resolved.smartPlanning && input.startHq) {
      hqJobId = await input.startHq({ job: input.job, quickVersion, payload }).catch(() => null);
    }
    await emit({
      phase: 'done',
      placed_count: placedCount,
      remaining_count: remainingCount,
      quick_version_id: quickVersion.id,
      hq_job_id: hqJobId,
    });
    return { ok: true as const, quickVersion, hqJobId };
  } catch (error) {
    if (error instanceof PlannerExecutionLeaseLost) {
      return { ok: false as const, error };
    }
    const typed = error instanceof PlannerInputError;
    try {
      await emit({
        phase: 'failed',
        error_code: typed ? error.code : 'PLAN_GENERATION_FAILED',
        error_message: typed ? error.message : '计划生成失败，请稍后重试',
        retriable: !typed,
      });
    } catch (emitError) {
      if (!(emitError instanceof PlannerExecutionLeaseLost)) throw emitError;
    }
    return { ok: false as const, error };
  } finally {
    clearInterval(heartbeat);
  }
}
