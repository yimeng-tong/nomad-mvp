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

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
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
  days: z.number().int().min(1),
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


