import cookie from '@fastify/cookie';
import Fastify from 'fastify';
import fastifySSE from 'fastify-sse-v2';
import { readFileSync } from 'node:fs';
import authPlugin from '../src/plugins/auth.js';
import errorEnvelope from '../src/plugins/error-envelope.js';
import idempotency from '../src/plugins/idempotency.js';
import planRoutes from '../src/routes/plan.js';
import searchRoutes from '../src/routes/search.js';
import traceIdPlugin from '../src/plugins/trace-id.js';
import type { PlannerSourceRepository } from '../src/planner/resolver.js';
import {
  DeterministicFakeHqAdapter,
  HqPlanningError,
  type HqPlannerAdapter,
} from '../src/planner/hq.js';
import { InMemoryPlannerRepository } from '../src/planner/testing/memory-repository.js';
import type { ResolvedPoi } from '../src/planner/types.js';
import type { components } from '../../../packages/types/src/api-types.js';

type PlanJobEvent = components['schemas']['PlanJobEvent'];
type DayPlanResponse = components['schemas']['DayPlanResponse'];
type EmptySlotResolveRequest = components['schemas']['EmptySlotResolveRequest'];
type HqStatusResponse = components['schemas']['HqStatusResponse'];

void (null as unknown as PlanJobEvent);
void (null as unknown as DayPlanResponse);
void (null as unknown as EmptySlotResolveRequest);
void (null as unknown as HqStatusResponse);

function assertGeneratedPlannerContracts() {
  const generated = readFileSync(new URL('../../../packages/types/src/api-types.ts', import.meta.url), 'utf8');
  for (const schema of ['PlanJobEvent', 'DayPlanResponse', 'EmptySlotResolveRequest', 'HqStatusResponse']) {
    assert(generated.includes(`${schema}: `), `generated OpenAPI types should include ${schema}`);
  }
}

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
      { id: 'B02500A001', name: '厦门中山路酒店', address: '思明区中山路 1 号', distance: '120', location: '118.0812,24.4798' },
      { id: 'B02500A002', name: '厦门中山路酒店二店', address: '思明区中山路 2 号', distance: '260', location: '118.0822,24.4808' },
      { id: 'B02500A003', name: '厦门中山路酒店三店', address: '思明区中山路 3 号', distance: [], location: [] },
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

async function buildPlannerApp(hqAdapter: HqPlannerAdapter = new DeterministicFakeHqAdapter()) {
  const repository = new InMemoryPlannerRepository();
  const plannerPoi = (id: string, name: string): ResolvedPoi => ({
    poiId: id,
    amapId: `amap-${id}`,
    name,
    address: `厦门 ${name}`,
    latitude: 24.48,
    longitude: 118.08,
    verified: true,
    quality: 'verified',
    sourceAttribution: 'planner-probe',
    l1AreaId: 'l1-xiamen',
    l2GroupId: `l2-${id}`,
  });
  const source: PlannerSourceRepository = {
    async getInspirations(_userId, itemIds) {
      const items = [
        { itemId: 'ins-sunlight-rock', inspirationId: 'ins-sunlight-rock', title: '日光岩', poi: plannerPoi('poi-sunlight-rock', '日光岩') },
        { itemId: 'ins-shapowei', inspirationId: 'ins-shapowei', title: '沙坡尾', poi: plannerPoi('poi-shapowei', '沙坡尾') },
      ];
      return items.filter((item) => itemIds.includes(item.itemId));
    },
    async getPoiByReference(_city, reference) {
      return reference === 'amap-hotel-1' ? plannerPoi('poi-hotel-1', '厦门中山路酒店') : null;
    },
    async searchPoi() {
      return [];
    },
    async getEvidenceConstraints() {
      return [];
    },
    async getAnchorPool() {
      return [];
    },
    async getBuiltInFallback() {
      return [];
    },
  };
  const app = Fastify({ logger: false });
  await app.register(fastifySSE as any);
  await app.register(cookie);
  await app.register(traceIdPlugin);
  await app.register(errorEnvelope);
  await app.register(idempotency);
  await app.register(authPlugin);
  await app.register(searchRoutes);
  await app.register(planRoutes, {
    repository,
    source,
    hqAdapter,
    pollMs: 5,
  });
  await app.ready();
  return { app, repository };
}

async function waitForTerminal(repository: InMemoryPlannerRepository, jobId: string, userId = USER_A) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const events = await repository.listJobEvents(jobId, userId);
    if (events.some((event) => event.phase === 'done' || event.phase === 'failed')) return events;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error('planner job did not reach a terminal state');
}

