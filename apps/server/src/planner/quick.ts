import { createHash } from 'node:crypto';
import type { components } from '../../../../packages/types/src/api-types.js';
import { distanceKm, rankCandidates } from './ranking.js';
import {
  buildDayWindows,
  formatLocalMinutes,
  localMinutes,
  normalizeDurationMinutes,
  slotMatchesTimeHint,
  timeHintLocal,
  zonedLocalToUtc,
} from './time-windows.js';
import {
  serializeConstraint,
  serializePoi,
  type QuickPlannerInput,
  type ResolvedEvidenceConstraint,
  type ResolvedPlannerItem,
  type ResolvedPoi,
} from './types.js';

type DayPlanDay = components['schemas']['DayPlanDay'];
type DayPlanSlot = components['schemas']['DayPlanSlot'];
type DayPlanCandidate = components['schemas']['DayPlanCandidate'];
type DayPlanWarning = components['schemas']['DayPlanWarning'];
type UnresolvedRequiredItem = components['schemas']['UnresolvedRequiredItem'];
type PlannerVersionPayload = import('./repository.js').PlannerVersionPayload;

type MutableSlot = {
  dayIndex: number;
  date: string;
  slotIndex: number;
  startLocal: string;
  endLocal: string;
  item: ResolvedPlannerItem | null;
  origin: DayPlanSlot['origin'];
  title: string | null;
  constraint: ResolvedEvidenceConstraint | null;
  consumed: boolean;
};

function dateHotel(input: QuickPlannerInput, date: string) {
  return input.hotels.find((hotel) => hotel.date === date) ?? {
    date,
    leaveBlank: true,
    breakfastIncluded: false,
    poi: null,
  };
}

function hasHotelChange(input: QuickPlannerInput, dayIndex: number, date: string) {
  if (dayIndex === 0 || !input.luggagePlan?.hotelChangeHelpNeeded) return false;
  const current = dateHotel(input, date);
  const previousDate = buildDayWindows({
    startDate: input.startDate,
    days: input.days,
    pace: input.pace,
  })[dayIndex - 1]!.date;
  const previous = dateHotel(input, previousDate);
  return Boolean(current.poi && previous.poi && current.poi.poiId !== previous.poi.poiId);
}

function makeSlots(input: QuickPlannerInput) {
  const windows = buildDayWindows({
    startDate: input.startDate,
    days: input.days,
    pace: input.pace,
    morningStartTime: input.morningStartTime,
    firstDayArrivalTime: input.firstDayArrivalTime,
    lastDayDepartureTime: input.lastDayDepartureTime,
  });
  return windows.map((window) =>
    window.slots.map<MutableSlot>((slot, slotIndex) => ({
      dayIndex: window.dayIndex,
      date: window.date,
      slotIndex,
      startLocal: slot.startLocal,
      endLocal: slot.endLocal,
      item: null,
      origin: 'free',
      title: null,
      constraint: null,
      consumed: false,
    })),
  );
}

function deduplicate(items: ResolvedPlannerItem[], usedPoiIds = new Set<string>()) {
  const seen = new Set(usedPoiIds);
  return items.filter((item) => {
    if (!item.poi) return true;
    if (seen.has(item.poi.poiId)) return false;
    seen.add(item.poi.poiId);
    return true;
  });
}

function poiAvailability(
  item: ResolvedPlannerItem,
  date: string,
  start: number,
  end: number,
): 'open' | 'closed' | 'unknown' {
  const hours = item.poi?.openHours;
  if (!hours) return 'unknown';
  if (hours.closed_dates?.includes(date)) return 'closed';
  const weekday = String(new Date(`${date}T00:00:00.000Z`).getUTCDay());
  const periods = hours.by_date?.[date] ?? hours.weekly?.[weekday];
  if (!periods) return 'unknown';
  return periods.some(
    (period) => start >= localMinutes(period.start) && end <= localMinutes(period.end),
  )
    ? 'open'
    : 'closed';
}

