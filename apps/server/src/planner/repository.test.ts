import assert from 'node:assert/strict';
import test from 'node:test';
import { PlannerExecutionLeaseLost, PlannerRepositoryConflict } from './repository.js';
import { InMemoryPlannerRepository } from './testing/memory-repository.js';

const USER_A = '00000000-0000-4000-8000-000000000201';
const USER_B = '00000000-0000-4000-8000-000000000202';

test('createOrGetJob is atomic per user and request hash', async () => {
  const repository = new InMemoryPlannerRepository();
  const request = { city: '厦门', start_date: '2026-07-02', days: 2, pace: 'comfortable' as const };

  const [first, second] = await Promise.all([
    repository.createOrGetJob({ userId: USER_A, requestHash: 'same', request, traceId: 'trace-a' }),
    repository.createOrGetJob({ userId: USER_A, requestHash: 'same', request, traceId: 'trace-b' }),
  ]);

  assert.equal(first.job.id, second.job.id);
  assert.equal([first.created, second.created].filter(Boolean).length, 1);

  const otherUser = await repository.createOrGetJob({
    userId: USER_B,
    requestHash: 'same',
    request,
    traceId: 'trace-c',
  });
  assert.notEqual(otherUser.job.id, first.job.id);
});

test('a retriable failed Quick job is atomically reclaimed with cleared events', async () => {
  const repository = new InMemoryPlannerRepository();
  const request = { city: '厦门', start_date: '2026-07-02', days: 1, pace: 'tight' as const };
  const first = await repository.createOrGetJob({
    userId: USER_A,
    requestHash: 'retry-quick',
    request,
    traceId: 'trace-first',
  });
  await repository.appendJobEvent(first.job.id, first.job.attempt, {
    trace_id: 'trace-first',
    plan_id: first.job.planId,
    plan_job_id: first.job.id,
    phase: 'failed',
    error_code: 'PLAN_GENERATION_FAILED',
    retriable: true,
    ts: 1,
  });

  const retry = await repository.createOrGetJob({
    userId: USER_A,
    requestHash: 'retry-quick',
    request,
    traceId: 'trace-retry',
  });
  assert.equal(retry.job.id, first.job.id);
  assert.equal(retry.created, true);
  assert.equal(retry.job.status, 'queued');
  assert.equal(retry.job.attempt, 2);
  assert.equal(retry.job.traceId, 'trace-retry');
  assert.deepEqual(await repository.listJobEvents(first.job.id, USER_A), []);
});

test('a retriable job is not reclaimed when the idempotent request body changed', async () => {
  const repository = new InMemoryPlannerRepository();
  const first = await repository.createOrGetJob({
    userId: USER_A,
    requestHash: 'retry-body-conflict',
    request: { city: '厦门', start_date: '2026-07-02', days: 1, pace: 'tight' },
    traceId: 'trace-first',
  });
  await repository.appendJobEvent(first.job.id, first.job.attempt, {
    trace_id: 'trace-first',
    plan_id: first.job.planId,
    plan_job_id: first.job.id,
    phase: 'failed',
    error_code: 'PLAN_GENERATION_FAILED',
    retriable: true,
    ts: 1,
  });
  const conflict = await repository.createOrGetJob({
    userId: USER_A,
    requestHash: 'retry-body-conflict',
    request: { city: '厦门', start_date: '2026-07-03', days: 2, pace: 'comfortable' },
    traceId: 'trace-conflict',
  });
  assert.equal(conflict.created, false);
  assert.equal(conflict.job.attempt, 1);
  assert.equal(conflict.job.status, 'failed');
  assert.equal(conflict.job.request.start_date, '2026-07-02');
});

