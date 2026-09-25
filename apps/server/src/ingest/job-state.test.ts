import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initialSnapshot, advanceSnapshot, retrySnapshot } from './job-state.js';
test('committed snapshots carry monotonic versions and cannot regress within an attempt', () => {
  const first = initialSnapshot('ing_job');
  const parsing = advanceSnapshot(first, { state: 'parsing', fetched_count: 2 }, 1);
  assert.equal(parsing.state_version, first.state_version + 1);
  assert.throws(() => advanceSnapshot(parsing, { state: 'fetching' }, 1));
  assert.throws(() => advanceSnapshot(parsing, { state: 'done' }, 0));
});
test('failure is terminal and done requires a real persisted result', () => {
  const failed = advanceSnapshot(initialSnapshot('ing_job'), { state: 'failed', retriable: true, error_code: 'INGEST_FETCH_FAILED' }, 1);
  assert.throws(() => advanceSnapshot(failed, { state: 'done' }, 1));
  assert.throws(() => advanceSnapshot(initialSnapshot('ing_job'), { state: 'done', stored_count: 1 }, 1));
  assert.equal(failed.actions.retry, true); assert.equal(failed.actions.view, false);
});
test('retry admission is server-owned and retains previously committed partial data', () => {
  const failed = { ...initialSnapshot('ing_job'), state: 'failed' as const, retriable: true, partial: true,
    result: { inspiration_id: 'result', locate_status: 'pending' as const, asset_count: 2, city_name: null }, stored_count: 1 };
  const retry = retrySnapshot(failed, 1, failed.state_version);
  assert.equal(retry.attempt, 2); assert.equal(retry.result?.asset_count, 2);
  assert.equal(advanceSnapshot(retry, { state: 'failed', retriable: true }, 2).result?.inspiration_id, 'result');
  assert.throws(() => retrySnapshot(failed, 0, failed.state_version));
  assert.throws(() => retrySnapshot({ ...failed, retriable: false }, 1, failed.state_version));
  assert.throws(() => retrySnapshot(initialSnapshot('ing_job'), 1, 0));
});

test('canonical diagnostics are committed as facts and cleared outside parsing; legacy values are not new writes', () => {
  const base = initialSnapshot('ing_diag');
  const next = advanceSnapshot(base, { state: 'parsing', sub_stage: 'speech_detect' }, 1);
  assert.equal(next.sub_stage, 'speech_detect');
  assert.equal(advanceSnapshot(next, { state: 'storing' }, 1).sub_stage, null);
  for (const value of ['text', 'ocr', 'vision', 'private-provider-label']) {
    assert.throws(() => advanceSnapshot(base, { state: 'parsing', sub_stage: value } as any, 1), /INGEST_FACT_INVALID/);
  }
});
