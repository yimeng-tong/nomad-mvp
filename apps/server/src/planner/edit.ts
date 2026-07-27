import type { components } from '../../../../packages/types/src/api-types.js';
import type { PlannerVersionPayload } from './repository.js';

export type PlannerSlotEditRequest = components['schemas']['SlotEditRequest'];
type DayPlanSlot = components['schemas']['DayPlanSlot'];

export class PlannerEditError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'PlannerEditError';
  }
}

function timeMinutes(value: string) {
  const match = /^([01]\d|2[0-3]):(00|15|30|45)$/.exec(value);
  if (!match) throw new PlannerEditError('PLAN_EDIT_TIME_INVALID', 'time must use 15-minute steps');
  return Number(match[1]) * 60 + Number(match[2]);
}

function findSlot(payload: PlannerVersionPayload, slotId: string) {
  for (const day of payload.day_plans) {
    const index = day.slots.findIndex((slot) => slot.slot_id === slotId);
    if (index >= 0) return { day, index, slot: day.slots[index]! };
  }
  throw new PlannerEditError('PLAN_SLOT_NOT_FOUND', 'slot not found');
}

function ensureEditable(slot: DayPlanSlot) {
  if (slot.type === 'hotel') {
    throw new PlannerEditError('PLAN_EDIT_HOTEL_UNSUPPORTED', 'hotel slots are edited separately');
  }
  if (slot.type === 'unresolved') {
    throw new PlannerEditError('PLAN_SLOT_EMPTY', 'an empty slot cannot be edited');
  }
}

function exclusionId(slot: DayPlanSlot) {
  return slot.inspiration_id ?? slot.poi?.poi_id ?? null;
}

function excludeRequiredItem(payload: PlannerVersionPayload, slot: DayPlanSlot) {
  if (slot.origin !== 'selected_required') return;
  const itemId = exclusionId(slot);
  if (!itemId) return;
  payload.user_excluded_item_ids = [
    ...new Set([...(payload.user_excluded_item_ids ?? []), itemId]),
  ];
}

function includeCandidate(payload: PlannerVersionPayload, itemId: string) {
  payload.user_excluded_item_ids = (payload.user_excluded_item_ids ?? [])
    .filter((excluded) => excluded !== itemId);
}

function restoreCandidate(payload: PlannerVersionPayload, slot: DayPlanSlot) {
  if (!slot.poi) return;
  const usedElsewhere = payload.day_plans.some((day) =>
    day.slots.some(
      (other) =>
        other.slot_id !== slot.slot_id
        && other.poi?.poi_id === slot.poi?.poi_id,
    ),
  );
  if (usedElsewhere) return;
  const existing = payload.candidates.find((candidate) => candidate.poi?.poi_id === slot.poi?.poi_id);
  if (existing) {
    existing.status = 'available';
    return;
  }
  payload.candidates.push({
    candidate_id: `restored:${slot.slot_id}:${slot.poi.poi_id}`,
    item_id: slot.inspiration_id ?? slot.poi.poi_id,
    poi: structuredClone(slot.poi),
    status: 'available',
    source: 'user_candidate',
    reason: '从计划移回候选',
    quality: slot.poi.quality ?? null,
    source_attribution: slot.poi.source_attribution ?? null,
  });
}

function normalizeDays(payload: PlannerVersionPayload) {
  for (const [dayIndex, day] of payload.day_plans.entries()) {
    day.day_index = dayIndex;
    for (const [slotIndex, slot] of day.slots.entries()) {
      slot.day_index = dayIndex;
      slot.slot_index = slotIndex;
    }
  }
}

function slotContent(slot: DayPlanSlot) {
  return {
    type: slot.type,
    origin: slot.origin,
    title: slot.title ?? null,
    poi: slot.poi ? structuredClone(slot.poi) : null,
    inspiration_id: slot.inspiration_id ?? null,
    constraint: slot.constraint ? structuredClone(slot.constraint) : null,
    warning_codes: [...(slot.warning_codes ?? [])],
  };
}

function placeContent(
  slot: DayPlanSlot,
  content: ReturnType<typeof slotContent>,
  manual: boolean,
) {
  slot.type = content.type;
  slot.origin = manual && content.type === 'place' ? 'hand' : content.origin;
  slot.title = content.title;
  slot.poi = content.poi;
  slot.inspiration_id = content.inspiration_id;
  slot.constraint = content.constraint;
  slot.warning_codes = content.warning_codes;
}

