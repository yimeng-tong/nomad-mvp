import { z } from 'zod';

export const IngestStartBody = z.object({
  source: z.literal('xhs'),
  url: z.string().url().optional(),
  share_text: z.string().optional()
});

const Item = z.object({
  item_id: z.string(),
  poi_id: z.string().optional(),
  must_go: z.boolean().optional(),
  time_hint: z.enum(['morning','afternoon','evening']).optional(),
  stay_minutes_hint: z.number().int().nonnegative().optional()
});

export const PlanGenerateBody = z.object({
  city: z.string(),
  start_date: z.string(),
  days: z.number().int().min(1),
  pace: z.enum(['slow','normal','fast']).optional(),
  selected_items: z.array(Item).optional()
});

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