function hasPotentialOpening(
  item: ResolvedPlannerItem,
  slots: MutableSlot[][],
  constraint: ResolvedEvidenceConstraint | null,
) {
  if (!item.poi?.openHours) return true;
  const duration = normalizeDurationMinutes(item.stayMinutesHint);
  for (const day of slots) {
    const date = day[0]?.date;
    if (!date || (constraint?.date && constraint.date !== date)) continue;
    if (constraint) {
      const start = localMinutes(constraint.startLocal ?? timeHintLocal(constraint.timeHint));
      const end = constraint.endLocal ? localMinutes(constraint.endLocal) : start + duration;
      if (poiAvailability(item, date, start, end) !== 'closed') return true;
      continue;
    }
    for (const slot of day) {
      const start = localMinutes(slot.startLocal);
      if (poiAvailability(item, date, start, start + duration) !== 'closed') return true;
    }
  }
  return false;
}

function exceedsDistance(left: ResolvedPoi | null, right: ResolvedPoi | null, maximumKm: number) {
  if (!left || !right) return false;
  const distance = distanceKm(left, right);
  return distance !== null && distance > maximumKm;
}

function positiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isUnambiguousLocalWindow(
  date: string,
  startLocal: string,
  endLocal: string,
  timezone: string,
) {
  try {
    zonedLocalToUtc(date, startLocal, timezone);
    zonedLocalToUtc(date, endLocal, timezone);
    return true;
  } catch {
    return false;
  }
}

function reserveItem(
  day: MutableSlot[],
  item: ResolvedPlannerItem,
  origin: DayPlanSlot['origin'],
  start: number,
  end: number,
  constraint: ResolvedEvidenceConstraint | null,
) {
  const covered = day
    .filter((slot) => localMinutes(slot.startLocal) < end && localMinutes(slot.endLocal) > start)
    .sort((left, right) => localMinutes(left.startLocal) - localMinutes(right.startLocal));
  const coveredStart = covered[0] ? localMinutes(covered[0].startLocal) : -1;
  const coveredEnd = covered.at(-1) ? localMinutes(covered.at(-1)!.endLocal) : -1;
  if (
    covered.length === 0 ||
    covered.some((slot) => slot.item || slot.title || slot.consumed) ||
    covered.some((slot, index) =>
      index > 0 && localMinutes(covered[index - 1]!.endLocal) !== localMinutes(slot.startLocal)
    ) ||
    start < coveredStart ||
    end > coveredEnd
  ) {
    return null;
  }
  const primary = covered[0]!;
  for (const consumed of covered) consumed.consumed = true;
  if (coveredStart < start) {
    day.push({
      ...primary,
      slotIndex: day.length,
      startLocal: formatLocalMinutes(coveredStart),
      endLocal: formatLocalMinutes(start),
      item: null,
      origin: 'free',
      title: null,
      constraint: null,
      consumed: false,
    });
  }
  if (end < coveredEnd) {
    day.push({
      ...primary,
      slotIndex: day.length,
      startLocal: formatLocalMinutes(end),
      endLocal: formatLocalMinutes(coveredEnd),
      item: null,
      origin: 'free',
      title: null,
      constraint: null,
      consumed: false,
    });
  }
  primary.startLocal = formatLocalMinutes(start);
  primary.endLocal = formatLocalMinutes(end);
  primary.item = item;
  primary.origin = origin;
  primary.constraint = constraint;
  primary.consumed = false;
  return primary;
}