test('a reclaimed Quick attempt fences stale event and version writers', async () => {
  const repository = new InMemoryPlannerRepository();
  const request = { city: '厦门', start_date: '2026-07-02', days: 1, pace: 'tight' as const };
  const first = await repository.createOrGetJob({
    userId: USER_A,
    requestHash: 'fenced-quick',
    request,
    traceId: 'trace-first',
  });
  await repository.appendJobEvent(first.job.id, first.job.attempt, {
    trace_id: 'trace-first',
    plan_id: first.job.planId,
    plan_job_id: first.job.id,
    phase: 'failed',
    error_code: 'PLAN_GENERATION_FAILED',
    retriable: true,
    ts: 1,
  });
  const retry = await repository.createOrGetJob({
    userId: USER_A,
    requestHash: 'fenced-quick',
    request,
    traceId: 'trace-retry',
  });
  const payload = {
    city: '厦门',
    start_date: '2026-07-02',
    days: 1,
    pace: 'tight' as const,
    day_plans: [],
    candidates: [],
    warnings: [],
    unresolved_required: [],
  };

  await assert.rejects(
    repository.appendJobEvent(first.job.id, first.job.attempt, {
      trace_id: 'trace-first',
      plan_id: first.job.planId,
      plan_job_id: first.job.id,
      phase: 'done',
      ts: 2,
    }),
    PlannerExecutionLeaseLost,
  );
  await assert.rejects(
    repository.saveQuickVersion(first.job.id, first.job.attempt, payload),
    PlannerExecutionLeaseLost,
  );
  const version = await repository.saveQuickVersion(retry.job.id, retry.job.attempt, payload);
  assert.equal(
    (await repository.saveQuickVersion(retry.job.id, retry.job.attempt, payload)).id,
    version.id,
  );
});

test('a retried HQ attempt fences stale completion and failure writers', async () => {
  const repository = new InMemoryPlannerRepository();
  const created = await repository.createOrGetJob({
    userId: USER_A,
    requestHash: 'fenced-hq-plan',
    request: { city: '厦门', start_date: '2026-07-02', days: 1, pace: 'tight' },
    traceId: 'trace-plan',
  });
  const payload = {
    city: '厦门',
    start_date: '2026-07-02',
    days: 1,
    pace: 'tight' as const,
    day_plans: [],
    candidates: [],
    warnings: [],
    unresolved_required: [],
  };
  const quick = await repository.saveQuickVersion(created.job.id, created.job.attempt, payload);
  const first = await repository.createOrGetHqJob({
    planId: created.job.planId,
    userId: USER_A,
    requestHash: 'fenced-hq',
    baseVersionId: quick.id,
    traceId: 'trace-hq-first',
  });
  await repository.failHqJob(
    first.job.id,
    USER_A,
    first.job.attempt,
    'HQ_PROVIDER_TIMEOUT',
    true,
  );
  const retry = await repository.createOrGetHqJob({
    planId: created.job.planId,
    userId: USER_A,
    requestHash: 'fenced-hq',
    baseVersionId: quick.id,
    traceId: 'trace-hq-retry',
  });
  assert.equal(retry.job.attempt, first.job.attempt + 1);

  await assert.rejects(
    repository.saveHqVersionAndComplete(first.job.id, USER_A, first.job.attempt, payload),
    PlannerExecutionLeaseLost,
  );
  await assert.rejects(
    repository.failHqJob(first.job.id, USER_A, first.job.attempt, 'STALE', true),
    PlannerExecutionLeaseLost,
  );
  const version = await repository.saveHqVersionAndComplete(
    retry.job.id,
    USER_A,
    retry.job.attempt,
    payload,
  );
  assert.equal((await repository.getHqJob(retry.job.id, USER_A))?.versionId, version.id);
});

