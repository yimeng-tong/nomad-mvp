import type { PlanGenerateRequest } from './repository.js';
import type {
  QuickPlannerInput,
  ResolvedEvidenceConstraint,
  ResolvedPlannerItem,
  ResolvedPoi,
} from './types.js';

export type PlannerSourceInspiration = {
  itemId: string;
  inspirationId: string;
  title: string | null;
  poi: ResolvedPoi | null;
};

export interface PlannerSourceRepository {
  getInspirations(userId: string, itemIds: string[]): Promise<PlannerSourceInspiration[]>;
  getPoiByReference(city: string, reference: string): Promise<ResolvedPoi | null>;
  searchPoi(city: string, query: string): Promise<ResolvedPoi[]>;
  getEvidenceConstraints(userId: string, itemIds: string[]): Promise<ResolvedEvidenceConstraint[]>;
  getAnchorPool(city: string): Promise<ResolvedPlannerItem[]>;
  getBuiltInFallback(city: string): Promise<ResolvedPlannerItem[]>;
}

export class PlannerInputError extends Error {
  constructor(
    readonly code: 'PLANNER_ITEM_NOT_OWNED' | 'PLANNER_POI_MISMATCH',
    message: string,
  ) {
    super(message);
    this.name = 'PlannerInputError';
  }
}

type PlanHardTimeHint = NonNullable<PlanGenerateRequest['hard_time_hints']>[number];

function boundedQuota(value: string | undefined) {
  const parsed = Number(value ?? 0.6);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : 0.6;
}

async function resolveItems(
  requestItems: NonNullable<PlanGenerateRequest['selected_items' | 'candidate_items']>,
  inspirations: Map<string, PlannerSourceInspiration>,
  city: string,
  source: PlannerSourceRepository,
  required: boolean,
  hardTimeHints: ReadonlyMap<string, PlanHardTimeHint>,
) {
  const resolved: ResolvedPlannerItem[] = [];
  for (const requestItem of requestItems) {
    const inspiration = inspirations.get(requestItem.item_id);
    if (!inspiration) {
      throw new PlannerInputError(
        'PLANNER_ITEM_NOT_OWNED',
        `Planner item ${requestItem.item_id} is missing or is not owned by the current user`,
      );
    }
    if (requestItem.poi_id && requestItem.poi_id !== inspiration.poi?.poiId) {
      throw new PlannerInputError(
        'PLANNER_POI_MISMATCH',
        `Planner item ${requestItem.item_id} does not match its server-side POI`,
      );
    }
    const hardTimeHint = hardTimeHints.get(requestItem.item_id);
    if (hardTimeHint?.poi_id && hardTimeHint.poi_id !== inspiration.poi?.poiId) {
      throw new PlannerInputError(
        'PLANNER_POI_MISMATCH',
        `Hard-time hint ${requestItem.item_id} does not match its server-side POI`,
      );
    }

    resolved.push({
      itemId: requestItem.item_id,
      inspirationId: inspiration.inspirationId,
      poi: inspiration.poi,
      source: 'user_candidate',
      timeHint: hardTimeHint?.time_hint ?? requestItem.time_hint ?? null,
      stayMinutesHint: requestItem.stay_minutes_hint ?? null,
      required,
    });
  }
  return resolved;
}

export async function resolvePlannerInput(
  userId: string,
  planId: string,
  request: PlanGenerateRequest,
  source: PlannerSourceRepository,
): Promise<QuickPlannerInput> {
  const selectedRequest = request.selected_items ?? [];
  const candidateRequest = request.candidate_items ?? [];
  const itemIds = [...new Set([...selectedRequest, ...candidateRequest].map((item) => item.item_id))];
  const inspirations = new Map(
    (await source.getInspirations(userId, itemIds)).map((inspiration) => [inspiration.itemId, inspiration]),
  );
  const hardTimeHints = new Map(
    (request.hard_time_hints ?? []).map((hint) => [hint.item_id, hint]),
  );
  const selectedItems = await resolveItems(
    selectedRequest,
    inspirations,
    request.city,
    source,
    true,
    hardTimeHints,
  );
  const candidateItems = await resolveItems(
    candidateRequest,
    inspirations,
    request.city,
    source,
    false,
    hardTimeHints,
  );

  const hotels = [];
  for (const hotel of request.hotels ?? []) {
    if (hotel.leave_blank || (!hotel.poi_id && !hotel.hotel_name)) {
      hotels.push({
        date: hotel.date,
        leaveBlank: true,
        breakfastIncluded: hotel.breakfast_included ?? false,
        poi: null,
      });
      continue;
    }
    let poi = hotel.poi_id ? await source.getPoiByReference(request.city, hotel.poi_id) : null;
    if (!poi && hotel.hotel_name) {
      const normalizedName = hotel.hotel_name.replace(/\s+/g, '').toLocaleLowerCase();
      const exactMatches = (await source.searchPoi(request.city, hotel.hotel_name)).filter(
        (candidate) =>
          candidate.verified &&
          candidate.name.replace(/\s+/g, '').toLocaleLowerCase() === normalizedName,
      );
      if (exactMatches.length === 1) poi = exactMatches[0]!;
    }
    hotels.push({
      date: hotel.date,
      leaveBlank: !poi,
      breakfastIncluded: hotel.breakfast_included ?? false,
      poi,
      unresolvedName: poi ? null : hotel.hotel_name ?? null,
    });
  }

  const evidenceConstraints = await source.getEvidenceConstraints(userId, itemIds);
  let anchorPool: ResolvedPlannerItem[] = [];
  try {
    anchorPool = await source.getAnchorPool(request.city);
  } catch {
    anchorPool = [];
  }
  let builtInFallback: ResolvedPlannerItem[] = [];
  if (anchorPool.length === 0) {
    try {
      builtInFallback = await source.getBuiltInFallback(request.city);
    } catch {
      builtInFallback = [];
    }
  }
  return {
    planId,
    city: request.city,
    startDate: request.start_date,
    days: request.days,
    pace: request.pace,
    smartPlanning: request.smart_planning ?? true,
    morningStartTime: request.morning_start_time ?? request.wake_preference,
    firstDayArrivalTime: request.first_day_arrival_time,
    lastDayDepartureTime: request.last_day_departure_time,
    selectedItems,
    candidateItems,
    hotels,
    luggagePlan: request.luggage_plan
      ? {
          mode: request.luggage_plan.mode ?? 'undecided',
          notes: request.luggage_plan.notes ?? null,
          hotelChangeHelpNeeded: request.luggage_plan.hotel_change_help_needed ?? false,
        }
      : undefined,
    evidenceConstraints,
    anchorPool,
    builtInFallback,
    quotaRatio: boundedQuota(process.env.PLANNER_AUTOPLACE_RATIO),
  };
}
