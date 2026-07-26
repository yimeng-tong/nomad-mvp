import { createHash } from 'node:crypto';
import { z } from 'zod';
import { PlannerExecutionLeaseLost } from './repository.js';
import type {
  PlannerHqJobRecord,
  PlannerRepository,
  PlannerVersionPayload,
  PlannerVersionRecord,
} from './repository.js';

export type HqPlannerContext = {
  planId: string;
  userId: string;
  traceId: string;
};

export interface HqPlannerAdapter {
  improve(payload: PlannerVersionPayload, context: HqPlannerContext): Promise<PlannerVersionPayload>;
}

export class HqPlanningError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly retriable: boolean,
  ) {
    super(message);
    this.name = 'HqPlanningError';
  }
}

export class DeterministicFakeHqAdapter implements HqPlannerAdapter {
  async improve(payload: PlannerVersionPayload) {
    const next = structuredClone(payload);
    if (!next.warnings.some((warning) => warning.code === 'HQ_REFINED')) {
      next.warnings.push({
        code: 'HQ_REFINED',
        severity: 'soft',
        message: '高质量规划已完成',
      });
    }
    return next;
  }
}

export class UnavailableHqAdapter implements HqPlannerAdapter {
  async improve(): Promise<PlannerVersionPayload> {
    throw new HqPlanningError('HQ_PROVIDER_UNAVAILABLE', 'HQ provider is not configured', true);
  }
}

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: unknown } }>;
};

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const nullableString = z.string().nullable().optional();
const qualitySchema = z.enum(['verified', 'high', 'medium', 'low']);
const poiSchema = z.object({
  poi_id: z.string().min(1),
  amap_id: nullableString,
  name: z.string().min(1),
  address: nullableString,
  latitude: z.number().finite().min(-90).max(90).nullable().optional(),
  longitude: z.number().finite().min(-180).max(180).nullable().optional(),
  verified: z.boolean(),
  quality: qualitySchema.nullable().optional(),
  source_attribution: nullableString,
}).strict();
const constraintSchema = z.object({
  item_id: z.string().min(1),
  poi_id: nullableString,
  date: dateSchema.nullable().optional(),
  start_local: timeSchema.nullable().optional(),
  end_local: timeSchema.nullable().optional(),
  timezone: z.string().min(1),
  time_hint: z.enum(['dawn', 'morning', 'afternoon', 'sunset', 'evening', 'night', 'night_market']),
  source: z.enum(['uploaded_inspiration', 'reservation', 'ticket']),
  evidence_ref: z.string().min(1),
  source_attribution: nullableString,
  quality: qualitySchema,
}).strict();
const slotSchema = z.object({
  slot_id: z.string().min(1),
  day_index: z.number().int().nonnegative(),
  slot_index: z.number().int().nonnegative(),
  start_local: timeSchema,
  end_local: timeSchema,
  type: z.enum(['place', 'free', 'hotel', 'unresolved']),
  origin: z.enum(['selected_required', 'ai_seed', 'hand', 'hotel', 'free']),
  title: nullableString,
  poi: poiSchema.nullable().optional(),
  inspiration_id: nullableString,
  constraint: constraintSchema.nullable().optional(),
  warning_codes: z.array(z.string()).optional(),
}).strict();
const payloadSchema = z.object({
  city: z.string().min(1),
  start_date: dateSchema,
  days: z.number().int().min(1).max(14),
  pace: z.enum(['tight', 'comfortable']),
  day_plans: z.array(z.object({
    day_index: z.number().int().nonnegative(),
    date: dateSchema,
    slots: z.array(slotSchema),
    hotel: z.object({
      date: dateSchema,
      leave_blank: z.boolean(),
      breakfast_included: z.boolean().optional(),
      poi: poiSchema.nullable().optional(),
    }).strict(),
  }).strict()),
  candidates: z.array(z.object({
    candidate_id: z.string().min(1),
    item_id: z.string().min(1),
    poi: poiSchema.nullable().optional(),
    status: z.enum(['available', 'requires_location', 'used']),
    source: z.enum(['user_candidate', 'anchor_pool', 'built_in', 'amap', 'ai']),
    reason: z.string().max(40),
    quality: qualitySchema.nullable().optional(),
    source_attribution: nullableString,
  }).strict()),
  warnings: z.array(z.object({
    code: z.string().min(1),
    severity: z.enum(['soft', 'hard']),
    message: z.string().min(1),
    slot_id: nullableString,
    item_id: nullableString,
  }).strict()),
  unresolved_required: z.array(z.object({
    item_id: z.string().min(1),
    poi_id: nullableString,
    reason_code: z.enum(['requires_location', 'hard_time_conflict', 'closed', 'outside_trip', 'unavailable']),
    message: z.string().min(1),
  }).strict()),
  seed_undo_token: nullableString,
  seed_undo_expires_at: nullableString,
}).strict();

