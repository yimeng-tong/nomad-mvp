import cookie from '@fastify/cookie';
import Fastify from 'fastify';
import authPlugin from '../src/plugins/auth.js';
import errorEnvelope from '../src/plugins/error-envelope.js';
import idempotency from '../src/plugins/idempotency.js';
import planRoutes from '../src/routes/plan.js';
import searchRoutes from '../src/routes/search.js';
import traceIdPlugin from '../src/plugins/trace-id.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function parseJson(response: { body: string }) {
  return response.body ? (JSON.parse(response.body) as Record<string, any>) : {};
}

const USER_A = '00000000-0000-4000-8000-000000000201';
const USER_B = '00000000-0000-4000-8000-000000000202';
const originalFetch = globalThis.fetch;
const previousAmapKey = process.env.AMAP_WEB_SERVICE_KEY;

process.env.AMAP_WEB_SERVICE_KEY = 'planner-probe-key';
globalThis.fetch = async (input) => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input : input.url);
  assert(url.hostname === 'restapi.amap.com', 'POI search should call the AMap Web API');
  assert(url.searchParams.get('key') === 'planner-probe-key', 'POI search should use the configured AMap key');
  assert(url.searchParams.get('city') === '厦门', 'POI search should pass the requested city');
  assert(url.searchParams.get('keywords') === '中山路酒店', 'POI search should pass the requested keywords');
  return new Response(JSON.stringify({
    status: '1',
    pois: [
      { id: 'B02500A001', name: '厦门中山路酒店', address: '思明区中山路 1 号', distance: '120' },
      { id: 'B02500A002', name: '厦门中山路酒店二店', address: '思明区中山路 2 号', distance: '260' },
      { id: 'B02500A003', name: '厦门中山路酒店三店', address: '思明区中山路 3 号', distance: [] },
    ],
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

function authHeaders(userId = USER_A) {
  return {
    'x-user-id': userId,
    'x-device-id': 'planner-probe',
    'x-trace-id': 'trace-planner-probe',
  };
}

async function buildPlannerApp() {
  const app = Fastify({ logger: false });
  await app.register(cookie);
  await app.register(traceIdPlugin);
  await app.register(errorEnvelope);
  await app.register(idempotency);
  await app.register(authPlugin);
  await app.register(searchRoutes);
  await app.register(planRoutes);
  await app.ready();
  return app;
}

const validStory20Payload = {
  city: '厦门',
  start_date: '2026-07-02',
  days: 3,
  pace: 'comfortable',
  source: 'home_input',
  rec_id: 'city-xm',
  selected_items: [
    {
      item_id: 'ins-sunlight-rock',
      poi_id: 'poi-sunlight-rock',
      source: 'library',
      anchor_intent: 'selected_required',
      time_hint: 'morning',
      stay_minutes_hint: 90,
    },
  ],
  candidate_items: [
    {
      item_id: 'ins-shapowei',
      poi_id: 'poi-shapowei',
      source: 'library',
      time_hint: 'night',
      stay_minutes_hint: 75,
    },
  ],
  hotels: [
    {
      date: '2026-07-02',
      hotel_name: '厦门中山路酒店',
      poi_id: 'amap-hotel-1',
      address: '厦门市思明区中山路',
      breakfast_included: true,
    },
    {
      date: '2026-07-03',
      leave_blank: true,
      breakfast_included: false,
    },
  ],
  luggage_plan: {
    mode: 'hotel_storage',
    notes: '换酒店当天先寄存',
    hotel_change_help_needed: true,
  },
  wake_preference: '08:30',
  morning_start_time: '09:30',
  first_day_arrival_time: '11:20',
  last_day_departure_time: '18:45',
  smart_planning: true,
  hard_time_hints: [
    {
      item_id: 'ins-night-market',
      poi_id: 'poi-zhongshan-road',
      time_hint: 'night_market',
      source: 'uploaded_inspiration',
    },
  ],
};

async function main() {
  const app = await buildPlannerApp();
  try {
    const unauth = await app.inject({ method: 'POST', url: '/plan/generate', payload: validStory20Payload });
    assert(unauth.statusCode === 401, 'plan generation should require auth');
    assert(parseJson(unauth).error_code === 'AUTH_SESSION_EXPIRED', 'unauth plan generation should use auth envelope');

    const unauthPoi = await app.inject({ method: 'GET', url: '/search/poi?city=厦门&q=中山路酒店' });
    assert(unauthPoi.statusCode === 401, 'POI search should require auth');

    const hotelPoi = await app.inject({ method: 'GET', url: '/search/poi?city=厦门&q=中山路酒店&topk=3', headers: authHeaders() });
    assert(hotelPoi.statusCode === 200, 'hotel POI search should succeed');
    const hotelItems = parseJson(hotelPoi).items as any[];
    assert(hotelItems.length === 3, 'hotel POI search should respect topk');
    assert(hotelItems[0].poi_id === 'B02500A001', 'hotel POI search should return provider POI ids');
    assert(hotelItems[0].distance_m === 120, 'hotel POI search should normalize provider distance');
    assert(hotelItems.every((item) => item.name && item.address), 'hotel POI search should return name and address');

    const invalidPoi = await app.inject({ method: 'GET', url: '/search/poi?city=厦门&q=中山路酒店&topk=99', headers: authHeaders() });
    assert(invalidPoi.statusCode === 400, 'invalid POI topk should be rejected');

    delete process.env.AMAP_WEB_SERVICE_KEY;
    const unavailablePoi = await app.inject({ method: 'GET', url: '/search/poi?city=厦门&q=中山路酒店', headers: authHeaders() });
    assert(unavailablePoi.statusCode === 503, 'POI search should degrade honestly when AMap is not configured');
    assert(parseJson(unavailablePoi).error_code === 'SEARCH_POI_UNAVAILABLE', 'unavailable POI search should use a stable error code');
    process.env.AMAP_WEB_SERVICE_KEY = 'planner-probe-key';

    const valid = await app.inject({ method: 'POST', url: '/plan/generate', headers: authHeaders(), payload: validStory20Payload });
    assert(valid.statusCode === 202, `Story 2.0 planner payload should be accepted, got ${valid.statusCode}: ${valid.body}`);
    assert(parseJson(valid).sse_url?.startsWith('/sse/plan/'), 'valid planner payload should return an SSE URL');

    const sameUserCached = await app.inject({ method: 'POST', url: '/plan/generate', headers: authHeaders(), payload: validStory20Payload });
    assert(parseJson(sameUserCached).plan_job_id === parseJson(valid).plan_job_id, 'idempotency should cache per user and body');

    const otherUser = await app.inject({ method: 'POST', url: '/plan/generate', headers: authHeaders(USER_B), payload: validStory20Payload });
    assert(parseJson(otherUser).plan_job_id !== parseJson(valid).plan_job_id, 'idempotency cache must be scoped by user');

    const oldPace = await app.inject({
      method: 'POST',
      url: '/plan/generate',
      headers: authHeaders(),
      payload: { ...validStory20Payload, pace: 'normal' },
    });
    assert(oldPace.statusCode === 400, 'legacy pace normal should be rejected');

    const legacyMustGo = await app.inject({
      method: 'POST',
      url: '/plan/generate',
      headers: authHeaders(),
      payload: {
        ...validStory20Payload,
        selected_items: [{ item_id: 'ins-legacy', source: 'library', must_go: true }],
      },
    });
    assert(legacyMustGo.statusCode === 400, 'legacy must_go should be rejected from planner generation payload');

    const badHardTime = await app.inject({
      method: 'POST',
      url: '/plan/generate',
      headers: authHeaders(),
      payload: {
        ...validStory20Payload,
        hard_time_hints: [{ item_id: 'ins-bad', time_hint: 'ticket', source: 'uploaded_inspiration' }],
      },
    });
    assert(badHardTime.statusCode === 400, 'malformed hard time hints should be rejected');

    const badDays = await app.inject({
      method: 'POST',
      url: '/plan/generate',
      headers: authHeaders(),
      payload: { ...validStory20Payload, days: 0 },
    });
    assert(badDays.statusCode === 400, 'invalid day count should be rejected');

    const tooManyDays = await app.inject({
      method: 'POST',
      url: '/plan/generate',
      headers: authHeaders(),
      payload: { ...validStory20Payload, days: 15 },
    });
    assert(tooManyDays.statusCode === 400, 'trips over the 14-day MVP limit should be rejected');

    const invalidDate = await app.inject({
      method: 'POST',
      url: '/plan/generate',
      headers: authHeaders(),
      payload: { ...validStory20Payload, start_date: '2026-02-31', hotels: [] },
    });
    assert(invalidDate.statusCode === 400, 'nonexistent calendar dates should be rejected');

    const invalidTime = await app.inject({
      method: 'POST',
      url: '/plan/generate',
      headers: authHeaders(),
      payload: { ...validStory20Payload, wake_preference: '25:00' },
    });
    assert(invalidTime.statusCode === 400, 'invalid time-of-day values should be rejected');

    const impossibleOneDay = await app.inject({
      method: 'POST',
      url: '/plan/generate',
      headers: authHeaders(),
      payload: {
        ...validStory20Payload,
        days: 1,
        hotels: [{ ...validStory20Payload.hotels[0], date: validStory20Payload.start_date }],
        first_day_arrival_time: '18:00',
        last_day_departure_time: '09:00',
      },
    });
    assert(impossibleOneDay.statusCode === 400, 'one-day departure should not precede arrival');

    const overlappingItems = await app.inject({
      method: 'POST',
      url: '/plan/generate',
      headers: authHeaders(),
      payload: {
        ...validStory20Payload,
        candidate_items: [{ item_id: 'ins-sunlight-rock', source: 'library' }],
      },
    });
    assert(overlappingItems.statusCode === 400, 'selected and candidate item roles should be disjoint');

    const duplicateHotelDates = await app.inject({
      method: 'POST',
      url: '/plan/generate',
      headers: authHeaders(),
      payload: {
        ...validStory20Payload,
        hotels: [
          validStory20Payload.hotels[0],
          { ...validStory20Payload.hotels[0], hotel_name: '另一家酒店', poi_id: 'B02500A099' },
        ],
      },
    });
    assert(duplicateHotelDates.statusCode === 400, 'duplicate hotel dates should be rejected');

    const outOfRangeHotel = await app.inject({
      method: 'POST',
      url: '/plan/generate',
      headers: authHeaders(),
      payload: {
        ...validStory20Payload,
        hotels: [{ ...validStory20Payload.hotels[0], date: '2026-07-20' }],
      },
    });
    assert(outOfRangeHotel.statusCode === 400, 'hotel dates outside the trip should be rejected');

    const contradictoryBlankHotel = await app.inject({
      method: 'POST',
      url: '/plan/generate',
      headers: authHeaders(),
      payload: {
        ...validStory20Payload,
        hotels: [{ date: '2026-07-02', leave_blank: true, breakfast_included: true }],
      },
    });
    assert(contradictoryBlankHotel.statusCode === 400, 'blank hotels should not retain breakfast or matched details');

    const unresolvedHotelChange = await app.inject({
      method: 'POST',
      url: '/plan/generate',
      headers: authHeaders(),
      payload: {
        ...validStory20Payload,
        hotels: [
          { ...validStory20Payload.hotels[0], date: '2026-07-02' },
          { ...validStory20Payload.hotels[0], date: '2026-07-03', hotel_name: '另一家酒店', poi_id: 'B02500A099' },
        ],
        luggage_plan: { mode: 'undecided' },
      },
    });
    assert(unresolvedHotelChange.statusCode === 400, 'hotel changes should require resolved luggage handling');
  } finally {
    await app.close();
    globalThis.fetch = originalFetch;
    if (previousAmapKey === undefined) delete process.env.AMAP_WEB_SERVICE_KEY;
    else process.env.AMAP_WEB_SERVICE_KEY = previousAmapKey;
  }

  console.log('planner contract probe ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