function placeInFirstFeasibleSlot(
  slots: MutableSlot[][],
  item: ResolvedPlannerItem,
  origin: DayPlanSlot['origin'],
  constraint: ResolvedEvidenceConstraint | null,
  respectHint = true,
  trip?: Pick<
    QuickPlannerInput,
    'startDate' | 'days' | 'firstDayArrivalTime' | 'lastDayDepartureTime'
  >,
) {
  const targetDate = constraint?.date ?? null;
  const hint = respectHint ? constraint?.timeHint ?? item.timeHint ?? null : null;
  const duration = normalizeDurationMinutes(item.stayMinutesHint);
  for (const day of slots) {
    if (targetDate && day[0]?.date !== targetDate) continue;
    const chronological = [...day].sort(
      (left, right) => localMinutes(left.startLocal) - localMinutes(right.startLocal),
    );
    for (const slot of chronological) {
      if (slot.item || slot.title || slot.consumed) continue;
      if (hint && !constraint?.startLocal && !slotMatchesTimeHint(slot.startLocal, hint)) continue;
      const start = constraint?.startLocal
        ? localMinutes(constraint.startLocal)
        : localMinutes(slot.startLocal);
      if (
        constraint?.startLocal &&
        !(start >= localMinutes(slot.startLocal) && start < localMinutes(slot.endLocal))
      ) {
        continue;
      }
      const end = constraint?.endLocal
        ? localMinutes(constraint.endLocal)
        : start + duration;
      if (
        constraint &&
        !isUnambiguousLocalWindow(
          slot.date,
          formatLocalMinutes(start),
          formatLocalMinutes(end),
          constraint.timezone,
        )
      ) {
        continue;
      }
      if (poiAvailability(item, slot.date, start, end) === 'closed') continue;
      const reserved = reserveItem(day, item, origin, start, end, constraint);
      if (reserved) return reserved;
    }
  }
  if ((constraint || item.timeHint) && trip) {
    const boundaryHint = constraint?.timeHint ?? item.timeHint!;
    const start = localMinutes(constraint?.startLocal ?? timeHintLocal(boundaryHint));
    const end = constraint?.endLocal
      ? localMinutes(constraint.endLocal)
      : start + duration;
    if (start < 0 || end > 24 * 60 || start >= end) return null;
    const explicitDayIndex = constraint?.date
      ? Math.round(
          (Date.parse(`${constraint.date}T00:00:00.000Z`) -
            Date.parse(`${trip.startDate}T00:00:00.000Z`)) /
            86_400_000,
        )
      : null;
    const dayIndexes = explicitDayIndex === null
      ? Array.from({ length: trip.days }, (_, index) => index)
      : [explicitDayIndex];
    for (const targetDayIndex of dayIndexes) {
      if (targetDayIndex < 0 || targetDayIndex >= trip.days) continue;
      if (
        (targetDayIndex === 0 &&
          trip.firstDayArrivalTime &&
          start < localMinutes(trip.firstDayArrivalTime)) ||
        (targetDayIndex === trip.days - 1 &&
          trip.lastDayDepartureTime &&
          end > localMinutes(trip.lastDayDepartureTime))
      ) {
        continue;
      }
      const day = slots[targetDayIndex]!;
      if (
        day.some(
          (slot) =>
            !slot.consumed &&
            localMinutes(slot.startLocal) < end &&
            localMinutes(slot.endLocal) > start,
        )
      ) {
        continue;
      }
      const date = constraint?.date ?? new Date(
        Date.parse(`${trip.startDate}T00:00:00.000Z`) + targetDayIndex * 86_400_000,
      ).toISOString().slice(0, 10);
      if (
        constraint &&
        !isUnambiguousLocalWindow(
          date,
          formatLocalMinutes(start),
          formatLocalMinutes(end),
          constraint.timezone,
        )
      ) {
        continue;
      }
      if (poiAvailability(item, date, start, end) === 'closed') continue;
      const slot: MutableSlot = {
        dayIndex: targetDayIndex,
        date,
        slotIndex: day.length,
        startLocal: formatLocalMinutes(start),
        endLocal: formatLocalMinutes(end),
        item,
        origin,
        title: null,
        constraint,
        consumed: false,
      };
      day.push(slot);
      return slot;
    }
  }
  return null;
}

function candidateEntry(item: ResolvedPlannerItem, status: DayPlanCandidate['status']): DayPlanCandidate {
  return {
    candidate_id: `candidate-${item.itemId}`,
    item_id: item.itemId,
    poi: item.poi ? serializePoi(item.poi) : null,
    status,
    source: item.source,
    reason: status === 'requires_location' ? '需要先完成地点定位' : status === 'used' ? '已加入计划' : '适合当前行程',
    quality: item.poi?.quality ?? null,
    source_attribution: item.poi?.sourceAttribution ?? null,
  };
}

