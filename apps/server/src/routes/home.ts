import fp from 'fastify-plugin';
import { authGuard } from '../plugins/auth.js';
import { parseXhsInput } from '../ingest/link-parser.js';
import { HomeInputParseBody } from '../schemas.js';
import type { IngestWarning } from '../ingest/types.js';

type TripParams = {
  city: string;
  start_date?: string;
  days?: number;
  pace?: 'tight' | 'comfortable';
};

const knownCities = ['杭州', '上海', '北京', '成都', '广州', '深圳', '苏州', '南京', '厦门', '重庆', '西安'];

function isValidCalendarDate(year: string, month: string, day: string) {
  const yearNumber = Number(year);
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  if (!Number.isInteger(yearNumber) || !Number.isInteger(monthNumber) || !Number.isInteger(dayNumber)) return false;
  if (monthNumber < 1 || monthNumber > 12 || dayNumber < 1 || dayNumber > 31) return false;
  const date = new Date(Date.UTC(yearNumber, monthNumber - 1, dayNumber));
  return date.getUTCFullYear() === yearNumber && date.getUTCMonth() === monthNumber - 1 && date.getUTCDate() === dayNumber;
}

function extractTripParams(text: string): TripParams | null {
  const cityMatches = knownCities.filter((candidate) => text.includes(candidate));
  if (cityMatches.length !== 1) return null;
  const [city] = cityMatches;
  const daysMatch = text.match(/(\d{1,2})\s*天/u);
  if (!city || !daysMatch) return null;

  const dateMatch = text.match(/(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})/u);
  const days = Number(daysMatch[1]);
  if (!Number.isInteger(days) || days < 1) return null;
  const pace = /舒适|comfortable|normal/u.test(text) ? 'comfortable' : /紧凑|tight|特种兵|赶/u.test(text) ? 'tight' : undefined;
  const params: TripParams = { city, days };
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    if (!isValidCalendarDate(year, month, day)) return null;
    params.start_date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  if (pace) params.pace = pace;
  return params;
}

function createPlannerRoute(params: TripParams, source: 'home_input' | 'home_card') {
  const search = new URLSearchParams({ city: params.city, source });
  if (params.start_date) search.set('start', params.start_date);
  if (params.days) search.set('days', String(params.days));
  if (params.pace) search.set('pace', params.pace);
  return `/planner/pick?${search.toString()}`;
}

function xhsResponse(text: string, url: string, warning?: IngestWarning) {
  return {
    type: 'xhs_link' as const,
    original_text: text,
    url,
    warning,
  };
}

export default fp(async (app) => {
  app.post('/home/input/parse', { preHandler: authGuard }, async (req: any, reply: any) => {
    const parsed = HomeInputParseBody.safeParse(req.body ?? {});
    if (!parsed.success) {
      return reply.sendError('HOME_INPUT_INVALID', 'invalid home input', 400, false, { issues: parsed.error.issues });
    }

    const text = parsed.data.text;
    const xhs = parseXhsInput({ share_text: text });
    if (xhs.url) return reply.send(xhsResponse(text, xhs.url, xhs.warning));

    const tripParams = extractTripParams(text);
    if (tripParams) {
      return reply.send({
        type: 'trip_params',
        original_text: text,
        trip_params: tripParams,
        planner_handoff: {
          route: createPlannerRoute(tripParams, 'home_input'),
          source: 'home_input',
          selected_items: [],
        },
      });
    }

    return reply.send({
      type: 'unknown',
      original_text: text,
    });
  });
});