function localMinutes(value: string) {
  return Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
}

function hardConstraintFingerprint(
  date: string,
  slot: z.infer<typeof slotSchema>,
) {
  if (!slot.constraint) return null;
  return JSON.stringify({
    date,
    start_local: slot.start_local,
    end_local: slot.end_local,
    poi_id: slot.poi?.poi_id ?? null,
    origin: slot.origin,
    constraint: slot.constraint,
  });
}

function poiFingerprint(poi: z.infer<typeof poiSchema>) {
  return JSON.stringify({
    poi_id: poi.poi_id,
    amap_id: poi.amap_id ?? null,
    name: poi.name,
    address: poi.address ?? null,
    latitude: poi.latitude ?? null,
    longitude: poi.longitude ?? null,
    verified: poi.verified,
    quality: poi.quality ?? null,
    source_attribution: poi.source_attribution ?? null,
  });
}

function candidateFingerprint(candidate: PlannerVersionPayload['candidates'][number]) {
  return JSON.stringify({
    candidate_id: candidate.candidate_id,
    item_id: candidate.item_id,
    poi_id: candidate.poi?.poi_id ?? null,
    source: candidate.source,
    reason: candidate.reason,
    quality: candidate.quality ?? null,
    source_attribution: candidate.source_attribution ?? null,
  });
}

