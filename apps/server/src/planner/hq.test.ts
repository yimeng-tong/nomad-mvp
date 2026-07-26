import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DeterministicFakeHqAdapter,
  HqPlanningError,
  ServerManagedHqAdapter,
  startHqPlanning,
  validateHqPayload,
  type HqPlannerAdapter,
} from './hq.js';
import { PlannerRepositoryConflict } from './repository.js';
import { InMemoryPlannerRepository } from './testing/memory-repository.js';

const USER = '00000000-0000-4000-8000-000000000201';

async function quickFixture() {
  const repository = new InMemoryPlannerRepository();
  const created = await repository.createOrGetJob({
    userId: USER,
    requestHash: 'hq-fixture',
    request: { city: '厦门', start_date: '2026-08-01', days: 1, pace: 'tight' },
    traceId: 'trace-hq',
  });
  const quick = await repository.saveQuickVersion(created.job.id, created.job.attempt, {
    city: '厦门',
    start_date: '2026-08-01',
    days: 1,
    pace: 'tight',
    day_plans: [],
    candidates: [],
    warnings: [],
    unresolved_required: [],
  });
  return { repository, created, quick };
}

async function waitForHq(repository: InMemoryPlannerRepository, hqJobId: string) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const job = await repository.getHqJob(hqJobId, USER);
    if (job?.state !== 'running') return job;
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
  throw new Error('HQ job did not finish');
}

