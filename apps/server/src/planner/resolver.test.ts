import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PlanGenerateRequest } from './repository.js';
import {
  PlannerInputError,
  resolvePlannerInput,
  type PlannerSourceRepository,
} from './resolver.js';
import type { ResolvedPoi } from './types.js';

const resolvedPoi: ResolvedPoi = {
  poiId: 'poi-owned',
  amapId: 'amap-owned',
  name: '鼓浪屿',
  address: '厦门市思明区',
  latitude: 24.45,
  longitude: 118.07,
  verified: true,
  quality: 'verified',
  sourceAttribution: 'amap',
  l1AreaId: 'l1-xiamen',
  l2GroupId: 'l2-gulangyu',
  openHours: null,
};

function request(overrides: Partial<PlanGenerateRequest> = {}): PlanGenerateRequest {
  return {
    city: '厦门',
    start_date: '2026-08-01',
    days: 1,
    pace: 'tight',
    selected_items: [{ item_id: 'owned', poi_id: 'poi-owned', source: 'library' }],
    candidate_items: [{ item_id: 'pending', source: 'library' }],
    hotels: [{ date: '2026-08-01', leave_blank: true, hotel_name: null }],
    smart_planning: true,
    ...overrides,
  };
}

function source(overrides: Partial<PlannerSourceRepository> = {}): PlannerSourceRepository {
  return {
    async getInspirations(_userId, itemIds) {
      return [
        { itemId: 'owned', inspirationId: 'owned', title: '鼓浪屿', poi: resolvedPoi },
        { itemId: 'pending', inspirationId: 'pending', title: '海边日落', poi: null },
      ].filter((item) => itemIds.includes(item.itemId));
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
    ...overrides,
  };
}

describe('planner input resolver', () => {
  it('uses owned server relationships and preserves unresolved candidate and blank hotel state', async () => {
    let searches = 0;
    const resolved = await resolvePlannerInput('user-a', 'plan-a', request(), source({
      async searchPoi() {
        searches += 1;
        return [];
      },
    }));
    assert.equal(resolved.selectedItems[0]!.poi?.poiId, 'poi-owned');
    assert.equal(resolved.candidateItems[0]!.poi, null);
    assert.equal(resolved.hotels[0]!.leaveBlank, true);
    assert.equal(searches, 0, 'pending inspiration must stay unresolved until the user confirms a POI match');
  });

  it('rejects missing or cross-user item references', async () => {
    await assert.rejects(
      resolvePlannerInput(
        'user-b',
        'plan-a',
        request({ selected_items: [{ item_id: 'other-user', source: 'library' }] }),
        source(),
      ),
      (error) => error instanceof PlannerInputError && error.code === 'PLANNER_ITEM_NOT_OWNED',
    );
  });

  it('rejects a client POI that disagrees with the owned Inspiration', async () => {
    await assert.rejects(
      resolvePlannerInput(
        'user-a',
        'plan-a',
        request({ selected_items: [{ item_id: 'owned', poi_id: 'poi-tampered', source: 'library' }] }),
        source(),
      ),
      (error) => error instanceof PlannerInputError && error.code === 'PLANNER_POI_MISMATCH',
    );
  });

  it('applies owned hard-time hints without promoting them to evidence', async () => {
    const resolved = await resolvePlannerInput(
      'user-a',
      'plan-a',
      request({
        hard_time_hints: [{
          item_id: 'owned',
          poi_id: 'poi-owned',
          time_hint: 'sunset',
          source: 'user_selected',
        }],
      }),
      source(),
    );

    assert.equal(resolved.selectedItems[0]!.timeHint, 'sunset');
    assert.equal(resolved.evidenceConstraints.length, 0);
  });

  it('rejects a hard-time hint whose POI disagrees with server ownership', async () => {
    await assert.rejects(
      resolvePlannerInput(
        'user-a',
        'plan-a',
        request({
          hard_time_hints: [{
            item_id: 'owned',
            poi_id: 'poi-tampered',
            time_hint: 'sunset',
            source: 'uploaded_inspiration',
          }],
        }),
        source(),
      ),
      (error) => error instanceof PlannerInputError && error.code === 'PLANNER_POI_MISMATCH',
    );
  });

  it('re-resolves an explicit hotel and never invents one when providers return nothing', async () => {
    const hotel = { ...resolvedPoi, poiId: 'hotel-poi', name: '厦门宾馆' };
    const matched = await resolvePlannerInput(
      'user-a',
      'plan-a',
      request({ hotels: [{ date: '2026-08-01', hotel_name: '厦门宾馆', poi_id: 'amap-hotel' }] }),
      source({
        async getPoiByReference(_city, reference) {
          return reference === 'amap-hotel' ? hotel : null;
        },
      }),
    );
    assert.equal(matched.hotels[0]!.poi?.poiId, 'hotel-poi');

    const unresolved = await resolvePlannerInput(
      'user-a',
      'plan-a',
      request({ hotels: [{ date: '2026-08-01', hotel_name: '不存在的酒店' }] }),
      source(),
    );
    assert.equal(unresolved.hotels[0]!.poi, null);
    assert.equal(unresolved.hotels[0]!.leaveBlank, true);
    assert.equal(unresolved.hotels[0]!.unresolvedName, '不存在的酒店');
  });

  it('uses wake preference when no explicit morning start overrides it', async () => {
    const resolved = await resolvePlannerInput(
      'user-a',
      'plan-a',
      request({ wake_preference: '06:30', morning_start_time: null }),
      source(),
    );
    assert.equal(resolved.morningStartTime, '06:30');
  });

  it('falls back to built-in POIs when AnchorPool is empty or unavailable', async () => {
    let fallbackReads = 0;
    const fallbackItem = {
      itemId: 'built-in-owned',
      inspirationId: null,
      poi: resolvedPoi,
      source: 'built_in' as const,
      timeHint: null,
      stayMinutesHint: null,
      required: false,
    };
    for (const getAnchorPool of [
      async () => [],
      async () => {
        throw new Error('anchor pool unavailable');
      },
    ]) {
      const resolved = await resolvePlannerInput(
        'user-a',
        'plan-a',
        request(),
        source({
          getAnchorPool,
          async getBuiltInFallback() {
            fallbackReads += 1;
            return [fallbackItem];
          },
        }),
      );
      assert.equal(resolved.builtInFallback[0]?.itemId, 'built-in-owned');
    }
    assert.equal(fallbackReads, 2);
  });
});
