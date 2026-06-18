import cookie from '@fastify/cookie';
import Fastify from 'fastify';
import authPlugin from '../src/plugins/auth.js';
import errorEnvelope from '../src/plugins/error-envelope.js';
import traceIdPlugin from '../src/plugins/trace-id.js';
import { runIngestPipeline } from '../src/ingest/pipeline.js';
import { clearIngestStateForTests, createOrGetIngestJob } from '../src/ingest/store.js';
import homeRoutes from '../src/routes/home.js';
import libraryRoutes from '../src/routes/library.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function parseJson(response: { body: string }) {
  return JSON.parse(response.body) as Record<string, any>;
}

const USER_A = '00000000-0000-4000-8000-000000000101';
const USER_B = '00000000-0000-4000-8000-000000000102';

function authHeaders(userId: string) {
  return {
    'x-user-id': userId,
    'x-device-id': 'home-library-probe',
    'x-trace-id': 'trace-home-library-probe',
  };
}

async function buildHomeLibraryApp() {
  const app = Fastify({ logger: false });
  await app.register(cookie);
  await app.register(traceIdPlugin);
  await app.register(errorEnvelope);
  await app.register(authPlugin);
  await app.register(homeRoutes);
  await app.register(libraryRoutes);
  await app.ready();
  return app;
}

async function seedInspirations() {
  process.env.AMAP_STUB_HIGH_CONFIDENCE = 'true';
  const resolved = await createOrGetIngestJob({
    userId: USER_A,
    sourceUrl: 'https://www.xiaohongshu.com/explore/home-library-resolved',
    traceId: 'trace-home-library-resolved',
  });
  await runIngestPipeline(resolved.id);

  delete process.env.AMAP_STUB_HIGH_CONFIDENCE;
  const pending = await createOrGetIngestJob({
    userId: USER_A,
    sourceUrl: 'https://www.xiaohongshu.com/explore/home-library-pending',
    traceId: 'trace-home-library-pending',
  });
  await runIngestPipeline(pending.id);

  process.env.AMAP_STUB_HIGH_CONFIDENCE = 'true';
  const otherUser = await createOrGetIngestJob({
    userId: USER_B,
    sourceUrl: 'https://www.xiaohongshu.com/explore/home-library-other-user',
    traceId: 'trace-home-library-other-user',
  });
  await runIngestPipeline(otherUser.id);
  delete process.env.AMAP_STUB_HIGH_CONFIDENCE;
}

