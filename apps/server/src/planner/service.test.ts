import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolvePlannerInput, type PlannerSourceRepository } from './resolver.js';
import { runQuickPlannerJob } from './service.js';
import { InMemoryPlannerRepository } from './testing/memory-repository.js';

const USER = '00000000-0000-4000-8000-000000000201';

const emptySource: PlannerSourceRepository = {
  async getInspirations() {
    return [];
  },
  async getPoiByReference() {
    return null;
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

describe('Quick planner job service', () => {
  it('persists the complete ordered lifecycle and Quick version', async () => {
    const repository = new InMemoryPlannerRepository();
    const request = { city: '厦门', start_date: '2026-08-01', days: 1, pace: 'tight' as const };
    const created = await repository.createOrGetJob({
      userId: USER,
      requestHash: 'service-success',
      request,
      traceId: 'trace-success',
    });

    await runQuickPlannerJob({
      job: created.job,
      repository,
      resolveInput: () => resolvePlannerInput(USER, created.job.planId, request, emptySource),
    });

    const events = await repository.listJobEvents(created.job.id, USER);
    assert.deepEqual(events.map((event) => event.phase), [
      'started',
      'freeze',
      'selected_anchor',
      'quota',
      'candidates',
      'place',
      'validate',
      'persist',
      'done',
    ]);
    assert.ok(events.at(-1)?.quick_version_id);
    assert.equal((await repository.getPlan(created.job.planId, USER))?.versions.length, 1);
  });

  it('persists seed undo with a seven-second server-enforced window', async () => {
    const repository = new InMemoryPlannerRepository();
    const request = { city: '厦门', start_date: '2026-08-01', days: 1, pace: 'tight' as const };
    const created = await repository.createOrGetJob({
      userId: USER,
      requestHash: 'service-seed-expiry',
      request,
      traceId: 'trace-seed-expiry',
    });
    const startedAt = Date.now();
    await runQuickPlannerJob({
      job: created.job,
      repository,
      resolveInput: async () => ({
        planId: created.job.planId,
        city: '厦门',
        startDate: '2026-08-01',
        days: 1,
        pace: 'tight',
        smartPlanning: true,
        selectedItems: [],
        candidateItems: [{
          itemId: 'seed-candidate',
          inspirationId: 'seed-inspiration',
          source: 'user_candidate',
          poi: {
            poiId: 'seed-poi',
            amapId: 'amap-seed-poi',
            name: '沙坡尾',
            address: '思明区',
            latitude: 24.45,
            longitude: 118.08,
            verified: true,
            quality: 'verified',
            sourceAttribution: 'amap',
            l1AreaId: 'l1-xiamen',
            l2GroupId: 'l2-shapowei',
            openHours: null,
          },
          timeHint: null,
          stayMinutesHint: 120,
          required: false,
        }],
        hotels: [],
        evidenceConstraints: [],
        anchorPool: [],
        builtInFallback: [],
        quotaRatio: 0.6,
      }),
    });

    const plan = await repository.getPlan(created.job.planId, USER);
    const expiresAt = Date.parse(plan!.versions[0]!.payload.seed_undo_expires_at!);
    assert.ok(plan!.versions[0]!.payload.seed_undo_token);
    assert.ok(expiresAt - startedAt >= 6_900);
    assert.ok(expiresAt - startedAt <= 8_000);
  });

  it('emits a valid prefix and terminal failure without a partial version', async () => {
    const repository = new InMemoryPlannerRepository();
    const request = {
      city: '厦门',
      start_date: '2026-08-01',
      days: 1,
      pace: 'tight' as const,
      selected_items: [{ item_id: 'not-owned', source: 'library' as const }],
    };
    const created = await repository.createOrGetJob({
      userId: USER,
      requestHash: 'service-failure',
      request,
      traceId: 'trace-failure',
    });

    await runQuickPlannerJob({
      job: created.job,
      repository,
      resolveInput: () => resolvePlannerInput(USER, created.job.planId, request, emptySource),
    });

    const events = await repository.listJobEvents(created.job.id, USER);
    assert.deepEqual(events.map((event) => event.phase), ['started', 'freeze', 'failed']);
    assert.equal(events.at(-1)?.error_code, 'PLANNER_ITEM_NOT_OWNED');
    assert.equal((await repository.getPlan(created.job.planId, USER))?.versions.length, 0);
  });
});