async function waitForHq(repository: InMemoryPlannerRepository, hqJobId: string, userId = USER_A) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const job = await repository.getHqJob(hqJobId, userId);
    if (job?.state !== 'running') return job;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error('HQ job did not reach a terminal state');
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
      item_id: 'ins-shapowei',
      poi_id: 'poi-shapowei',
      time_hint: 'night_market',
      source: 'uploaded_inspiration',
    },
  ],
};

async function main() {
  assertGeneratedPlannerContracts();
  const { app, repository } = await buildPlannerApp();
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
    assert(
      hotelItems[0].longitude === 118.0812 && hotelItems[0].latitude === 24.4798,
      'hotel POI search should normalize provider coordinates',
    );
    assert(
      hotelItems[2].longitude === null && hotelItems[2].latitude === null,
      'invalid provider coordinates should degrade to null',
    );
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
    const validBody = parseJson(valid);
    const terminalEvents = await waitForTerminal(repository, validBody.plan_job_id);
    assert(
      terminalEvents.map((event) => event.phase).join(',') ===
        'started,freeze,selected_anchor,quota,candidates,place,validate,persist,done',
      'Quick planner should persist the complete ordered event chain',
    );
    assert(terminalEvents.at(-1)?.quick_version_id, 'Quick done should reference the persisted version');
    assert(terminalEvents.at(-1)?.hq_job_id, 'smart planning should automatically start HQ after Quick');
    const hqJob = await waitForHq(repository, terminalEvents.at(-1)!.hq_job_id!);
    assert(hqJob?.state === 'done' && hqJob.versionId, 'fake HQ should persist an independent ready version');

    const currentPlan = await app.inject({
      method: 'GET',
      url: `/plan/${validBody.plan_id}`,
      headers: authHeaders(),
    });
    assert(currentPlan.statusCode === 200, 'the owner should read the persisted Quick plan');
    const currentBody = parseJson(currentPlan);
    assert(currentBody.current_version_id === terminalEvents.at(-1)?.quick_version_id, 'plan read should expose the Quick version');
    assert(currentBody.current_version_id !== hqJob?.versionId, 'HQ should not replace Quick before explicit adoption');
    assert(currentBody.hq_job?.state === 'done', 'plan summary should expose the latest HQ state');
    assert(currentBody.day_plans.length === validStory20Payload.days, 'plan read should return all trip days');

    const hiddenPlan = await app.inject({
      method: 'GET',
      url: `/plan/${validBody.plan_id}`,
      headers: authHeaders(USER_B),
    });
    assert(hiddenPlan.statusCode === 404, 'plan reads should hide another user plan');

    const replay = await app.inject({
      method: 'GET',
      url: `/sse/plan/${validBody.plan_job_id}`,
      headers: { ...authHeaders(), 'last-event-id': '7' },
    });
    assert(replay.statusCode === 200, `terminal SSE should replay for the owner: ${replay.statusCode} ${replay.body}`);
    assert(!replay.body.includes('"phase":"started"'), 'Last-Event-ID replay should skip prior events');
    assert(
      replay.body.includes('"phase":"persist"') && replay.body.includes('"phase":"done"'),
      `SSE should replay remaining terminal events: ${replay.body}`,
    );
    const terminalCursorReplay = await app.inject({
      method: 'GET',
      url: `/sse/plan/${validBody.plan_job_id}`,
      headers: { ...authHeaders(), 'last-event-id': String(terminalEvents.length) },
    });
    assert(terminalCursorReplay.statusCode === 200, 'a cursor already at terminal should close cleanly');
    assert(!terminalCursorReplay.body.includes('event: ping'), 'a terminal cursor should not leak heartbeat timers');
    const staleAttemptReplay = await app.inject({
      method: 'GET',
      url: `/sse/plan/${validBody.plan_job_id}`,
      headers: { ...authHeaders(), 'last-event-id': '99:99' },
    });
    assert(
      staleAttemptReplay.body.includes('id: 1:1') && staleAttemptReplay.body.includes('"phase":"done"'),
      'SSE should reset the sequence when the client reconnects from an older attempt epoch',
    );

    const hiddenSse = await app.inject({
      method: 'GET',
      url: `/sse/plan/${validBody.plan_job_id}`,
      headers: authHeaders(USER_B),
    });
    assert(hiddenSse.statusCode === 404, 'SSE should hide another user job');

    const hqStatus = await app.inject({
      method: 'GET',
      url: `/plan/hq/status?hq_job_id=${hqJob!.id}`,
      headers: authHeaders(),
    });
    assert(hqStatus.statusCode === 200 && parseJson(hqStatus).version_id === hqJob?.versionId, 'HQ status should expose the owner result');
    const hiddenHqStatus = await app.inject({
      method: 'GET',
      url: `/plan/hq/status?hq_job_id=${hqJob!.id}`,
      headers: authHeaders(USER_B),
    });
    assert(hiddenHqStatus.statusCode === 404, 'HQ status should hide another user job');
    const explicitHq = await app.inject({
      method: 'POST',
      url: '/plan/hq/start',
      headers: authHeaders(),
      payload: { plan_id: validBody.plan_id },
    });
    assert(parseJson(explicitHq).hq_job_id === hqJob?.id, 'explicit HQ start should reuse the automatic job');

    const quickVersionId = terminalEvents.at(-1)?.quick_version_id;
    const versionPreview = await app.inject({
      method: 'GET',
      url: `/plan/${validBody.plan_id}/versions/${quickVersionId}`,
      headers: authHeaders(),
    });
    assert(versionPreview.statusCode === 200, 'the owner should preview an owned plan version');
    const hqVersionPreview = await app.inject({
      method: 'GET',
      url: `/plan/${validBody.plan_id}/versions/${hqJob?.versionId}`,
      headers: authHeaders(),
    });
    assert(hqVersionPreview.statusCode === 200, 'the owner should preview the HQ plan version');
    assert(
      parseJson(hqVersionPreview).current_version_id === quickVersionId,
      'previewing HQ must not claim that HQ is already the current version',
    );

    assert(currentBody.seed_undo_token, 'a seeded Quick plan should expose an undo token');
    const undo = await app.inject({
      method: 'POST',
      url: `/plan/${validBody.plan_id}/seed/undo`,
      headers: authHeaders(),
      payload: {
        expected_plan_rev: currentBody.plan_rev,
        undo_token: currentBody.seed_undo_token,
      },
    });
    assert(undo.statusCode === 200, 'a non-expired seed token should be accepted');
    const seedUndonePlan = parseJson(await app.inject({
      method: 'GET',
      url: `/plan/${validBody.plan_id}`,
      headers: authHeaders(),
    }));
    assert(
      !seedUndonePlan.day_plans.flatMap((day: any) => day.slots).some((slot: any) => slot.origin === 'ai_seed'),
      'seed undo should remove AI seed slots',
    );
    assert(
      seedUndonePlan.day_plans.flatMap((day: any) => day.slots).some((slot: any) => slot.origin === 'selected_required'),
      'seed undo should preserve selected-required slots',
    );

    const expired = await repository.updateCurrentVersion({
      planId: validBody.plan_id,
      userId: USER_A,
      expectedPlanRev: seedUndonePlan.plan_rev,
      mutate: (payload) => ({
        ...payload,
        seed_undo_token: 'expired-seed-token',
        seed_undo_expires_at: new Date(Date.now() - 1_000).toISOString(),
      }),
    });
    const expiredUndo = await app.inject({
      method: 'POST',
      url: `/plan/${validBody.plan_id}/seed/undo`,
      headers: authHeaders(),
      payload: {
        expected_plan_rev: expired.planRev,
        undo_token: 'expired-seed-token',
      },
    });
    assert(expiredUndo.statusCode === 409, 'an expired seed token should be rejected');

    const reset = await app.inject({
      method: 'POST',
      url: `/plan/${validBody.plan_id}/seed/reset`,
      headers: authHeaders(),
      payload: { expected_plan_rev: expired.planRev },
    });
    assert(reset.statusCode === 200 && parseJson(reset).plan_rev === expired.planRev + 1, 'seed reset should create a new revision');
    const resetPlan = parseJson(await app.inject({
      method: 'GET',
      url: `/plan/${validBody.plan_id}`,
      headers: authHeaders(),
    }));
    assert(
      resetPlan.day_plans.flatMap((day: any) => day.slots).some((slot: any) => slot.origin === 'selected_required'),
      'seed reset should preserve selected-required slots',
    );
    assert(
      !resetPlan.day_plans.flatMap((day: any) => day.slots).some((slot: any) => slot.origin === 'ai_seed'),
      'seed reset should remove AI seed slots',
    );

    const staleReset = await app.inject({
      method: 'POST',
      url: `/plan/${validBody.plan_id}/seed/reset`,
      headers: authHeaders(),
      payload: { expected_plan_rev: currentBody.plan_rev },
    });
    assert(staleReset.statusCode === 409, 'a stale plan revision should be rejected');

    const emptySlot = resetPlan.day_plans.flatMap((day: any) => day.slots).find((slot: any) => slot.type === 'unresolved');
    assert(emptySlot, 'reset plan should contain an empty slot');
    const setFree = await app.inject({
      method: 'POST',
      url: `/plan/${validBody.plan_id}/slots/${emptySlot.slot_id}/resolve`,
      headers: authHeaders(),
      payload: { op: 'set_free_activity', expected_plan_rev: resetPlan.plan_rev },
    });
    assert(setFree.statusCode === 200, 'an empty slot should support free activity');
    assert(parseJson(setFree).slot.type === 'free', 'empty slot response should contain the resolved slot');
    const beforeAdopt = parseJson(await app.inject({
      method: 'GET',
      url: `/plan/${validBody.plan_id}`,
      headers: authHeaders(),
    }));
    const staleHqAdopt = await app.inject({
      method: 'POST',
      url: '/plan/hq/adopt',
      headers: authHeaders(),
      payload: {
        plan_id: validBody.plan_id,
        hq_job_id: hqJob!.id,
        expected_plan_rev: beforeAdopt.plan_rev,
      },
    });
    assert(staleHqAdopt.statusCode === 409, 'HQ based on an edited Quick version should not overwrite user changes');
    const refreshedHqStart = await app.inject({
      method: 'POST',
      url: '/plan/hq/start',
      headers: authHeaders(),
      payload: { plan_id: validBody.plan_id },
    });
    const refreshedHqJobId = parseJson(refreshedHqStart).hq_job_id;
    const refreshedHqJob = await waitForHq(repository, refreshedHqJobId);
    const adopt = await app.inject({
      method: 'POST',
      url: '/plan/hq/adopt',
      headers: authHeaders(),
      payload: {
        plan_id: validBody.plan_id,
        hq_job_id: refreshedHqJob!.id,
        expected_plan_rev: beforeAdopt.plan_rev,
      },
    });
    assert(adopt.statusCode === 200, 'a completed owned HQ version should be adoptable');
    assert(parseJson(adopt).current_version_id === refreshedHqJob?.versionId, 'HQ adoption should switch the current version');

    const undoPlanStart = await app.inject({
      method: 'POST',
      url: '/plan/generate',
      headers: authHeaders(),
      payload: { ...validStory20Payload, rec_id: 'city-xm-undo' },
    });
    const undoPlanStartBody = parseJson(undoPlanStart);
    await waitForTerminal(repository, undoPlanStartBody.plan_job_id);
    const undoPlan = parseJson(await app.inject({
      method: 'GET',
      url: `/plan/${undoPlanStartBody.plan_id}`,
      headers: authHeaders(),
    }));
    assert(undoPlan.seed_undo_token, 'a plan with AI seed placements should expose an undo token');
    const badUndo = await app.inject({
      method: 'POST',
      url: `/plan/${undoPlanStartBody.plan_id}/seed/undo`,
      headers: authHeaders(),
      payload: { expected_plan_rev: undoPlan.plan_rev, undo_token: 'wrong-token' },
    });
    assert(badUndo.statusCode === 409, 'an invalid seed undo token should be rejected');
    const goodUndo = await app.inject({
      method: 'POST',
      url: `/plan/${undoPlanStartBody.plan_id}/seed/undo`,
      headers: authHeaders(),
      payload: { expected_plan_rev: undoPlan.plan_rev, undo_token: undoPlan.seed_undo_token },
    });
    assert(goodUndo.statusCode === 200, 'a valid seed undo token should create a new revision');
    const undonePlan = parseJson(await app.inject({
      method: 'GET',
      url: `/plan/${undoPlanStartBody.plan_id}`,
      headers: authHeaders(),
    }));
    assert(
      !undonePlan.day_plans.flatMap((day: any) => day.slots).some((slot: any) => slot.origin === 'ai_seed'),
      'seed undo should remove only AI seed placements',
    );

    const sameUserCached = await app.inject({ method: 'POST', url: '/plan/generate', headers: authHeaders(), payload: validStory20Payload });
    assert(parseJson(sameUserCached).plan_job_id === parseJson(valid).plan_job_id, 'idempotency should cache per user and body');

    const keyed = await app.inject({
      method: 'POST',
      url: '/plan/generate',
      headers: { ...authHeaders(), 'idempotency-key': 'planner-probe-key-1' },
      payload: validStory20Payload,
    });
    const keyedBody = parseJson(keyed);
    assert(keyedBody.plan_job_id !== validBody.plan_job_id, 'a new idempotency key should create a new planning job');
    await waitForTerminal(repository, keyedBody.plan_job_id);
    const keyedConflict = await app.inject({
      method: 'POST',
      url: '/plan/generate',
      headers: { ...authHeaders(), 'idempotency-key': 'planner-probe-key-1' },
      payload: { ...validStory20Payload, days: 2 },
    });
    assert(keyedConflict.statusCode === 409, 'reusing an idempotency key for another request should conflict');

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

    const orphanHardTime = await app.inject({
      method: 'POST',
      url: '/plan/generate',
      headers: authHeaders(),
      payload: {
        ...validStory20Payload,
        hard_time_hints: [{
          item_id: 'ins-not-in-request',
          time_hint: 'sunset',
          source: 'uploaded_inspiration',
        }],
      },
    });
    assert(orphanHardTime.statusCode === 400, 'hard time hints must belong to a planner item');

    const duplicateHardTime = await app.inject({
      method: 'POST',
      url: '/plan/generate',
      headers: authHeaders(),
      payload: {
        ...validStory20Payload,
        hard_time_hints: [
          {
            item_id: 'ins-shapowei',
            poi_id: 'poi-shapowei',
            time_hint: 'night',
            source: 'user_selected',
          },
          {
            item_id: 'ins-shapowei',
            poi_id: 'poi-shapowei',
            time_hint: 'night_market',
            source: 'uploaded_inspiration',
          },
        ],
      },
    });
    assert(duplicateHardTime.statusCode === 400, 'duplicate hard time hints should be rejected');

    const mismatchedHardTimePoi = await app.inject({
      method: 'POST',
      url: '/plan/generate',
      headers: authHeaders(),
      payload: {
        ...validStory20Payload,
        hard_time_hints: [{
          item_id: 'ins-shapowei',
          poi_id: 'poi-tampered',
          time_hint: 'night',
          source: 'uploaded_inspiration',
        }],
      },
    });
    assert(mismatchedHardTimePoi.statusCode === 400, 'hard time hint POIs must match their planner item');

    const unsupportedCity = await app.inject({
      method: 'POST',
      url: '/plan/generate',
      headers: authHeaders(),
      payload: { ...validStory20Payload, city: '未知测试城市' },
    });
    assert(unsupportedCity.statusCode === 400, 'unknown planner city timezone should return a client error');
    assert(parseJson(unsupportedCity).error_code === 'PLAN_CITY_UNSUPPORTED', 'unknown city should use a stable error code');

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

    let failureAttempts = 0;
    const failingAdapter: HqPlannerAdapter = {
      async improve() {
        failureAttempts += 1;
        throw new HqPlanningError('HQ_PROVIDER_TIMEOUT', 'provider timed out', true);
      },
    };
    const failureFixture = await buildPlannerApp(failingAdapter);
    try {
      const failureStart = await failureFixture.app.inject({
        method: 'POST',
        url: '/plan/generate',
        headers: authHeaders(),
        payload: validStory20Payload,
      });
      const failureStartBody = parseJson(failureStart);
      const failureEvents = await waitForTerminal(failureFixture.repository, failureStartBody.plan_job_id);
      const failedHq = await waitForHq(failureFixture.repository, failureEvents.at(-1)!.hq_job_id!);
      assert(failedHq?.state === 'failed' && failedHq.retriable, 'HQ provider failure should be durable and retriable');
      const failedHqStatus = await failureFixture.app.inject({
        method: 'GET',
        url: `/plan/hq/status?hq_job_id=${failedHq!.id}`,
        headers: authHeaders(),
      });
      assert(parseJson(failedHqStatus).state === 'failed', 'HQ status endpoint should expose provider failure');
      const quickAfterHqFailure = parseJson(await failureFixture.app.inject({
        method: 'GET',
        url: `/plan/${failureStartBody.plan_id}`,
        headers: authHeaders(),
      }));
      assert(
        quickAfterHqFailure.current_version_id === failureEvents.at(-1)?.quick_version_id,
        'HQ failure should leave Quick current and usable',
      );
      const retryHq = await failureFixture.app.inject({
        method: 'POST',
        url: '/plan/hq/start',
        headers: authHeaders(),
        payload: { plan_id: failureStartBody.plan_id },
      });
      assert(
        parseJson(retryHq).hq_job_id === failedHq!.id,
        'an explicit HQ retry should reuse the durable job identity',
      );
      await waitForHq(failureFixture.repository, failedHq!.id);
      assert(failureAttempts === 2, 'an explicit HQ retry should execute the provider again exactly once');
    } finally {
      await failureFixture.app.close();
    }
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
