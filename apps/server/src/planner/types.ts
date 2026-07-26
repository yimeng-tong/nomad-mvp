import type { components } from '../../../../packages/types/src/api-types.js';

export type PlannerPace = components['schemas']['PlanGenerateRequest']['pace'];
export type PlannerTimeHint = components['schemas']['PlannerTimeHint'];
export type DayPlanPoi = components['schemas']['DayPlanPoi'];
export type PlanEvidenceConstraint = components['schemas']['PlanEvidenceConstraint'];

export type ResolvedPoi = {
  poiId: string;
  amapId: string | null;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  verified: boolean;
  quality: 'verified' | 'high' | 'medium' | 'low' | null;
  sourceAttribution: string | null;
  l1AreaId: string | null;
  l2GroupId: string | null;
  openHours: {
    closed_dates?: string[];
    by_date?: Record<string, Array<{ start: string; end: string }>>;
    weekly?: Record<string, Array<{ start: string; end: string }>>;
  } | null;
};

export type ResolvedPlannerItem = {
  itemId: string;
  inspirationId: string | null;
  poi: ResolvedPoi | null;
  source: 'user_candidate' | 'anchor_pool' | 'built_in' | 'amap' | 'ai';
  timeHint: PlannerTimeHint | null;
  stayMinutesHint: number | null;
  required: boolean;
};

export type ResolvedHotel = {
  date: string;
  leaveBlank: boolean;
  breakfastIncluded: boolean;
  poi: ResolvedPoi | null;
  unresolvedName?: string | null;
};

export type ResolvedEvidenceConstraint = {
  itemId: string;
  poiId?: string | null;
  date?: string | null;
  startLocal?: string | null;
  endLocal?: string | null;
  timezone: string;
  timeHint: PlannerTimeHint;
  source: 'uploaded_inspiration' | 'reservation' | 'ticket';
  evidenceRef: string;
  sourceAttribution?: string | null;
  quality: 'verified' | 'high' | 'medium' | 'low';
};

export type ResolvedLuggagePlan = {
  mode: 'carry_with_me' | 'hotel_storage' | 'station_storage' | 'courier' | 'undecided';
  notes: string | null;
  hotelChangeHelpNeeded: boolean;
};

export type QuickPlannerInput = {
  planId: string;
  city: string;
  startDate: string;
  days: number;
  pace: PlannerPace;
  smartPlanning: boolean;
  morningStartTime?: string | null;
  firstDayArrivalTime?: string | null;
  lastDayDepartureTime?: string | null;
  selectedItems: ResolvedPlannerItem[];
  candidateItems: ResolvedPlannerItem[];
  hotels: ResolvedHotel[];
  luggagePlan?: ResolvedLuggagePlan;
  evidenceConstraints: ResolvedEvidenceConstraint[];
  anchorPool: ResolvedPlannerItem[];
  builtInFallback: ResolvedPlannerItem[];
  quotaRatio: number;
};

export function serializePoi(poi: ResolvedPoi): DayPlanPoi {
  return {
    poi_id: poi.poiId,
    amap_id: poi.amapId,
    name: poi.name,
    address: poi.address,
    latitude: poi.latitude,
    longitude: poi.longitude,
    verified: poi.verified,
    quality: poi.quality,
    source_attribution: poi.sourceAttribution,
  };
}

export function serializeConstraint(constraint: ResolvedEvidenceConstraint): PlanEvidenceConstraint {
  return {
    item_id: constraint.itemId,
    poi_id: constraint.poiId,
    date: constraint.date,
    start_local: constraint.startLocal,
    end_local: constraint.endLocal,
    timezone: constraint.timezone,
    time_hint: constraint.timeHint,
    source: constraint.source,
    evidence_ref: constraint.evidenceRef,
    source_attribution: constraint.sourceAttribution,
    quality: constraint.quality,
  };
}