describe('HQ planning lifecycle', () => {
  it('rejects unknown POIs and removal of selected-required locations', () => {
    const baseline = {
      city: '厦门',
      start_date: '2026-08-01',
      days: 1,
      pace: 'tight' as const,
      day_plans: [{
        day_index: 0,
        date: '2026-08-01',
        slots: [{
          slot_id: 'selected-slot',
          day_index: 0,
          slot_index: 0,
          start_local: '09:00',
          end_local: '11:00',
          type: 'place' as const,
          origin: 'selected_required' as const,
          title: '日光岩',
          poi: { poi_id: 'poi-selected', name: '日光岩', verified: true },
        }],
        hotel: { date: '2026-08-01', leave_blank: true },
      }],
      candidates: [],
      warnings: [],
      unresolved_required: [],
    };
    assert.throws(
      () => validateHqPayload(baseline, {
        ...baseline,
        day_plans: [{
          ...baseline.day_plans[0],
          slots: [{
            ...baseline.day_plans[0]!.slots[0],
            origin: 'ai_seed',
            poi: { poi_id: 'poi-invented', name: '虚构地点', verified: true },
          }],
        }],
      }),
      (error: unknown) => error instanceof HqPlanningError && error.code === 'HQ_OUTPUT_INVALID',
    );
    assert.throws(
      () => validateHqPayload(baseline, {
        ...baseline,
        day_plans: [{ ...baseline.day_plans[0], slots: [] }],
      }),
      (error: unknown) => error instanceof HqPlanningError && error.code === 'HQ_OUTPUT_INVALID',
    );
    assert.throws(
      () => validateHqPayload(baseline, {
        ...baseline,
        candidates: [{
          candidate_id: 'invented',
          item_id: 'invented',
          poi: { poi_id: 'poi-invented', name: '虚构候选', verified: true },
          status: 'available',
          source: 'ai',
          reason: '虚构候选',
        }],
      }),
      (error: unknown) => error instanceof HqPlanningError && error.code === 'HQ_OUTPUT_INVALID',
    );
    assert.throws(
      () => validateHqPayload(baseline, {
        ...baseline,
        day_plans: [{
          ...baseline.day_plans[0],
          slots: [{
            ...baseline.day_plans[0]!.slots[0],
            poi: {
              ...baseline.day_plans[0]!.slots[0]!.poi,
              name: '被模型篡改的名称',
            },
          }],
        }],
      }),
      (error: unknown) => error instanceof HqPlanningError && error.code === 'HQ_OUTPUT_INVALID',
    );
  });

  it('rejects moving or removing a baseline evidence-backed hard window', () => {
    const baseline = {
      city: '厦门',
      start_date: '2026-08-01',
      days: 1,
      pace: 'tight' as const,
      day_plans: [{
        day_index: 0,
        date: '2026-08-01',
        slots: [{
          slot_id: 'ticket-slot',
          day_index: 0,
          slot_index: 0,
          start_local: '18:00',
          end_local: '20:00',
          type: 'place' as const,
          origin: 'selected_required' as const,
          title: '鼓浪屿',
          poi: { poi_id: 'poi-ticket', name: '鼓浪屿', verified: true },
          constraint: {
            item_id: 'ticket-item',
            poi_id: 'poi-ticket',
            date: '2026-08-01',
            start_local: '18:00',
            end_local: '20:00',
            timezone: 'Asia/Shanghai',
            time_hint: 'evening' as const,
            source: 'ticket' as const,
            evidence_ref: 'ticket-evidence',
            quality: 'verified' as const,
          },
        }],
        hotel: { date: '2026-08-01', leave_blank: true },
      }],
      candidates: [],
      warnings: [],
      unresolved_required: [],
    };
    for (const slotChange of [
      { start_local: '09:00', end_local: '11:00' },
      { constraint: null },
    ]) {
      assert.throws(
        () => validateHqPayload(baseline, {
          ...baseline,
          day_plans: [{
            ...baseline.day_plans[0],
            slots: [{ ...baseline.day_plans[0]!.slots[0], ...slotChange }],
          }],
        }),
        (error: unknown) => error instanceof HqPlanningError && error.code === 'HQ_OUTPUT_INVALID',
      );
    }
  });

  it('preserves explicit breakfast and immutable candidate provenance', () => {
    const baseline = {
      city: '厦门',
      start_date: '2026-08-01',
      days: 1,
      pace: 'tight' as const,
      day_plans: [{
        day_index: 0,
        date: '2026-08-01',
        slots: [],
        hotel: {
          date: '2026-08-01',
          leave_blank: true,
          breakfast_included: false,
        },
      }],
      candidates: [{
        candidate_id: 'candidate-owned',
        item_id: 'item-owned',
        poi: null,
        status: 'available' as const,
        source: 'user_candidate' as const,
        reason: '来自用户灵感',
        quality: 'high' as const,
        source_attribution: 'inspiration:item-owned',
      }],
      warnings: [],
      unresolved_required: [],
    };

    assert.throws(
      () => validateHqPayload(baseline, {
        ...baseline,
        candidates: [{ ...baseline.candidates[0], status: 'used' }],
      }),
      (error: unknown) => error instanceof HqPlanningError && error.code === 'HQ_OUTPUT_INVALID',
    );
    assert.throws(
      () => validateHqPayload(baseline, {
        ...baseline,
        day_plans: [{
          ...baseline.day_plans[0],
          hotel: { ...baseline.day_plans[0]!.hotel, breakfast_included: true },
        }],
      }),
      (error: unknown) => error instanceof HqPlanningError && error.code === 'HQ_OUTPUT_INVALID',
    );
    for (const mutation of [
      { source: 'ai' as const },
      { reason: '模型改写来源' },
      { quality: 'low' as const },
      { source_attribution: 'ai:invented' },
      { candidate_id: 'candidate-replaced' },
    ]) {
      assert.throws(
        () => validateHqPayload(baseline, {
          ...baseline,
          candidates: [{ ...baseline.candidates[0], ...mutation }],
        }),
        (error: unknown) => error instanceof HqPlanningError && error.code === 'HQ_OUTPUT_INVALID',
      );
    }
  });

  it('accepts candidate status changes only when they match actual output slots', () => {
    const candidatePoi = { poi_id: 'poi-candidate', name: '候选地点', verified: true };
    const baseline = {
      city: '厦门',
      start_date: '2026-08-01',
      days: 1,
      pace: 'tight' as const,
      day_plans: [{
        day_index: 0,
        date: '2026-08-01',
        slots: [],
        hotel: { date: '2026-08-01', leave_blank: true },
      }],
      candidates: [{
        candidate_id: 'candidate-owned',
        item_id: 'item-owned',
        poi: candidatePoi,
        status: 'available' as const,
        source: 'user_candidate' as const,
        reason: '来自用户灵感',
        quality: 'verified' as const,
        source_attribution: 'inspiration:item-owned',
      }],
      warnings: [],
      unresolved_required: [],
    };
    const placed = {
      ...baseline,
      day_plans: [{
        ...baseline.day_plans[0],
        slots: [{
          slot_id: 'candidate-slot',
          day_index: 0,
          slot_index: 0,
          start_local: '09:00',
          end_local: '11:00',
          type: 'place' as const,
          origin: 'ai_seed' as const,
          title: '候选地点',
          poi: candidatePoi,
          inspiration_id: 'item-owned',
        }],
      }],
      candidates: [{ ...baseline.candidates[0], status: 'used' as const }],
    };

    assert.doesNotThrow(() => validateHqPayload(baseline, placed));
    assert.throws(
      () => validateHqPayload(baseline, {
        ...placed,
        candidates: [{ ...placed.candidates[0], status: 'available' }],
      }),
      (error: unknown) => error instanceof HqPlanningError && error.code === 'HQ_OUTPUT_INVALID',
    );
    assert.throws(
      () => validateHqPayload(baseline, {
        ...baseline,
        candidates: [{ ...baseline.candidates[0], status: 'requires_location' }],
      }),
      (error: unknown) => error instanceof HqPlanningError && error.code === 'HQ_OUTPUT_INVALID',
    );
  });

  it('creates an independent version and keeps Quick current until adoption', async () => {
    const { repository, created, quick } = await quickFixture();
    const started = await startHqPlanning({
      repository,
      adapter: new DeterministicFakeHqAdapter(),
      planId: created.job.planId,
      userId: USER,
      quickVersion: quick,
      traceId: 'trace-hq',
    });
    const duplicate = await startHqPlanning({
      repository,
      adapter: new DeterministicFakeHqAdapter(),
      planId: created.job.planId,
      userId: USER,
      quickVersion: quick,
      traceId: 'trace-hq',
    });
    assert.equal(duplicate.id, started.id);

    const finished = await waitForHq(repository, started.id);
    assert.equal(finished?.state, 'done');
    assert.ok(finished?.versionId);
    const before = await repository.getPlan(created.job.planId, USER);
    assert.equal(before?.currentVersionId, quick.id);
    assert.equal(before?.versions.length, 2);

    const adopted = await repository.adoptHqVersion({
      planId: created.job.planId,
      hqVersionId: finished!.versionId!,
      baseVersionId: quick.id,
      userId: USER,
      expectedPlanRev: 1,
    });
    assert.equal(adopted.planRev, 2);
    assert.equal(adopted.currentVersionId, finished?.versionId);
    const duplicateAdopt = await repository.adoptHqVersion({
      planId: created.job.planId,
      hqVersionId: finished!.versionId!,
      baseVersionId: quick.id,
      userId: USER,
      expectedPlanRev: 1,
    });
    assert.equal(duplicateAdopt.planRev, 2);
  });

  it('rejects adoption when the user edited the Quick baseline while HQ was running', async () => {
    const { repository, created, quick } = await quickFixture();
    const started = await startHqPlanning({
      repository,
      adapter: new DeterministicFakeHqAdapter(),
      planId: created.job.planId,
      userId: USER,
      quickVersion: quick,
      traceId: 'trace-hq-stale-base',
    });
    const finished = await waitForHq(repository, started.id);
    const edited = await repository.updateCurrentVersion({
      planId: created.job.planId,
      userId: USER,
      expectedPlanRev: 1,
      mutate: (payload) => ({
        ...payload,
        warnings: [...payload.warnings, { code: 'USER_EDIT', severity: 'soft', message: '用户修改' }],
      }),
    });

    await assert.rejects(
      repository.adoptHqVersion({
        planId: created.job.planId,
        hqVersionId: finished!.versionId!,
        baseVersionId: quick.id,
        userId: USER,
        expectedPlanRev: edited.planRev,
      }),
      PlannerRepositoryConflict,
    );
    assert.equal((await repository.getPlan(created.job.planId, USER))?.currentVersionId, edited.version.id);
  });

  it('records provider failure and leaves Quick usable', async () => {
    const { repository, created, quick } = await quickFixture();
    const failing: HqPlannerAdapter = {
      async improve() {
        throw new HqPlanningError('HQ_PROVIDER_UNAVAILABLE', 'provider unavailable', true);
      },
    };
    const started = await startHqPlanning({
      repository,
      adapter: failing,
      planId: created.job.planId,
      userId: USER,
      quickVersion: quick,
      traceId: 'trace-hq-failure',
    });
    const failed = await waitForHq(repository, started.id);
    assert.equal(failed?.state, 'failed');
    assert.equal(failed?.errorCode, 'HQ_PROVIDER_UNAVAILABLE');
    assert.equal(failed?.retriable, true);
    assert.equal((await repository.getPlan(created.job.planId, USER))?.currentVersionId, quick.id);
  });

  it('retries one failed retriable HQ job without creating a duplicate', async () => {
    const { repository, created, quick } = await quickFixture();
    const failing: HqPlannerAdapter = {
      async improve() {
        throw new HqPlanningError('HQ_PROVIDER_TIMEOUT', 'provider timeout', true);
      },
    };
    const first = await startHqPlanning({
      repository,
      adapter: failing,
      planId: created.job.planId,
      userId: USER,
      quickVersion: quick,
      traceId: 'trace-hq-retry-first',
    });
    assert.equal((await waitForHq(repository, first.id))?.state, 'failed');

    const retry = await startHqPlanning({
      repository,
      adapter: new DeterministicFakeHqAdapter(),
      planId: created.job.planId,
      userId: USER,
      quickVersion: quick,
      traceId: 'trace-hq-retry-second',
    });
    assert.equal(retry.id, first.id);
    const finished = await waitForHq(repository, retry.id);
    assert.equal(finished?.state, 'done');
    assert.ok(finished?.versionId);
    assert.equal((await repository.getPlan(created.job.planId, USER))?.versions.length, 2);
  });

  it('classifies malformed provider JSON as a retriable output error', async () => {
    const { quick } = await quickFixture();
    const previous = {
      baseUrl: process.env.AI_PROVIDER_BASE_URL,
      apiKey: process.env.AI_PROVIDER_API_KEY,
      model: process.env.AI_PROVIDER_MODEL,
      fetch: globalThis.fetch,
    };
    process.env.AI_PROVIDER_BASE_URL = 'https://provider.example.test';
    process.env.AI_PROVIDER_API_KEY = 'server-only-test-key';
    process.env.AI_PROVIDER_MODEL = 'test-model';
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '{not-json' } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );

    try {
      await assert.rejects(
        new ServerManagedHqAdapter().improve(quick.payload, {
          planId: 'plan-hq-invalid-json',
          userId: '00000000-0000-4000-8000-000000000299',
          traceId: 'trace-invalid-json',
        }),
        (error: unknown) =>
          error instanceof HqPlanningError &&
          error.code === 'HQ_OUTPUT_INVALID' &&
          error.retriable === true,
      );
    } finally {
      globalThis.fetch = previous.fetch;
      if (previous.baseUrl === undefined) delete process.env.AI_PROVIDER_BASE_URL;
      else process.env.AI_PROVIDER_BASE_URL = previous.baseUrl;
      if (previous.apiKey === undefined) delete process.env.AI_PROVIDER_API_KEY;
      else process.env.AI_PROVIDER_API_KEY = previous.apiKey;
      if (previous.model === undefined) delete process.env.AI_PROVIDER_MODEL;
      else process.env.AI_PROVIDER_MODEL = previous.model;
    }
  });
});
