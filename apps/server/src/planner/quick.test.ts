import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildQuickPlan } from './quick.js';
import { rankCandidates } from './ranking.js';
import {
  buildDayWindows,
  normalizeDurationMinutes,
  paceSlotMinutes,
  zonedLocalToUtc,
} from './time-windows.js';
import type { ResolvedPlannerItem, ResolvedPoi } from './types.js';

const poi = (id: string, l1AreaId = 'l1-a', latitude = 24.48, longitude = 118.08): ResolvedPoi => ({
  poiId: id,
  amapId: `amap-${id}`,
  name: `POI ${id}`,
  address: `Address ${id}`,
  latitude,
  longitude,
  verified: true,
  quality: 'verified',
  sourceAttribution: 'amap',
  l1AreaId,
  l2GroupId: `l2-${id}`,
  openHours: null,
});

const item = (
  id: string,
  resolvedPoi: ResolvedPoi | null,
  overrides: Partial<ResolvedPlannerItem> = {},
): ResolvedPlannerItem => ({
  itemId: id,
  inspirationId: `inspiration-${id}`,
  poi: resolvedPoi,
  source: 'user_candidate',
  timeHint: null,
  stayMinutesHint: null,
  required: false,
  ...overrides,
});

describe('Quick planner time model', () => {
  it('maps pace and the 2.5 hour threshold deterministically', () => {
    assert.equal(paceSlotMinutes('tight'), 120);
    assert.equal(paceSlotMinutes('comfortable'), 240);
    assert.equal(normalizeDurationMinutes(150), 120);
    assert.equal(normalizeDurationMinutes(151), 240);
  });

  it('honors first and last day boundaries without crossing dates', () => {
    const windows = buildDayWindows({
      startDate: '2026-08-01',
      days: 2,
      pace: 'tight',
      morningStartTime: '08:00',
      firstDayArrivalTime: '12:30',
      lastDayDepartureTime: '16:00',
    });
    assert.deepEqual(
      windows.map((window) => [window.date, window.startLocal, window.endLocal, window.slots.length]),
      [
        ['2026-08-01', '12:30', '20:30', 4],
        ['2026-08-02', '08:00', '16:00', 4],
      ],
    );
  });

  it('converts local itinerary times with the plan timezone', () => {
    assert.equal(
      zonedLocalToUtc('2026-08-01', '09:00', 'Asia/Shanghai').toISOString(),
      '2026-08-01T01:00:00.000Z',
    );
    assert.throws(
      () => zonedLocalToUtc('2026-03-08', '02:30', 'America/New_York'),
      /does not exist/,
    );
    assert.throws(
      () => zonedLocalToUtc('2026-11-01', '01:30', 'America/New_York'),
      /ambiguous/,
    );
  });
});

describe('Quick planner ranking', () => {
  it('uses same-L1 before near-hotel as soft deterministic tie breakers', () => {
    const ranked = rankCandidates(
      [item('other', poi('other', 'l1-b', 24.9, 118.5)), item('same', poi('same', 'l1-a', 24.7, 118.4))],
      { preferredL1AreaId: 'l1-a', hotelPoi: poi('hotel', 'hotel-area', 24.48, 118.08), lateSlot: false },
    );
    assert.equal(ranked[0]!.itemId, 'same');

    const hotelRanked = rankCandidates(
      [item('far', poi('far', 'l1-b', 25, 119)), item('near', poi('near', 'l1-b', 24.481, 118.081))],
      { preferredL1AreaId: null, hotelPoi: poi('hotel'), lateSlot: true },
    );
    assert.equal(hotelRanked[0]!.itemId, 'near');
  });

  it('prefers the current L2 group before another item in the same L1 area', () => {
    const preferred = item('preferred', { ...poi('preferred'), l2GroupId: 'l2-current' });
    const adjacent = item('adjacent', { ...poi('adjacent'), l2GroupId: 'l2-other' });
    const ranked = rankCandidates([adjacent, preferred], {
      preferredL1AreaId: 'l1-a',
      preferredL2GroupId: 'l2-current',
      hotelPoi: null,
      lateSlot: false,
    });
    assert.equal(ranked[0]!.itemId, 'preferred');
  });
});