function moveSlot(
  payload: PlannerVersionPayload,
  slotId: string,
  targetDayIndex: number,
) {
  const source = findSlot(payload, slotId);
  const sourceDayIndex = source.day.day_index;
  if (
    targetDayIndex < 0
    || targetDayIndex >= payload.day_plans.length
    || Math.abs(targetDayIndex - sourceDayIndex) > 1
    || targetDayIndex === sourceDayIndex
  ) {
    throw new PlannerEditError('PLAN_EDIT_DAY_OUT_OF_RANGE', 'target day must be D-1 or D+1 inside the trip');
  }
  if (source.slot.constraint) {
    throw new PlannerEditError('PLAN_EDIT_HARD_CONSTRAINT', 'evidence-constrained slots cannot move days');
  }
  const targetDay = payload.day_plans[targetDayIndex]!;
  const targetIndex = source.index;
  const targetSlot = targetDay.slots[targetIndex];
  if (!targetSlot) {
    throw new PlannerEditError('PLAN_EDIT_TARGET_UNAVAILABLE', 'target day has no timeline position');
  }
  if (targetSlot.type === 'hotel') {
    throw new PlannerEditError('PLAN_EDIT_TARGET_UNAVAILABLE', 'hotel slots cannot be moved');
  }
  if (targetSlot.constraint) {
    throw new PlannerEditError(
      'PLAN_EDIT_HARD_CONSTRAINT',
      'evidence-constrained target slots cannot move days',
    );
  }
  const sourceContent = slotContent(source.slot);
  const targetContent = slotContent(targetSlot);
  const sourceOvernight = source.slot.end_local < source.slot.start_local;
  const targetOvernight = targetSlot.end_local < targetSlot.start_local;
  if (
    (sourceOvernight && targetDayIndex === payload.day_plans.length - 1)
    || (targetOvernight && sourceDayIndex === payload.day_plans.length - 1)
  ) {
    throw new PlannerEditError(
      'PLAN_EDIT_DAY_OUT_OF_RANGE',
      'moving this overnight slot would exceed the trip',
    );
  }
  placeContent(source.slot, targetContent, true);
  placeContent(targetSlot, sourceContent, true);
  normalizeDays(payload);
  return targetSlot;
}

export function applySlotEdit(
  input: PlannerVersionPayload,
  slotId: string,
  request: PlannerSlotEditRequest,
): {
  payload: PlannerVersionPayload;
  changedSlot: DayPlanSlot;
  dayIndex: number;
} {
  const payload = structuredClone(input);
  const located = findSlot(payload, slotId);
  ensureEditable(located.slot);

  if (request.op === 'replace') {
    const candidate = payload.candidates.find(
      (entry) => entry.candidate_id === request.candidate_id,
    );
    if (!candidate || candidate.status !== 'available' || !candidate.poi) {
      throw new PlannerEditError('PLAN_CANDIDATE_UNAVAILABLE', 'candidate is not available');
    }
    restoreCandidate(payload, located.slot);
    located.slot.type = 'place';
    located.slot.origin = 'hand';
    located.slot.title = candidate.poi.name;
    located.slot.poi = structuredClone(candidate.poi);
    located.slot.inspiration_id = candidate.item_id;
    located.slot.constraint = null;
    located.slot.warning_codes = [];
    candidate.status = 'used';
    includeCandidate(payload, candidate.item_id);
    return { payload, changedSlot: located.slot, dayIndex: located.day.day_index };
  }

  if (request.op === 'move_day') {
    const changedSlot = moveSlot(payload, slotId, request.target_day_index);
    return { payload, changedSlot, dayIndex: located.day.day_index };
  }

  if (request.op === 'retime') {
    if (located.slot.constraint) {
      throw new PlannerEditError('PLAN_EDIT_HARD_CONSTRAINT', 'evidence-constrained slots cannot be retimed');
    }
    const start = timeMinutes(request.start_local);
    const end = timeMinutes(request.end_local);
    if (start === end) {
      throw new PlannerEditError('PLAN_EDIT_DURATION_INVALID', 'slot duration must be positive');
    }
    const overnight = end < start;
    if (overnight && request.target_day_index >= payload.day_plans.length - 1) {
      throw new PlannerEditError('PLAN_EDIT_DAY_OUT_OF_RANGE', 'overnight slot exceeds the trip');
    }
    let changedSlot = located.slot;
    if (request.target_day_index !== located.day.day_index) {
      changedSlot = moveSlot(payload, slotId, request.target_day_index);
    }
    changedSlot.start_local = request.start_local;
    changedSlot.end_local = request.end_local;
    changedSlot.origin = 'hand';
    return { payload, changedSlot, dayIndex: located.day.day_index };
  }

  excludeRequiredItem(payload, located.slot);
  restoreCandidate(payload, located.slot);
  located.slot.type = 'unresolved';
  located.slot.origin = 'free';
  located.slot.title = null;
  located.slot.poi = null;
  located.slot.inspiration_id = null;
  located.slot.constraint = null;
  located.slot.warning_codes = [];
  return { payload, changedSlot: located.slot, dayIndex: located.day.day_index };
}
