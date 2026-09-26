import { expect, it } from 'vitest';
import { dockAnnouncement } from './HomeImportDock';
import type { DockEntry, Snapshot } from './dock-model';

it('announces distinct unnamed completions across batches without announcing changing image counts', () => {
  const snapshot: Snapshot = { ingest_id: 'job', state: 'done', attempt: 1, state_version: 4, source_title: null, partial: false, retriable: false,
    result: { inspiration_id: 'result', asset_count: 3, locate_status: 'pending', city_name: null }, actions: { retry: false, view: true }, updated_at: '2026-09-19T00:00:00Z' };
  const entry: DockEntry = { id: 'a', batchId: 'batch-a', position: 1, total: 1, url: '', acceptance: 'accepted', jobId: 'job', snapshot, connectionLost: false, eligibleCompletion: true };
  const completion = { key: 'job:1', jobId: 'job', entryId: 'a', snapshot, remainingMs: 10000 };
  const first = dockAnnouncement(entry, completion, 1);
  const second = dockAnnouncement({ ...entry, id: 'b', batchId: 'batch-b' }, { ...completion, key: 'second:1' }, 2);
  expect(second).not.toBe(first);
  expect(second).toContain('第2批'); expect(second).toContain('第1条，共1条');
  expect(dockAnnouncement({ ...entry, snapshot: { ...snapshot, fetched_count: 900 } }, completion, 1)).toBe(first);
});

it('describes reused running, completed and failed sources without inventing a new completion', () => {
  const base: Snapshot = { ingest_id: 'job', state: 'fetching', attempt: 1, state_version: 1, source_title: null,
    partial: false, retriable: false, result: null, actions: { retry: false, view: false }, updated_at: '2026-09-19T00:00:00Z' };
  const entry: DockEntry = { id: 'a', batchId: 'batch-a', position: 1, total: 1, url: '', acceptance: 'accepted',
    disposition: 'reused', jobId: 'job', snapshot: base, connectionLost: false, eligibleCompletion: false };
  expect(dockAnnouncement(entry, null, 1)).toContain('原导入任务仍在处理');
  expect(dockAnnouncement({ ...entry, snapshot: { ...base, state: 'done', result: { inspiration_id: 'result', asset_count: 1,
    locate_status: 'pending', city_name: null }, actions: { retry: false, view: true } } }, null, 1)).toContain('已在灵感库，沿用原结果');
  expect(dockAnnouncement({ ...entry, snapshot: { ...base, state: 'failed', retriable: true,
    actions: { retry: true, view: false } } }, null, 1)).toContain('原导入未完成，可沿原任务重试');
});
