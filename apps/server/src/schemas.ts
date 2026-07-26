import { z } from 'zod';

export const IngestStartBody = z.object({
  source: z.literal('xhs'),
  url: z.string().url().optional(),
  share_text: z.string().optional(),
  force: z.boolean().optional()
});

export const IngestXhsBody = z.object({
  url: z.string().url().optional(),
  share_text: z.string().optional()
});

export const HomeInputParseBody = z.object({
  text: z.string().trim().min(1).max(2000)
});

export const SearchPoiQuery = z.object({
  city: z.string().trim().min(1).max(80),
  q: z.string().trim().min(1).max(120),
  topk: z.coerce.number().int().min(1).max(10).optional()
}).strict();

export const MAX_PLAN_DAYS = 14;

function isRealIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function addIsoDays(value: string, offset: number) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offset));
  return date.toISOString().slice(0, 10);
}

const IsoDate = z.string().refine(isRealIsoDate, 'invalid calendar date');
const TimeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const PlannerTimeHint = z.enum(['dawn', 'morning', 'afternoon', 'sunset', 'evening', 'night', 'night_market']);
const PlannerAnchorSource = z.enum(['library', 'home_card', 'home_input', 'uploaded_inspiration']);

const NullableString = z.string().min(1).nullable().optional();

const PlannerSelectedItem = z.object({
  item_id: z.string().min(1),
  poi_id: NullableString,
  source: PlannerAnchorSource,
  anchor_intent: z.literal('selected_required').optional(),
  time_hint: PlannerTimeHint.nullable().optional(),
  stay_minutes_hint: z.number().int().nonnegative().nullable().optional()
}).strict();

const PlannerCandidateItem = z.object({
  item_id: z.string().min(1),
  poi_id: NullableString,
  source: PlannerAnchorSource,
  time_hint: PlannerTimeHint.nullable().optional(),
  stay_minutes_hint: z.number().int().nonnegative().nullable().optional()
}).strict();

const PlanHotelConstraint = z.object({
  date: IsoDate,
  hotel_name: NullableString,
  poi_id: NullableString,
  address: NullableString,
  breakfast_included: z.boolean().optional(),
  leave_blank: z.boolean().optional()
}).strict();

const PlanLuggagePlan = z.object({
  mode: z.enum(['carry_with_me', 'hotel_storage', 'station_storage', 'courier', 'undecided']).optional(),
  notes: z.string().max(500).nullable().optional(),
  hotel_change_help_needed: z.boolean().optional()
}).strict();

const PlanHardTimeHint = z.object({
  item_id: z.string().min(1),
  poi_id: NullableString,
  time_hint: PlannerTimeHint,
  source: z.enum(['uploaded_inspiration', 'user_selected'])
}).strict();