export function validateHqPayload(
  baseline: PlannerVersionPayload,
  value: unknown,
): PlannerVersionPayload {
  const parsed = payloadSchema.safeParse(value);
  if (!parsed.success) {
    throw new HqPlanningError('HQ_OUTPUT_INVALID', 'HQ provider returned an invalid plan shape', true);
  }
  const result = parsed.data as PlannerVersionPayload;
  if (
    result.city !== baseline.city ||
    result.start_date !== baseline.start_date ||
    result.days !== baseline.days ||
    result.pace !== baseline.pace ||
    result.day_plans.length !== baseline.day_plans.length
  ) {
    throw new HqPlanningError('HQ_OUTPUT_INVALID', 'HQ provider changed immutable trip parameters', true);
  }

  const knownPoiIds = new Set<string>();
  const canonicalPoi = new Map<string, string>();
  const requiredPoiIds = new Set<string>();
  const baselineHardConstraints = new Map<string, string>();
  for (const day of baseline.day_plans) {
    if (day.hotel.poi) {
      knownPoiIds.add(day.hotel.poi.poi_id);
      canonicalPoi.set(day.hotel.poi.poi_id, poiFingerprint(day.hotel.poi));
    }
    for (const slot of day.slots) {
      if (!slot.poi) continue;
      knownPoiIds.add(slot.poi.poi_id);
      canonicalPoi.set(slot.poi.poi_id, poiFingerprint(slot.poi));
      if (slot.origin === 'selected_required') requiredPoiIds.add(slot.poi.poi_id);
      if (slot.constraint) {
        baselineHardConstraints.set(
          slot.constraint.evidence_ref,
          hardConstraintFingerprint(day.date, slot as z.infer<typeof slotSchema>)!,
        );
      }
    }
  }
  for (const candidate of baseline.candidates) {
    if (candidate.poi) {
      knownPoiIds.add(candidate.poi.poi_id);
      canonicalPoi.set(candidate.poi.poi_id, poiFingerprint(candidate.poi));
    }
  }

  const outputRequired = new Set<string>();
  const outputHardConstraints = new Map<string, string>();
  for (let dayIndex = 0; dayIndex < result.day_plans.length; dayIndex += 1) {
    const day = result.day_plans[dayIndex]!;
    const baselineDay = baseline.day_plans[dayIndex]!;
    if (day.day_index !== baselineDay.day_index || day.date !== baselineDay.date || day.hotel.date !== day.date) {
      throw new HqPlanningError('HQ_OUTPUT_INVALID', 'HQ provider changed the day sequence', true);
    }
    if (
      day.hotel.leave_blank !== baselineDay.hotel.leave_blank ||
      (day.hotel.breakfast_included ?? false) !==
        (baselineDay.hotel.breakfast_included ?? false) ||
      (day.hotel.poi?.poi_id ?? null) !== (baselineDay.hotel.poi?.poi_id ?? null) ||
      (day.hotel.poi &&
        (!knownPoiIds.has(day.hotel.poi.poi_id) ||
          !day.hotel.poi.verified ||
          canonicalPoi.get(day.hotel.poi.poi_id) !== poiFingerprint(day.hotel.poi)))
    ) {
      throw new HqPlanningError('HQ_OUTPUT_INVALID', 'HQ provider changed an explicit hotel constraint', true);
    }
    const orderedSlots = [...day.slots].sort((left, right) => left.slot_index - right.slot_index);
    let previousEnd = -1;
    for (const slot of orderedSlots) {
      const start = localMinutes(slot.start_local);
      const end = localMinutes(slot.end_local);
      if (slot.day_index !== day.day_index || start >= end || start < previousEnd) {
        throw new HqPlanningError('HQ_OUTPUT_INVALID', 'HQ provider returned overlapping slots', true);
      }
      previousEnd = end;
      if (!slot.poi) continue;
      if (
        !knownPoiIds.has(slot.poi.poi_id) ||
        !slot.poi.verified ||
        canonicalPoi.get(slot.poi.poi_id) !== poiFingerprint(slot.poi)
      ) {
        throw new HqPlanningError('HQ_OUTPUT_INVALID', 'HQ provider introduced an unknown or unverified POI', true);
      }
      if (slot.origin === 'selected_required') outputRequired.add(slot.poi.poi_id);
      if (slot.constraint) {
        const evidenceRef = slot.constraint.evidence_ref;
        if (!baselineHardConstraints.has(evidenceRef)) {
          throw new HqPlanningError('HQ_OUTPUT_INVALID', 'HQ provider invented a hard-time constraint', true);
        }
        outputHardConstraints.set(evidenceRef, hardConstraintFingerprint(day.date, slot)!);
      }
    }
  }
  for (const poiId of requiredPoiIds) {
    if (!outputRequired.has(poiId)) {
      throw new HqPlanningError('HQ_OUTPUT_INVALID', 'HQ provider removed a selected location', true);
    }
  }
  for (const [evidenceRef, fingerprint] of baselineHardConstraints) {
    if (outputHardConstraints.get(evidenceRef) !== fingerprint) {
      throw new HqPlanningError('HQ_OUTPUT_INVALID', 'HQ provider changed a hard-time constraint', true);
    }
  }
  const baselineCandidateFingerprint = new Map(
    baseline.candidates.map((candidate) => [
      candidate.item_id,
      candidateFingerprint(candidate),
    ]),
  );
  for (const candidate of result.candidates) {
    if (
      baselineCandidateFingerprint.get(candidate.item_id) !==
        candidateFingerprint(candidate) ||
      (candidate.poi &&
        (!knownPoiIds.has(candidate.poi.poi_id) ||
          !candidate.poi.verified ||
          canonicalPoi.get(candidate.poi.poi_id) !== poiFingerprint(candidate.poi)))
    ) {
      throw new HqPlanningError('HQ_OUTPUT_INVALID', 'HQ provider changed the candidate POI set', true);
    }
  }
  if (
    result.candidates.length !== baselineCandidateFingerprint.size ||
    [...baselineCandidateFingerprint.keys()].some(
      (itemId) => !result.candidates.some((candidate) => candidate.item_id === itemId),
    )
  ) {
    throw new HqPlanningError('HQ_OUTPUT_INVALID', 'HQ provider removed a candidate', true);
  }
  const outputSlotInspirationIds = new Set(
    result.day_plans.flatMap((day) =>
      day.slots.flatMap((slot) => slot.inspiration_id ? [slot.inspiration_id] : []),
    ),
  );
  const outputSlotPoiIds = new Set(
    result.day_plans.flatMap((day) =>
      day.slots.flatMap((slot) => slot.poi ? [slot.poi.poi_id] : []),
    ),
  );
  for (const candidate of result.candidates) {
    const isUsed =
      outputSlotInspirationIds.has(candidate.item_id) ||
      Boolean(candidate.poi && outputSlotPoiIds.has(candidate.poi.poi_id));
    if (
      (candidate.status === 'used') !== isUsed ||
      (candidate.status === 'requires_location') !== (candidate.poi == null)
    ) {
      throw new HqPlanningError(
        'HQ_OUTPUT_INVALID',
        'HQ provider returned candidate status inconsistent with plan slots',
        true,
      );
    }
  }
  const outputUnresolved = new Set(result.unresolved_required.map((item) => item.item_id));
  for (const unresolved of baseline.unresolved_required) {
    if (!outputUnresolved.has(unresolved.item_id)) {
      throw new HqPlanningError('HQ_OUTPUT_INVALID', 'HQ provider removed an unresolved required item', true);
    }
  }
  return result;
}

const dailyUsage = new Map<string, number>();

function reserveDailyQuota(userId: string) {
  const day = new Date().toISOString().slice(0, 10);
  const key = `${day}:${userId}`;
  const limit = Math.max(1, Number(process.env.PLANNER_HQ_DAILY_LIMIT || 20));
  const used = dailyUsage.get(key) ?? 0;
  if (used >= limit) throw new HqPlanningError('HQ_QUOTA_EXCEEDED', 'HQ daily quota exceeded', false);
  dailyUsage.set(key, used + 1);
}