export function buildQuickPlan(input: QuickPlannerInput): PlannerVersionPayload {
  const slots = makeSlots(input);
  const warnings: DayPlanWarning[] = [];
  const unresolved: UnresolvedRequiredItem[] = [];
  const usedPoiIds = new Set<string>();
  const candidateStatus = new Map<string, DayPlanCandidate['status']>();
  for (const hotel of input.hotels) {
    if (!hotel.unresolvedName) continue;
    warnings.push({
      code: 'HOTEL_MATCH_REQUIRED',
      severity: 'soft',
      message: `酒店“${hotel.unresolvedName}”未找到唯一匹配，已保持留空`,
    });
  }

  for (const day of slots) {
    if (day[0] && hasHotelChange(input, day[0].dayIndex, day[0].date)) {
      day[0].title = '行李处理';
      day[0].origin = 'free';
    }
  }

  const selected = deduplicate(input.selectedItems);
  const selectedWithHardTime = selected.filter((item) => {
    return item.timeHint || input.evidenceConstraints.some((constraint) => constraint.itemId === item.itemId);
  });
  const selectedWithoutHardTime = selected.filter((item) => !selectedWithHardTime.includes(item));

  for (const item of [...selectedWithHardTime, ...selectedWithoutHardTime]) {
    if (!item.poi) {
      unresolved.push({
        item_id: item.itemId,
        reason_code: 'requires_location',
        message: '所选地点需要先完成定位',
      });
      continue;
    }
    const constraint = input.evidenceConstraints.find((entry) => entry.itemId === item.itemId) ?? null;
    const slot = placeInFirstFeasibleSlot(
      slots,
      item,
      'selected_required',
      constraint,
      true,
      input,
    );
    if (!slot) {
      const closed = !hasPotentialOpening(item, slots, constraint);
      unresolved.push({
        item_id: item.itemId,
        poi_id: item.poi.poiId,
        reason_code: closed
          ? 'closed'
          : constraint || item.timeHint
            ? 'hard_time_conflict'
            : 'unavailable',
        message: closed
          ? '地点在可用行程时段内未营业'
          : constraint || item.timeHint
            ? '指定时段不在可用行程时间内'
            : '当前日期没有可用时段',
      });
      continue;
    }
    usedPoiIds.add(item.poi.poiId);
  }

  let planningCandidates = [...input.candidateItems];
  if (selected.length === 0 && !planningCandidates.some((item) => item.poi?.verified)) {
    const verifiedAnchorPool = input.anchorPool.filter((item) => item.poi?.verified);
    if (verifiedAnchorPool.length > 0) {
      planningCandidates.push(...verifiedAnchorPool);
    } else {
      const fallback = input.builtInFallback.filter((item) => item.poi?.verified);
      planningCandidates.push(...fallback);
      if (fallback.length > 0) {
        warnings.push({
          code: 'ANCHOR_FALLBACK_BUILT_IN',
          severity: 'soft',
          message: '离线推荐暂不可用，已使用内置城市热门数据',
        });
      }
    }
  }

  const candidates = deduplicate(planningCandidates, usedPoiIds);
  const pendingCandidates = candidates.filter((item) => !item.poi);
  for (const item of pendingCandidates) candidateStatus.set(item.itemId, 'requires_location');
  const availableCandidates = candidates.filter((item) => item.poi);
  const verifiedCandidates = availableCandidates.filter((item) => item.poi?.verified);
  const unknownLocationCandidateIds = new Set(
    verifiedCandidates
      .filter((item) => item.poi?.latitude == null || item.poi.longitude == null)
      .map((item) => item.itemId),
  );
  for (const item of verifiedCandidates.filter(
    (candidate) => unknownLocationCandidateIds.has(candidate.itemId),
  )) {
    warnings.push({
      code: 'CANDIDATE_LOCATION_UNKNOWN',
      severity: 'hard',
      message: `${item.poi!.name} 缺少可验证坐标，未自动加入`,
      item_id: item.itemId,
    });
  }
  const closedCandidateIds = new Set(
    verifiedCandidates
      .filter((item) => {
        const constraint =
          input.evidenceConstraints.find((entry) => entry.itemId === item.itemId) ?? null;
        return !hasPotentialOpening(item, slots, constraint);
      })
      .map((item) => item.itemId),
  );
  for (const item of verifiedCandidates.filter((candidate) => closedCandidateIds.has(candidate.itemId))) {
    warnings.push({
      code: 'CANDIDATE_CLOSED',
      severity: 'hard',
      message: `${item.poi!.name} 在可用行程时段内未营业`,
      item_id: item.itemId,
    });
  }
  const feasibleCandidates = verifiedCandidates.filter(
    (item) =>
      !closedCandidateIds.has(item.itemId) &&
      !unknownLocationCandidateIds.has(item.itemId),
  );
  const emptySlots = slots.flat().filter((slot) => !slot.item && !slot.title && !slot.consumed);
  const quota = input.smartPlanning ? Math.ceil(Math.max(0, Math.min(1, input.quotaRatio)) * emptySlots.length) : 0;
  let placed = 0;
  let preferredL1AreaId =
    slots.flat().find((slot) => slot.item?.poi?.l1AreaId)?.item?.poi?.l1AreaId ?? null;
  let preferredL2GroupId =
    slots.flat().find((slot) => slot.item?.poi?.l2GroupId)?.item?.poi?.l2GroupId ?? null;
  let preferredPoi =
    slots
      .flat()
      .filter((slot) => slot.item?.poi)
      .sort(
        (left, right) =>
          left.dayIndex - right.dayIndex ||
          localMinutes(left.startLocal) - localMinutes(right.startLocal),
      )
      .at(-1)?.item?.poi ?? null;
  const rejectedCandidateIds = new Set<string>();
  const maximumCommuteKm = positiveNumber(process.env.PLANNER_MAX_COMMUTE_KM, 30);
  const lateHotelRadiusKm = positiveNumber(process.env.PLANNER_LATE_HOTEL_RADIUS_KM, 15);

  const hardTimedCandidates = feasibleCandidates.filter(
    (item) =>
      item.timeHint ||
      input.evidenceConstraints.some((constraint) => constraint.itemId === item.itemId),
  );
  for (const item of hardTimedCandidates) {
    if (placed >= quota) break;
    if (exceedsDistance(preferredPoi, item.poi, maximumCommuteKm)) {
      rejectedCandidateIds.add(item.itemId);
      warnings.push({
        code: 'CANDIDATE_TOO_FAR',
        severity: 'hard',
        message: `${item.poi!.name} 与当前路线距离过远，未自动加入`,
        item_id: item.itemId,
      });
      continue;
    }
    const constraint =
      input.evidenceConstraints.find((entry) => entry.itemId === item.itemId) ?? null;
    const slot = placeInFirstFeasibleSlot(
      slots,
      item,
      'ai_seed',
      constraint,
      true,
      input,
    );
    if (!slot) {
      rejectedCandidateIds.add(item.itemId);
      warnings.push({
        code: 'CANDIDATE_HARD_TIME_CONFLICT',
        severity: 'hard',
        message: `${item.poi!.name} 的指定时段无法安排`,
        item_id: item.itemId,
      });
      continue;
    }
    candidateStatus.set(item.itemId, 'used');
    preferredL1AreaId = item.poi?.l1AreaId ?? preferredL1AreaId;
    preferredL2GroupId = item.poi?.l2GroupId ?? preferredL2GroupId;
    preferredPoi = item.poi;
    if (!item.poi?.openHours) {
      warnings.push({
        code: 'OPEN_HOURS_UNKNOWN',
        severity: 'soft',
        message: `${item.poi!.name} 的营业时间待确认`,
        item_id: item.itemId,
      });
    }
    placed += 1;
  }

  while (placed < quota) {
    const slot = slots
      .flat()
      .filter((entry) => !entry.item && !entry.title && !entry.consumed)
      .sort(
        (left, right) =>
          left.dayIndex - right.dayIndex ||
          localMinutes(left.startLocal) - localMinutes(right.startLocal),
      )[0];
    if (!slot) break;
    const remaining = feasibleCandidates.filter(
      (item) => !candidateStatus.has(item.itemId) && !rejectedCandidateIds.has(item.itemId),
    );
    if (remaining.length === 0) break;
    const hotel = dateHotel(input, slot.date);
    const tooFar = remaining.filter(
      (item) =>
        exceedsDistance(preferredPoi, item.poi, maximumCommuteKm) ||
        (Number(slot.startLocal.slice(0, 2)) >= 17 &&
          !hotel.leaveBlank &&
          exceedsDistance(hotel.poi, item.poi, lateHotelRadiusKm)),
    );
    for (const item of tooFar) {
      rejectedCandidateIds.add(item.itemId);
      warnings.push({
        code: 'CANDIDATE_TOO_FAR',
        severity: 'hard',
        message: `${item.poi!.name} 与当前路线距离过远，未自动加入`,
        item_id: item.itemId,
      });
    }
    const ranked = rankCandidates(
      remaining.filter((item) => !rejectedCandidateIds.has(item.itemId)),
      {
      preferredL1AreaId,
      preferredL2GroupId,
      hotelPoi: hotel.leaveBlank ? null : hotel.poi,
      lateSlot: Number(slot.startLocal.slice(0, 2)) >= 17,
      },
    );
    const next = ranked.find((candidate) =>
      placeInFirstFeasibleSlot(slots, candidate, 'ai_seed', null, false),
    );
    if (!next) break;
    candidateStatus.set(next.itemId, 'used');
    preferredL1AreaId = next.poi?.l1AreaId ?? preferredL1AreaId;
    preferredL2GroupId = next.poi?.l2GroupId ?? preferredL2GroupId;
    preferredPoi = next.poi;
    if (!next.poi?.openHours) {
      warnings.push({
        code: 'OPEN_HOURS_UNKNOWN',
        severity: 'soft',
        message: `${next.poi!.name} 的营业时间待确认`,
        item_id: next.itemId,
      });
    }
    placed += 1;
  }
  for (const item of availableCandidates) {
    if (!candidateStatus.has(item.itemId)) candidateStatus.set(item.itemId, 'available');
  }

  const dayPlans: DayPlanDay[] = slots.map((day, dayIndex) => {
    const date = day[0]?.date ?? buildDayWindows({
      startDate: input.startDate,
      days: input.days,
      pace: input.pace,
    })[dayIndex]!.date;
    const hotel = dateHotel(input, date);
    return {
      day_index: dayIndex,
      date,
      slots: day
        .filter((slot) => !slot.consumed)
        .sort((left, right) => localMinutes(left.startLocal) - localMinutes(right.startLocal))
        .map<DayPlanSlot>((slot, outputIndex) => ({
        slot_id: `${input.planId}-d${dayIndex + 1}-s${outputIndex + 1}`,
        day_index: dayIndex,
        slot_index: outputIndex,
        start_local: slot.startLocal,
        end_local: slot.endLocal,
        type: slot.item ? 'place' : slot.title ? 'free' : 'unresolved',
        origin: slot.origin,
        title: slot.item?.poi?.name ?? slot.title,
        poi: slot.item?.poi ? serializePoi(slot.item.poi) : null,
        inspiration_id: slot.item?.inspirationId ?? null,
        constraint: slot.constraint ? serializeConstraint(slot.constraint) : null,
        warning_codes: [],
      })),
      hotel: {
        date,
        leave_blank: hotel.leaveBlank,
        breakfast_included: hotel.breakfastIncluded,
        poi: hotel.leaveBlank || !hotel.poi ? null : serializePoi(hotel.poi),
      },
    };
  });

  const candidateEntries = candidates.map((item) => candidateEntry(item, candidateStatus.get(item.itemId)!));
  const seedUndoToken =
    placed > 0
      ? createHash('sha256')
          .update(`${input.planId}:${candidateEntries.filter((candidate) => candidate.status === 'used').map((entry) => entry.item_id).join(',')}`)
          .digest('hex')
          .slice(0, 24)
      : null;

  return {
    city: input.city,
    start_date: input.startDate,
    days: input.days,
    pace: input.pace,
    day_plans: dayPlans,
    candidates: candidateEntries,
    warnings,
    unresolved_required: unresolved,
    seed_undo_token: seedUndoToken,
    seed_undo_expires_at: null,
  };
}
