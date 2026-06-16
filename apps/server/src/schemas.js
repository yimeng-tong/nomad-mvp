"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportBody = exports.AiFillBody = exports.PlanGenerateBody = exports.IngestStartBody = void 0;
var zod_1 = require("zod");
exports.IngestStartBody = zod_1.z.object({
    source: zod_1.z.literal('xhs'),
    url: zod_1.z.string().url().optional(),
    share_text: zod_1.z.string().optional()
});
var Item = zod_1.z.object({
    item_id: zod_1.z.string(),
    poi_id: zod_1.z.string().optional(),
    must_go: zod_1.z.boolean().optional(),
    time_hint: zod_1.z.enum(['morning', 'afternoon', 'evening']).optional(),
    stay_minutes_hint: zod_1.z.number().int().nonnegative().optional()
});
exports.PlanGenerateBody = zod_1.z.object({
    city: zod_1.z.string(),
    start_date: zod_1.z.string(),
    days: zod_1.z.number().int().min(1),
    pace: zod_1.z.enum(['slow', 'normal', 'fast']).optional(),
    selected_items: zod_1.z.array(Item).optional()
});
exports.AiFillBody = zod_1.z.object({
    plan_id: zod_1.z.string(),
    dry_run: zod_1.z.boolean().optional()
});
exports.ExportBody = zod_1.z.object({
    plan_id: zod_1.z.string(),
    width_px: zod_1.z.enum(['1080', '1242']).transform(function (v) { return Number(v); }).optional(),
    slice_by_day: zod_1.z.boolean().optional(),
    theme: zod_1.z.enum(['light', 'dark']).optional()
});