export class ServerManagedHqAdapter implements HqPlannerAdapter {
  async improve(payload: PlannerVersionPayload, context: HqPlannerContext) {
    const baseUrl = process.env.AI_PROVIDER_BASE_URL?.replace(/\/+$/, '');
    const apiKey = process.env.AI_PROVIDER_API_KEY;
    const model = process.env.AI_PROVIDER_MODEL;
    if (!baseUrl || !apiKey || !model) {
      throw new HqPlanningError('HQ_PROVIDER_UNAVAILABLE', 'HQ provider is not configured', true);
    }
    reserveDailyQuota(context.userId);
    const timeoutMs = Math.max(1000, Number(process.env.PLANNER_HQ_TIMEOUT_MS || 20_000));
    let response: Response;
    try {
      response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Trace-Id': context.traceId,
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          max_tokens: Math.max(512, Number(process.env.PLANNER_HQ_MAX_TOKENS || 4096)),
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'Refine this travel day plan without removing selected_required slots or inventing POIs. Return only the complete JSON object in the same shape.',
            },
            { role: 'user', content: JSON.stringify(payload) },
          ],
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      throw new HqPlanningError('HQ_PROVIDER_TIMEOUT', 'HQ provider request failed or timed out', true);
    }
    if (!response.ok) {
      throw new HqPlanningError('HQ_PROVIDER_ERROR', `HQ provider returned HTTP ${response.status}`, true);
    }
    const body = (await response.json().catch(() => null)) as ChatCompletionResponse | null;
    const content = body?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.length > 1_000_000) {
      throw new HqPlanningError('HQ_OUTPUT_INVALID', 'HQ provider returned invalid content', true);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(content) as unknown;
    } catch {
      throw new HqPlanningError('HQ_OUTPUT_INVALID', 'HQ provider returned invalid JSON', true);
    }
    return validateHqPayload(payload, parsed);
  }
}

function executeHqJob(input: {
  repository: PlannerRepository;
  adapter: HqPlannerAdapter;
  job: PlannerHqJobRecord;
  quickVersion: PlannerVersionRecord;
  traceId: string;
}) {
  queueMicrotask(() => {
    void (async () => {
      const leaseMs = Math.max(10_000, Number(process.env.PLANNER_JOB_LEASE_MS || 60_000));
      const heartbeat = setInterval(
        () =>
          void input.repository
            .heartbeatHqJob(input.job.id, input.job.userId, input.job.attempt)
            .catch(() => undefined),
        Math.max(1_000, Math.floor(leaseMs / 3)),
      );
      heartbeat.unref();
      try {
        const payload = await input.adapter.improve(input.quickVersion.payload, {
          planId: input.job.planId,
          userId: input.job.userId,
          traceId: input.traceId,
        });
        await input.repository.saveHqVersionAndComplete(
          input.job.id,
          input.job.userId,
          input.job.attempt,
          payload,
        );
      } catch (error) {
        if (error instanceof PlannerExecutionLeaseLost) return;
        const typed = error instanceof HqPlanningError;
        try {
          await input.repository.failHqJob(
            input.job.id,
            input.job.userId,
            input.job.attempt,
            typed ? error.code : 'HQ_PLANNING_FAILED',
            typed ? error.retriable : true,
          );
        } catch (failureError) {
          if (!(failureError instanceof PlannerExecutionLeaseLost)) throw failureError;
        }
      } finally {
        clearInterval(heartbeat);
      }
    })();
  });
}

export function resumeHqPlanning(input: {
  repository: PlannerRepository;
  adapter: HqPlannerAdapter;
  job: PlannerHqJobRecord;
  quickVersion: PlannerVersionRecord;
}) {
  executeHqJob({
    ...input,
    traceId: input.job.traceId,
  });
}

export async function startHqPlanning(input: {
  repository: PlannerRepository;
  adapter: HqPlannerAdapter;
  planId: string;
  userId: string;
  quickVersion: PlannerVersionRecord;
  traceId: string;
}): Promise<PlannerHqJobRecord> {
  const requestHash = createHash('sha256')
    .update(`${input.planId}:${input.quickVersion.id}`)
    .digest('hex');
  const result = await input.repository.createOrGetHqJob({
    planId: input.planId,
    userId: input.userId,
    requestHash,
    baseVersionId: input.quickVersion.id,
    traceId: input.traceId,
  });
  if (result.created) {
    executeHqJob({
      repository: input.repository,
      adapter: input.adapter,
      job: result.job,
      quickVersion: input.quickVersion,
      traceId: input.traceId,
    });
  }
  return result.job;
}