describe('Quick planner output', () => {
  it('preserves required items, deduplicates canonical POIs, applies quota, and preserves blank hotels', () => {
    const sharedPoi = poi('shared');
    const result = buildQuickPlan({
      planId: 'plan-1',
      city: '厦门',
      startDate: '2026-08-01',
      days: 1,
      pace: 'tight',
      smartPlanning: true,
      selectedItems: [
        item('required', sharedPoi, { required: true }),
        item('pending-required', null, { required: true }),
      ],
      candidateItems: [
        item('duplicate', sharedPoi),
        item('candidate-a', poi('candidate-a')),
        item('candidate-b', poi('candidate-b')),
        item('pending-candidate', null),
      ],
      hotels: [{ date: '2026-08-01', leaveBlank: true, breakfastIncluded: false, poi: null }],
      evidenceConstraints: [],
      anchorPool: [],
      builtInFallback: [],
      quotaRatio: 0.6,
    });

    assert.equal(result.day_plans[0]!.hotel.leave_blank, true);
    assert.equal(result.day_plans[0]!.hotel.poi, null);
    assert.equal(result.day_plans[0]!.slots[0]!.origin, 'selected_required');
    assert.equal(result.day_plans.flatMap((day) => day.slots).filter((slot) => slot.poi?.poi_id === 'shared').length, 1);
    assert.ok(result.unresolved_required.some((entry) => entry.item_id === 'pending-required'));
    assert.ok(result.candidates.some((entry) => entry.item_id === 'pending-candidate' && entry.status === 'requires_location'));
    assert.equal(
      result.day_plans.flatMap((day) => day.slots).filter((slot) => slot.origin === 'ai_seed').length,
      2,
    );
  });

  it('places hard-time evidence first and reports an impossible required constraint honestly', () => {
    const result = buildQuickPlan({
      planId: 'plan-2',
      city: '厦门',
      startDate: '2026-08-01',
      days: 1,
      pace: 'tight',
      smartPlanning: false,
      firstDayArrivalTime: '08:00',
      selectedItems: [
        item('night-required', poi('night'), { required: true, timeHint: 'night' }),
        item('dawn-required', poi('dawn'), { required: true, timeHint: 'dawn' }),
      ],
      candidateItems: [],
      hotels: [],
      evidenceConstraints: [
        {
          itemId: 'night-required',
          date: '2026-08-01',
          startLocal: '18:00',
          endLocal: '20:00',
          timezone: 'Asia/Shanghai',
          timeHint: 'night',
          source: 'uploaded_inspiration',
          evidenceRef: 'evidence-1',
          quality: 'verified',
        },
      ],
      anchorPool: [],
      builtInFallback: [],
      quotaRatio: 0.6,
    });

    const night = result.day_plans[0]!.slots.find((slot) => slot.poi?.poi_id === 'night');
    assert.equal(night?.start_local, '18:00');
    assert.equal(night?.constraint?.evidence_ref, 'evidence-1');
    const ordered = [...result.day_plans[0]!.slots].sort((left, right) => left.slot_index - right.slot_index);
    for (let index = 1; index < ordered.length; index += 1) {
      assert.ok(ordered[index - 1]!.end_local <= ordered[index]!.start_local);
    }
    assert.ok(
      result.unresolved_required.some(
        (entry) => entry.item_id === 'dawn-required' && entry.reason_code === 'hard_time_conflict',
      ),
    );
  });

  it('creates an evidence-backed dawn boundary slot on a full travel day', () => {
    const result = buildQuickPlan({
      planId: 'plan-dawn',
      city: '厦门',
      startDate: '2026-08-01',
      days: 1,
      pace: 'tight',
      smartPlanning: false,
      selectedItems: [item('dawn-required', poi('dawn'), { required: true })],
      candidateItems: [],
      hotels: [],
      evidenceConstraints: [{
        itemId: 'dawn-required',
        date: '2026-08-01',
        startLocal: '05:30',
        endLocal: '07:30',
        timezone: 'Asia/Shanghai',
        timeHint: 'dawn',
        source: 'uploaded_inspiration',
        evidenceRef: 'evidence-dawn',
        quality: 'verified',
      }],
      anchorPool: [],
      builtInFallback: [],
      quotaRatio: 0.6,
    });
    const dawn = result.day_plans[0]!.slots[0]!;
    assert.equal(dawn.start_local, '05:30');
    assert.equal(dawn.end_local, '07:30');
    assert.equal(dawn.origin, 'selected_required');
    assert.equal(result.unresolved_required.length, 0);
  });

  it('moves an undated dawn constraint to the first feasible trip day', () => {
    const result = buildQuickPlan({
      planId: 'plan-undated-dawn',
      city: '厦门',
      startDate: '2026-08-01',
      days: 2,
      pace: 'tight',
      smartPlanning: false,
      firstDayArrivalTime: '12:00',
      selectedItems: [item('dawn-required', poi('dawn'), { required: true })],
      candidateItems: [],
      hotels: [],
      evidenceConstraints: [{
        itemId: 'dawn-required',
        date: null,
        startLocal: null,
        endLocal: null,
        timezone: 'Asia/Shanghai',
        timeHint: 'dawn',
        source: 'uploaded_inspiration',
        evidenceRef: 'evidence-undated-dawn',
        quality: 'high',
      }],
      anchorPool: [],
      builtInFallback: [],
      quotaRatio: 0.6,
    });
    assert.equal(result.day_plans[0]!.slots.some((slot) => slot.poi?.poi_id === 'dawn'), false);
    assert.equal(
      result.day_plans[1]!.slots.find((slot) => slot.poi?.poi_id === 'dawn')?.start_local,
      '05:30',
    );
  });

  it('places a coarse hard-time candidate before ordinary candidates', () => {
    const result = buildQuickPlan({
      planId: 'plan-candidate-night',
      city: '厦门',
      startDate: '2026-08-01',
      days: 1,
      pace: 'tight',
      smartPlanning: true,
      selectedItems: [],
      candidateItems: [
        item('night-candidate', poi('night-candidate'), { timeHint: 'night' }),
        item('ordinary-candidate', poi('ordinary-candidate')),
      ],
      hotels: [],
      evidenceConstraints: [],
      anchorPool: [],
      builtInFallback: [],
      quotaRatio: 0.1,
    });

    const placed = result.day_plans[0]!.slots.find(
      (slot) => slot.poi?.poi_id === 'night-candidate',
    );
    assert.ok(placed);
    assert.ok(placed.start_local >= '19:00');
    assert.equal(
      result.day_plans[0]!.slots.some((slot) => slot.poi?.poi_id === 'ordinary-candidate'),
      false,
    );
  });

  it('does not retry an infeasible coarse hard-time candidate as an ordinary seed', () => {
    const result = buildQuickPlan({
      planId: 'plan-candidate-dawn-conflict',
      city: '厦门',
      startDate: '2026-08-01',
      days: 1,
      pace: 'tight',
      smartPlanning: true,
      firstDayArrivalTime: '12:00',
      selectedItems: [],
      candidateItems: [
        item('dawn-candidate', poi('dawn-candidate'), { timeHint: 'dawn' }),
      ],
      hotels: [],
      evidenceConstraints: [],
      anchorPool: [],
      builtInFallback: [],
      quotaRatio: 1,
    });

    assert.equal(
      result.day_plans[0]!.slots.some((slot) => slot.poi?.poi_id === 'dawn-candidate'),
      false,
    );
    assert.ok(result.warnings.some(
      (warning) =>
        warning.code === 'CANDIDATE_HARD_TIME_CONFLICT' &&
        warning.item_id === 'dawn-candidate',
    ));
    assert.ok(result.candidates.some(
      (candidate) => candidate.item_id === 'dawn-candidate' && candidate.status === 'available',
    ));
  });

  it('uses verified fallback data only and records built-in and hotel-change behavior', () => {
    const result = buildQuickPlan({
      planId: 'plan-3',
      city: '厦门',
      startDate: '2026-08-01',
      days: 2,
      pace: 'comfortable',
      smartPlanning: true,
      selectedItems: [],
      candidateItems: [],
      hotels: [
        { date: '2026-08-01', leaveBlank: false, breakfastIncluded: true, poi: poi('hotel-a') },
        { date: '2026-08-02', leaveBlank: false, breakfastIncluded: false, poi: poi('hotel-b') },
      ],
      luggagePlan: { mode: 'hotel_storage', hotelChangeHelpNeeded: true, notes: null },
      evidenceConstraints: [],
      anchorPool: [],
      builtInFallback: [item('fallback', poi('fallback'), { source: 'built_in' })],
      quotaRatio: 0.6,
    });

    assert.ok(result.warnings.some((warning) => warning.code === 'ANCHOR_FALLBACK_BUILT_IN'));
    assert.ok(
      result.day_plans[1]!.slots.some((slot) => slot.type === 'free' && slot.title === '行李处理'),
    );
    assert.ok(result.day_plans.flatMap((day) => day.slots).some((slot) => slot.poi?.poi_id === 'fallback'));
  });

  it('reserves adjacent base slots for a four-hour place without overlap', () => {
    const result = buildQuickPlan({
      planId: 'plan-long',
      city: '厦门',
      startDate: '2026-08-01',
      days: 1,
      pace: 'tight',
      smartPlanning: false,
      selectedItems: [item('long', poi('long'), { required: true, stayMinutesHint: 151 })],
      candidateItems: [],
      hotels: [],
      evidenceConstraints: [],
      anchorPool: [],
      builtInFallback: [],
      quotaRatio: 0.6,
    });
    const slots = result.day_plans[0]!.slots;
    assert.equal(slots[0]!.start_local, '09:00');
    assert.equal(slots[0]!.end_local, '13:00');
    for (let index = 1; index < slots.length; index += 1) {
      assert.ok(slots[index - 1]!.end_local <= slots[index]!.start_local);
    }
  });

  it('uses normalized visit duration inside a comfortable four-hour grid', () => {
    const makeResult = (stayMinutesHint: number) =>
      buildQuickPlan({
        planId: `plan-duration-${stayMinutesHint}`,
        city: '厦门',
        startDate: '2026-08-01',
        days: 1,
        pace: 'comfortable',
        smartPlanning: false,
        selectedItems: [item('duration', poi('duration'), { required: true, stayMinutesHint })],
        candidateItems: [],
        hotels: [],
        evidenceConstraints: [],
        anchorPool: [],
        builtInFallback: [],
        quotaRatio: 0.6,
      }).day_plans[0]!.slots;

    const shortSlots = makeResult(150);
    assert.deepEqual(
      shortSlots.slice(0, 2).map((slot) => [slot.start_local, slot.end_local, slot.type]),
      [
        ['09:00', '11:00', 'place'],
        ['11:00', '13:00', 'unresolved'],
      ],
    );
    const longSlots = makeResult(151);
    assert.deepEqual(
      [longSlots[0]!.start_local, longSlots[0]!.end_local],
      ['09:00', '13:00'],
    );
    for (const slots of [shortSlots, longSlots]) {
      for (let index = 1; index < slots.length; index += 1) {
        assert.equal(slots[index - 1]!.end_local, slots[index]!.start_local);
      }
    }
  });

  it('fills a split comfortable slot before later time blocks', () => {
    const result = buildQuickPlan({
      planId: 'plan-split-order',
      city: '厦门',
      startDate: '2026-08-01',
      days: 1,
      pace: 'comfortable',
      smartPlanning: true,
      selectedItems: [],
      candidateItems: [
        item('first', poi('first'), { stayMinutesHint: 120 }),
        item('second', poi('second'), { stayMinutesHint: 120 }),
      ],
      hotels: [],
      evidenceConstraints: [],
      anchorPool: [],
      builtInFallback: [],
      quotaRatio: 0.6,
    });
    const placed = result.day_plans[0]!.slots.filter((slot) => slot.origin === 'ai_seed');
    assert.deepEqual(
      placed.map((slot) => [slot.start_local, slot.end_local]),
      [
        ['09:00', '11:00'],
        ['11:00', '13:00'],
      ],
    );
  });

  it('never auto-places an unverified candidate and still falls back when only pending items exist', () => {
    const unverified = { ...poi('unverified'), verified: false, quality: 'low' as const };
    const result = buildQuickPlan({
      planId: 'plan-verified-only',
      city: '厦门',
      startDate: '2026-08-01',
      days: 1,
      pace: 'tight',
      smartPlanning: true,
      selectedItems: [],
      candidateItems: [item('pending', null), item('unverified', unverified)],
      hotels: [],
      evidenceConstraints: [],
      anchorPool: [],
      builtInFallback: [item('fallback', poi('fallback'), { source: 'built_in' })],
      quotaRatio: 0.6,
    });
    const seededPoiIds = result.day_plans[0]!.slots
      .filter((slot) => slot.origin === 'ai_seed')
      .map((slot) => slot.poi?.poi_id);
    assert.deepEqual(seededPoiIds, ['fallback']);
    assert.ok(result.candidates.some((candidate) => candidate.item_id === 'pending' && candidate.status === 'requires_location'));
    assert.ok(result.candidates.some((candidate) => candidate.item_id === 'unverified' && candidate.status === 'available'));
  });

  it('keeps closed and clearly unreachable candidates out of AI seed slots', () => {
    const closedPoi = {
      ...poi('closed'),
      openHours: { closed_dates: ['2026-08-01'] },
    };
    const farPoi = poi('far', 'l1-far', 31.23, 121.47);
    const result = buildQuickPlan({
      planId: 'plan-feasibility',
      city: '厦门',
      startDate: '2026-08-01',
      days: 1,
      pace: 'tight',
      smartPlanning: true,
      selectedItems: [item('anchor', poi('anchor'), { required: true })],
      candidateItems: [
        item('closed', closedPoi),
        item('far', farPoi),
        item('near', poi('near')),
      ],
      hotels: [],
      evidenceConstraints: [],
      anchorPool: [],
      builtInFallback: [],
      quotaRatio: 1,
    });
    const seeded = result.day_plans[0]!.slots
      .filter((slot) => slot.origin === 'ai_seed')
      .map((slot) => slot.poi?.poi_id);
    assert.deepEqual(seeded, ['near']);
    assert.ok(result.warnings.some(
      (warning) => warning.code === 'CANDIDATE_CLOSED' && warning.item_id === 'closed',
    ));
    assert.ok(result.warnings.some(
      (warning) => warning.code === 'CANDIDATE_TOO_FAR' && warning.item_id === 'far',
    ));
    assert.ok(result.warnings.some(
      (warning) => warning.code === 'OPEN_HOURS_UNKNOWN' && warning.item_id === 'near',
    ));
  });

  it('keeps verified candidates without coordinates out of AI seed slots', () => {
    const missingCoordinates = {
      ...poi('missing-coordinates'),
      latitude: null,
      longitude: null,
    };
    const result = buildQuickPlan({
      planId: 'plan-location-required',
      city: '厦门',
      startDate: '2026-08-01',
      days: 1,
      pace: 'tight',
      smartPlanning: true,
      selectedItems: [],
      candidateItems: [item('missing-coordinates', missingCoordinates)],
      hotels: [],
      evidenceConstraints: [],
      anchorPool: [],
      builtInFallback: [],
      quotaRatio: 1,
    });

    assert.equal(
      result.day_plans[0]!.slots.some((slot) => slot.poi?.poi_id === 'missing-coordinates'),
      false,
    );
    assert.ok(result.warnings.some(
      (warning) =>
        warning.code === 'CANDIDATE_LOCATION_UNKNOWN' &&
        warning.item_id === 'missing-coordinates',
    ));
  });
});
