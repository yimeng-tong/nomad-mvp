import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PlannerVersionPayload } from './repository.js';
import {
  applySlotEdit,
  PlannerEditError,
  type PlannerSlotEditRequest,
} from './edit.js';

const poi = (id: string, name = id) => ({
  poi_id: id,
  amap_id: `amap-${id}`,
  name,
  address: `${name}路`,
  latitude: 24.48,
  longitude: 118.08,
  verified: true,
  quality: 'verified' as const,
  source_attribution: '测试来源',
});

function payload(): PlannerVersionPayload {
  return {
    city: '厦门',
    start_date: '2026-08-01',
    days: 2,
    pace: 'tight',
    day_plans: [
      {
        day_index: 0,
        date: '2026-08-01',
        slots: [
          {
            slot_id: 'slot-a',
            day_index: 0,
            slot_index: 0,
            start_local: '09:00',
            end_local: '11:00',
            type: 'place',
            origin: 'ai_seed',
            title: '鼓浪屿',
            poi: poi('poi-a', '鼓浪屿'),
            inspiration_id: 'inspiration-a',
            constraint: null,
            warning_codes: [],
          },
          {
            slot_id: 'slot-b',
            day_index: 0,
            slot_index: 1,
            start_local: '11:00',
            end_local: '13:00',
            type: 'unresolved',
            origin: 'free',
            title: null,
            poi: null,
            inspiration_id: null,
            constraint: null,
            warning_codes: [],
          },
        ],
        hotel: {
          date: '2026-08-01',
          leave_blank: true,
          breakfast_included: false,
          poi: null,
        },
      },
      {
        day_index: 1,
        date: '2026-08-02',
        slots: [
          {
            slot_id: 'slot-c',
            day_index: 1,
            slot_index: 0,
            start_local: '09:00',
            end_local: '11:00',
            type: 'place',
            origin: 'selected_required',
            title: '植物园',
            poi: poi('poi-c', '植物园'),
            inspiration_id: 'inspiration-c',
            constraint: null,
            warning_codes: [],
          },
          {
            slot_id: 'slot-d',
            day_index: 1,
            slot_index: 1,
            start_local: '11:00',
            end_local: '13:00',
            type: 'free',
            origin: 'free',
            title: '自由活动',
            poi: null,
            inspiration_id: null,
            constraint: null,
            warning_codes: [],
          },
        ],
        hotel: {
          date: '2026-08-02',
          leave_blank: true,
          breakfast_included: false,
          poi: null,
        },
      },
    ],
    candidates: [
      {
        candidate_id: 'candidate-b',
        item_id: 'inspiration-b',
        poi: poi('poi-b', '沙坡尾'),
        status: 'available',
        source: 'user_candidate',
        reason: '来自灵感',
        quality: 'verified',
        source_attribution: '测试来源',
      },
    ],
    warnings: [],
    unresolved_required: [],
    seed_undo_token: null,
    seed_undo_expires_at: null,
  };
}

const request = (
  value: Omit<PlannerSlotEditRequest, 'expected_plan_rev' | 'operation_id'>,
): PlannerSlotEditRequest => ({
  ...value,
  expected_plan_rev: 1,
  operation_id: 'operation-123',
} as PlannerSlotEditRequest);