async function main() {
  delete process.env.DATABASE_URL;
  clearIngestStateForTests();
  await seedInspirations();

  const app = await buildHomeLibraryApp();
  try {
    const unauthCities = await app.inject({ method: 'GET', url: '/library/cities' });
    assert(unauthCities.statusCode === 401, 'library cities should require auth');
    assert(parseJson(unauthCities).error_code === 'AUTH_SESSION_EXPIRED', 'unauth library should use auth envelope');

    const xhsParse = await app.inject({
      method: 'POST',
      url: '/home/input/parse',
      headers: authHeaders(USER_A),
      payload: { text: '第一条 https://www.xiaohongshu.com/explore/a 第二条 https://xhslink.com/b' },
    });
    assert(xhsParse.statusCode === 200, 'XHS input parse should succeed');
    const xhsParseBody = parseJson(xhsParse);
    assert(xhsParseBody.type === 'xhs_link', 'XHS input should classify as xhs_link');
    assert(xhsParseBody.url === 'https://www.xiaohongshu.com/explore/a', 'XHS input should use first link');
    assert(xhsParseBody.warning?.code === 'INGEST_SINGLE_LINK_ONLY', 'XHS multi-link parse should preserve warning');

    const tripParse = await app.inject({
      method: 'POST',
      url: '/home/input/parse',
      headers: authHeaders(USER_A),
      payload: { text: '杭州 2026-07-02 出发 3天 舒适' },
    });
    assert(tripParse.statusCode === 200, 'trip input parse should succeed');
    const tripParseBody = parseJson(tripParse);
    assert(tripParseBody.type === 'trip_params', 'trip input should classify as trip_params');
    assert(tripParseBody.trip_params.city === '杭州', 'trip parser should extract city');
    assert(tripParseBody.trip_params.start_date === '2026-07-02', 'trip parser should extract ISO date');
    assert(tripParseBody.trip_params.days === 3, 'trip parser should extract days');
    assert(tripParseBody.planner_handoff.route.includes('/planner/pick?'), 'trip parser should provide picker route');

    const unknownParse = await app.inject({
      method: 'POST',
      url: '/home/input/parse',
      headers: authHeaders(USER_A),
      payload: { text: '随便看看' },
    });
    assert(unknownParse.statusCode === 200, 'unknown input parse should return a disambiguation result');
    assert(parseJson(unknownParse).type === 'unknown', 'ambiguous input should classify as unknown');

    for (const text of ['杭州 2026-99-99 出发 3天', '杭州 2026-07-02 出发 0天', '杭州 上海 2026-07-02 出发 3天']) {
      const invalidTrip = await app.inject({
        method: 'POST',
        url: '/home/input/parse',
        headers: authHeaders(USER_A),
        payload: { text },
      });
      assert(invalidTrip.statusCode === 200, `invalid trip input should still return parse response for ${text}`);
      assert(parseJson(invalidTrip).type === 'unknown', `invalid trip input should classify as unknown for ${text}`);
    }

    const cities = await app.inject({ method: 'GET', url: '/library/cities', headers: authHeaders(USER_A) });
    assert(cities.statusCode === 200, 'library cities should succeed');
    const citiesBody = parseJson(cities);
    assert(citiesBody.cities.some((city: any) => city.name === '杭州' && city.inspiration_count === 1), 'city cards should aggregate resolved inspirations');
    assert(citiesBody.unlocated_count === 1, 'city summary should count pending inspirations separately');

    const inspirations = await app.inject({ method: 'GET', url: '/library/inspirations', headers: authHeaders(USER_A) });
    assert(inspirations.statusCode === 200, 'library inspirations should succeed');
    const inspirationItems = parseJson(inspirations).items as any[];
    assert(inspirationItems.length === 2, 'library should list only the current user inspirations');
    assert(inspirationItems.every((item) => item.user_id === undefined), 'library DTOs should not expose owner ids');
    const pending = inspirationItems.find((item) => item.locate_status === 'pending');
    assert(pending, 'library should include a pending-location item');
    assert(pending.candidate_count > 0, 'pending item should expose candidate count');
    const resolved = inspirationItems.find((item) => item.locate_status === 'resolved');
    assert(resolved, 'library should include a resolved item');

    const invalidFilter = await app.inject({
      method: 'GET',
      url: '/library/inspirations?locate_status=located',
      headers: authHeaders(USER_A),
    });
    assert(invalidFilter.statusCode === 400, 'invalid locate_status should be rejected');
    assert(parseJson(invalidFilter).error_code === 'LIBRARY_FILTER_INVALID', 'invalid locate_status should use filter error code');

    const otherUserInspirations = await app.inject({ method: 'GET', url: '/library/inspirations', headers: authHeaders(USER_B) });
    assert(parseJson(otherUserInspirations).items.length === 1, 'library should not leak another user inspirations');

    const candidates = await app.inject({
      method: 'GET',
      url: `/library/inspirations/${pending.id}/candidates`,
      headers: authHeaders(USER_A),
    });
    assert(candidates.statusCode === 200, 'pending candidates should be readable by owner');
    const candidate = parseJson(candidates).candidates[0];
    assert(candidate.name && candidate.address, 'candidate should include name and address');
    for (const forbidden of ['confidence', 'score', 'distance', 'duration', 'rating', 'rank']) {
      assert(!(forbidden in candidate), `candidate DTO should not expose ${forbidden}`);
    }

    const resolvedCandidates = await app.inject({
      method: 'GET',
      url: `/library/inspirations/${resolved.id}/candidates`,
      headers: authHeaders(USER_A),
    });
    assert(resolvedCandidates.statusCode === 404, 'resolved inspirations should not expose candidates');
    assert(parseJson(resolvedCandidates).error_code === 'LIBRARY_INSPIRATION_NOT_FOUND', 'resolved candidate lookup should use not-found code');

    const crossUserCandidates = await app.inject({
      method: 'GET',
      url: `/library/inspirations/${pending.id}/candidates`,
      headers: authHeaders(USER_B),
    });
    assert(crossUserCandidates.statusCode === 404, 'candidate lookup should hide another user inspiration');
    assert(parseJson(crossUserCandidates).error_code === 'LIBRARY_INSPIRATION_NOT_FOUND', 'cross-user candidate lookup should use library not-found code');
  } finally {
    await app.close();
  }

  console.log('home/library contract probe ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