test('plan ownership and Quick/HQ version adoption stay isolated', async () => {
  const repository = new InMemoryPlannerRepository();
  const created = await repository.createOrGetJob({
    userId: USER_A,
    requestHash: 'versions',
    request: { city: '厦门', start_date: '2026-07-02', days: 1, pace: 'tight' },
    traceId: 'trace-versions',
  });

  const quick = await repository.saveQuickVersion(created.job.id, created.job.attempt, {
    city: '厦门',
    start_date: '2026-07-02',
    days: 1,
    pace: 'tight',
    day_plans: [],
    candidates: [],
    warnings: [],
    unresolved_required: [],
  });
  const hq = await repository.saveHqVersion(created.job.planId, USER_A, quick.payload);
  const hqJob = await repository.createOrGetHqJob({
    planId: created.job.planId,
    userId: USER_A,
    requestHash: quick.id,
    baseVersionId: quick.id,
    traceId: 'trace-hq',
  });
  const duplicateHqJob = await repository.createOrGetHqJob({
    planId: created.job.planId,
    userId: USER_A,
    requestHash: quick.id,
    baseVersionId: quick.id,
    traceId: 'trace-hq',
  });
  assert.equal(duplicateHqJob.job.id, hqJob.job.id);
  assert.equal(duplicateHqJob.created, false);
  await repository.completeHqJob(hqJob.job.id, USER_A, hqJob.job.attempt, hq.id);
  assert.equal((await repository.getHqJob(hqJob.job.id, USER_A))?.versionId, hq.id);
  assert.equal(await repository.getHqJob(hqJob.job.id, USER_B), null);

  assert.equal(await repository.getPlan(created.job.planId, USER_B), null);

  const before = await repository.getPlan(created.job.planId, USER_A);
  assert.equal(before?.currentVersionId, quick.id);
  assert.equal(before?.versions.length, 2);

  const adopted = await repository.adoptHqVersion({
    planId: created.job.planId,
    hqVersionId: hq.id,
    baseVersionId: quick.id,
    userId: USER_A,
    expectedPlanRev: 1,
  });
  assert.equal(adopted.planRev, 2);
  assert.equal(adopted.currentVersionId, hq.id);
});

test('job events replay in order only to the owning user', async () => {
  const repository = new InMemoryPlannerRepository();
  const created = await repository.createOrGetJob({
    userId: USER_A,
    requestHash: 'events',
    request: { city: '厦门', start_date: '2026-07-02', days: 1, pace: 'tight' },
    traceId: 'trace-events',
  });

  for (const [index, phase] of (['started', 'freeze', 'selected_anchor'] as const).entries()) {
    await repository.appendJobEvent(created.job.id, created.job.attempt, {
      trace_id: 'trace-events',
      plan_id: created.job.planId,
      plan_job_id: created.job.id,
      phase,
      ts: index + 1,
    });
  }

  const replay = await repository.listJobEvents(created.job.id, USER_A, 1);
  assert.deepEqual(replay.map((event) => event.phase), ['freeze', 'selected_anchor']);
  assert.deepEqual(await repository.listJobEvents(created.job.id, USER_B), []);
});

test('current plan mutations create a new version and reject stale revisions', async () => {
  const repository = new InMemoryPlannerRepository();
  const created = await repository.createOrGetJob({
    userId: USER_A,
    requestHash: 'mutation',
    request: { city: '厦门', start_date: '2026-07-02', days: 1, pace: 'tight' },
    traceId: 'trace-mutation',
  });
  const quick = await repository.saveQuickVersion(created.job.id, created.job.attempt, {
    city: '厦门',
    start_date: '2026-07-02',
    days: 1,
    pace: 'tight',
    day_plans: [],
    candidates: [],
    warnings: [],
    unresolved_required: [],
  });

  const changed = await repository.updateCurrentVersion({
    planId: created.job.planId,
    userId: USER_A,
    expectedPlanRev: 1,
    mutate: (payload) => ({ ...payload, warnings: [{ code: 'CHANGED', severity: 'soft', message: 'changed' }] }),
  });
  assert.equal(changed.planRev, 2);
  assert.notEqual(changed.version.id, quick.id);

  await assert.rejects(
    repository.updateCurrentVersion({
      planId: created.job.planId,
      userId: USER_A,
      expectedPlanRev: 1,
      mutate: (payload) => payload,
    }),
    PlannerRepositoryConflict,
  );
});