describe('applySlotEdit', () => {
  it('replaces a slot, restores the old POI as a candidate, and converts seed origin to hand', () => {
    const original = payload();
    original.day_plans[0]!.slots[0]!.warning_codes = ['OLD_WARNING'];
    const result = applySlotEdit(
      original,
      'slot-a',
      request({ op: 'replace', candidate_id: 'candidate-b' }),
    );

    assert.equal(result.changedSlot.slot_id, 'slot-a');
    assert.equal(result.changedSlot.poi?.poi_id, 'poi-b');
    assert.equal(result.changedSlot.origin, 'hand');
    assert.equal(result.payload.candidates.find((item) => item.candidate_id === 'candidate-b')?.status, 'used');
    assert.equal(result.payload.candidates.find((item) => item.poi?.poi_id === 'poi-a')?.status, 'available');
    assert.deepEqual(result.changedSlot.warning_codes, []);
    assert.equal(original.day_plans[0]!.slots[0]!.poi?.poi_id, 'poi-a');
  });

  it('moves a block to D+1 by swapping content while preserving both timeline positions', () => {
    const result = applySlotEdit(
      payload(),
      'slot-a',
      request({ op: 'move_day', target_day_index: 1 }),
    );

    assert.equal(result.changedSlot.slot_id, 'slot-c');
    assert.equal(result.changedSlot.day_index, 1);
    assert.equal(result.payload.day_plans[1]!.slots[0]!.slot_id, 'slot-c');
    assert.equal(result.payload.day_plans[1]!.slots[0]!.poi?.poi_id, 'poi-a');
    assert.equal(result.payload.day_plans[1]!.slots[0]!.start_local, '09:00');
    assert.equal(result.payload.day_plans[0]!.slots[0]!.slot_id, 'slot-a');
    assert.equal(result.payload.day_plans[0]!.slots[0]!.poi?.poi_id, 'poi-c');
    assert.equal(result.payload.day_plans[0]!.slots[0]!.day_index, 0);
    assert.equal(result.payload.day_plans[0]!.slots[0]!.origin, 'hand');
    assert.equal(result.payload.day_plans[1]!.slots[0]!.origin, 'hand');
  });

  it('rejects moves outside D1...Dn without changing the input', () => {
    const original = payload();
    assert.throws(
      () => applySlotEdit(original, 'slot-a', request({ op: 'move_day', target_day_index: -1 })),
      (error: unknown) => error instanceof PlannerEditError && error.code === 'PLAN_EDIT_DAY_OUT_OF_RANGE',
    );
    assert.equal(original.day_plans[0]!.slots[0]!.slot_id, 'slot-a');
  });

  it('rejects a move when the adjacent day has no exact matching timeline position', () => {
    const original = payload();
    original.day_plans[1]!.slots = [];
    const before = structuredClone(original);
    assert.throws(
      () => applySlotEdit(
        original,
        'slot-a',
        request({ op: 'move_day', target_day_index: 1 }),
      ),
      (error: unknown) =>
        error instanceof PlannerEditError
        && error.code === 'PLAN_EDIT_TARGET_UNAVAILABLE',
    );
    assert.deepEqual(original, before);
  });

  it('rejects moving either side of an overnight swap beyond the final trip day', () => {
    const sourceOvernight = payload();
    sourceOvernight.day_plans[0]!.slots[0]!.start_local = '23:00';
    sourceOvernight.day_plans[0]!.slots[0]!.end_local = '01:00';
    assert.throws(
      () => applySlotEdit(
        sourceOvernight,
        'slot-a',
        request({ op: 'move_day', target_day_index: 1 }),
      ),
      (error: unknown) =>
        error instanceof PlannerEditError
        && error.code === 'PLAN_EDIT_DAY_OUT_OF_RANGE',
    );

    const targetOvernight = payload();
    targetOvernight.day_plans[0]!.slots[0]!.start_local = '23:00';
    targetOvernight.day_plans[0]!.slots[0]!.end_local = '01:00';
    assert.throws(
      () => applySlotEdit(
        targetOvernight,
        'slot-c',
        request({ op: 'move_day', target_day_index: 0 }),
      ),
      (error: unknown) =>
        error instanceof PlannerEditError
        && error.code === 'PLAN_EDIT_DAY_OUT_OF_RANGE',
    );
  });

  it('accepts 15-minute retiming and an overnight block before the final day', () => {
    const result = applySlotEdit(
      payload(),
      'slot-a',
      request({
        op: 'retime',
        target_day_index: 0,
        start_local: '23:00',
        end_local: '01:00',
      }),
    );

    assert.equal(result.changedSlot.start_local, '23:00');
    assert.equal(result.changedSlot.end_local, '01:00');
    assert.equal(result.changedSlot.origin, 'hand');
  });

  it('rejects off-grid, zero-duration, and final-day overnight retiming', () => {
    const invalid = [
      { target_day_index: 0, start_local: '09:10', end_local: '10:00', code: 'PLAN_EDIT_TIME_INVALID' },
      { target_day_index: 0, start_local: '09:00', end_local: '09:00', code: 'PLAN_EDIT_DURATION_INVALID' },
      { target_day_index: 1, start_local: '23:00', end_local: '01:00', code: 'PLAN_EDIT_DAY_OUT_OF_RANGE' },
    ];
    for (const value of invalid) {
      assert.throws(
        () => applySlotEdit(
          payload(),
          'slot-a',
          request({
            op: 'retime',
            target_day_index: value.target_day_index,
            start_local: value.start_local,
            end_local: value.end_local,
          }),
        ),
        (error: unknown) => error instanceof PlannerEditError && error.code === value.code,
      );
    }
  });

  it('keeps a deleted timeline position unresolved and restores its POI to candidates', () => {
    const result = applySlotEdit(payload(), 'slot-c', request({ op: 'delete' }));

    assert.equal(result.changedSlot.type, 'unresolved');
    assert.equal(result.changedSlot.origin, 'free');
    assert.equal(result.changedSlot.poi, null);
    assert.equal(result.payload.candidates.find((item) => item.poi?.poi_id === 'poi-c')?.status, 'available');
    assert.deepEqual(result.payload.user_excluded_item_ids, ['inspiration-c']);
  });

  it('rejects moving or retiming an evidence-constrained block', () => {
    const constrained = payload();
    constrained.day_plans[0]!.slots[0]!.constraint = {
      item_id: 'inspiration-a',
      poi_id: 'poi-a',
      date: '2026-08-01',
      start_local: '09:00',
      end_local: '11:00',
      timezone: 'Asia/Shanghai',
      time_hint: 'morning',
      source: 'reservation',
      evidence_ref: 'reservation-1',
      source_attribution: '预约凭证',
      quality: 'verified',
    };

    for (const edit of [
      request({ op: 'move_day', target_day_index: 1 }),
      request({ op: 'retime', target_day_index: 0, start_local: '09:15', end_local: '11:15' }),
    ]) {
      assert.throws(
        () => applySlotEdit(constrained, 'slot-a', edit),
        (error: unknown) => error instanceof PlannerEditError && error.code === 'PLAN_EDIT_HARD_CONSTRAINT',
      );
    }
  });

  it('rejects moving across a constrained or hotel target without mutating the input', () => {
    for (const targetType of ['constraint', 'hotel'] as const) {
      const original = payload();
      const target = original.day_plans[1]!.slots[0]!;
      if (targetType === 'hotel') {
        target.type = 'hotel';
        target.origin = 'hotel';
      } else {
        target.constraint = {
          item_id: 'inspiration-c',
          poi_id: 'poi-c',
          date: '2026-08-02',
          start_local: '09:00',
          end_local: '11:00',
          timezone: 'Asia/Shanghai',
          time_hint: 'morning',
          source: 'ticket',
          evidence_ref: 'ticket-c',
          source_attribution: '门票',
          quality: 'verified',
        };
      }
      const before = structuredClone(original);
      assert.throws(
        () => applySlotEdit(original, 'slot-a', request({ op: 'move_day', target_day_index: 1 })),
        (error: unknown) =>
          error instanceof PlannerEditError
          && error.code === (
            targetType === 'hotel'
              ? 'PLAN_EDIT_TARGET_UNAVAILABLE'
              : 'PLAN_EDIT_HARD_CONSTRAINT'
          ),
      );
      assert.deepEqual(original, before);
    }
  });

  it('clears a previous exclusion when the user manually selects that candidate again', () => {
    const original = payload();
    original.user_excluded_item_ids = ['inspiration-b'];
    const result = applySlotEdit(
      original,
      'slot-a',
      request({ op: 'replace', candidate_id: 'candidate-b' }),
    );

    assert.deepEqual(result.payload.user_excluded_item_ids, []);
  });

  it('does not restore a POI candidate while another timeline slot still uses it', () => {
    const original = payload();
    original.day_plans[1]!.slots.push({
      ...structuredClone(original.day_plans[0]!.slots[0]!),
      slot_id: 'slot-duplicate',
      day_index: 1,
      slot_index: 2,
      origin: 'hand',
    });
    const result = applySlotEdit(original, 'slot-a', request({ op: 'delete' }));

    assert.equal(
      result.payload.candidates.some((candidate) => candidate.poi?.poi_id === 'poi-a'),
      false,
    );
  });
});