export const PlanGenerateBody = z.object({
  city: z.string().trim().min(1),
  start_date: IsoDate,
  days: z.number().int().min(1).max(MAX_PLAN_DAYS),
  pace: z.enum(['tight', 'comfortable']),
  source: z.enum(['home_input', 'home_card']).nullable().optional(),
  rec_id: NullableString,
  selected_items: z.array(PlannerSelectedItem).optional(),
  candidate_items: z.array(PlannerCandidateItem).optional(),
  hotels: z.array(PlanHotelConstraint).optional(),
  luggage_plan: PlanLuggagePlan.optional(),
  wake_preference: TimeOfDay.nullable().optional(),
  morning_start_time: TimeOfDay.nullable().optional(),
  first_day_arrival_time: TimeOfDay.nullable().optional(),
  last_day_departure_time: TimeOfDay.nullable().optional(),
  smart_planning: z.boolean().optional(),
  hard_time_hints: z.array(PlanHardTimeHint).optional()
}).strict().superRefine((value, ctx) => {
  const selectedIds = value.selected_items?.map((item) => item.item_id) ?? [];
  const candidateIds = value.candidate_items?.map((item) => item.item_id) ?? [];
  const duplicateSelected = selectedIds.find((id, index) => selectedIds.indexOf(id) !== index);
  const duplicateCandidate = candidateIds.find((id, index) => candidateIds.indexOf(id) !== index);
  const overlap = selectedIds.find((id) => candidateIds.includes(id));
  const plannerItems = new Map(
    [...(value.selected_items ?? []), ...(value.candidate_items ?? [])]
      .map((item) => [item.item_id, item] as const),
  );
  const hardHintIds = value.hard_time_hints?.map((hint) => hint.item_id) ?? [];
  const duplicateHardHint = hardHintIds.find((id, index) => hardHintIds.indexOf(id) !== index);

  if (duplicateSelected) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['selected_items'], message: `duplicate selected item: ${duplicateSelected}` });
  }
  if (duplicateCandidate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['candidate_items'], message: `duplicate candidate item: ${duplicateCandidate}` });
  }
  if (overlap) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['candidate_items'], message: `item cannot be selected and candidate: ${overlap}` });
  }
  if (duplicateHardHint) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['hard_time_hints'], message: `duplicate hard-time hint: ${duplicateHardHint}` });
  }
  value.hard_time_hints?.forEach((hint, index) => {
    const item = plannerItems.get(hint.item_id);
    if (!item) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['hard_time_hints', index, 'item_id'],
        message: 'hard-time hint must reference a selected or candidate item',
      });
    } else if (hint.poi_id && item.poi_id && hint.poi_id !== item.poi_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['hard_time_hints', index, 'poi_id'],
        message: 'hard-time hint POI must match its planner item',
      });
    }
  });

  const tripDates = isRealIsoDate(value.start_date)
    ? new Set(Array.from({ length: value.days }, (_, index) => addIsoDays(value.start_date, index)))
    : new Set<string>();
  const hotelDates = new Set<string>();
  value.hotels?.forEach((hotel, index) => {
    if (hotelDates.has(hotel.date)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['hotels', index, 'date'], message: 'duplicate hotel date' });
    }
    hotelDates.add(hotel.date);
    if (tripDates.size > 0 && !tripDates.has(hotel.date)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['hotels', index, 'date'], message: 'hotel date is outside trip range' });
    }
    if (hotel.leave_blank && (hotel.hotel_name || hotel.poi_id || hotel.address || hotel.breakfast_included)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['hotels', index], message: 'blank hotel cannot include hotel details or breakfast' });
    }
  });

  if (
    value.days === 1
    && value.first_day_arrival_time
    && value.last_day_departure_time
    && value.first_day_arrival_time > value.last_day_departure_time
  ) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['last_day_departure_time'], message: 'departure must not be earlier than arrival for a one-day trip' });
  }

  const distinctHotels = new Set(
    (value.hotels ?? [])
      .filter((hotel) => !hotel.leave_blank && (hotel.poi_id || hotel.hotel_name))
      .map((hotel) => hotel.poi_id || hotel.hotel_name)
  );
  if (distinctHotels.size > 1 && (!value.luggage_plan?.mode || value.luggage_plan.mode === 'undecided')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['luggage_plan', 'mode'], message: 'luggage handling must be resolved for hotel changes' });
  }
});

export const EmptySlotResolveBody = z.discriminatedUnion('op', [
  z.object({
    op: z.literal('fill_empty_slot_with_candidate'),
    expected_plan_rev: z.number().int().positive(),
    candidate_id: z.string().min(1),
  }).strict(),
  z.object({
    op: z.literal('set_free_activity'),
    expected_plan_rev: z.number().int().positive(),
  }).strict(),
]);

export const PlanRevisionBody = z.object({
  expected_plan_rev: z.number().int().positive()
}).strict();

export const SeedUndoBody = z.object({
  expected_plan_rev: z.number().int().positive(),
  undo_token: z.string().min(1)
}).strict();

export const HqStartBody = z.object({
  plan_id: z.string().min(1)
}).strict();

export const HqStatusQuery = z.object({
  hq_job_id: z.string().min(1)
}).strict();

export const HqAdoptBody = z.object({
  plan_id: z.string().min(1),
  hq_job_id: z.string().min(1),
  expected_plan_rev: z.number().int().positive()
}).strict();

export const AiFillBody = z.object({
  plan_id: z.string(),
  dry_run: z.boolean().optional()
});

const ExportWidth = z.union([
  z.literal(1080),
  z.literal(1242),
  z.literal('1080'),
  z.literal('1242')
]).transform((v) => Number(v));

export const ExportBody = z.object({
  plan_id: z.string(),
  width_px: ExportWidth.optional(),
  slice_by_day: z.boolean().optional(),
  theme: z.enum(['light','dark']).optional()
});


