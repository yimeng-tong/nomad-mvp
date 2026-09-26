import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { Prisma, PrismaClient } from '@prisma/client';
import { normalizeImportSourceUrl } from '../src/ingest/url-normalization-policy.js';
import { sealImportOriginalUrl } from '../src/ingest/import-url-protection.js';
import { appendSnapshotEvent } from '../src/ingest/event-log.js';
import { advanceSnapshot, initialSnapshot } from '../src/ingest/job-state.js';
import { assertImportRecordSchema } from '../src/ingest/import-record-schema.js';

const connection = process.env.DATABASE_URL;
assert.equal(process.env.AUTH_TEST_DATABASE_ACK, 'isolated-synthetic-only');
assert.ok(connection, 'isolated database required');
const target = new URL(connection);
assert.ok(['localhost', '127.0.0.1'].includes(target.hostname));
assert.match(target.pathname, /^\/nomad_auth_test_[a-z0-9_]+$/u);

const db = new PrismaClient();
const ownerA = randomUUID(), ownerB = randomUUID();
const keyring = { activeKeyId: 'synthetic-ci', keys: new Map([['synthetic-ci', randomBytes(32)]]) };
const originalUrl = 'https://xhslink.com/synthetic-schema-probe';
const decision = normalizeImportSourceUrl(originalUrl);
const checks: string[] = [];
const reportPath = process.env.NOMAD_IMPORT_RECORD_REPORT || '/tmp/nomad-import-record-schema-probe.json';

async function createRecord(ownerId: string, normalizedUrl: string) {
  const jobId = randomUUID(), recordId = randomUUID();
  const protectedUrl = sealImportOriginalUrl({ ownerId, recordId, originalUrl }, keyring);
  await db.$transaction(async (tx) => {
    await tx.ingestJob.create({ data: { id: jobId, userId: ownerId, authVersion: 0, sourceType: 'xhs',
      sourceHash: createHash('sha256').update(`${ownerId}:${jobId}`).digest('hex'), sourceUrl: null } });
    await tx.importRecord.create({ data: { id: recordId, userId: ownerId, jobId,
      normalizedUrl, normalizationVersion: decision.policyVersion,
      originalUrlProtected: protectedUrl as unknown as Prisma.InputJsonValue } });
  });
  return { jobId, recordId };
}

function expectPrismaCode(result: PromiseSettledResult<unknown>, code: string) {
  assert.equal(result.status, 'rejected');
  if (result.status === 'rejected') {
    assert.ok(result.reason instanceof Prisma.PrismaClientKnownRequestError);
    assert.equal(result.reason.code, code);
  }
}

try {
  await assertImportRecordSchema(db);
  checks.push('runtime-schema-preflight-validates-owner-and-protected-url-guards');
  await db.user.createMany({ data: [{ id: ownerA, authState: 'active' }, { id: ownerB, authState: 'active' }] });
  const competitors = await Promise.allSettled([createRecord(ownerA, decision.normalizedUrl), createRecord(ownerA, decision.normalizedUrl)]);
  assert.equal(competitors.filter((item) => item.status === 'fulfilled').length, 1);
  expectPrismaCode(competitors.find((item) => item.status === 'rejected')!, 'P2002');
  assert.equal(await db.importRecord.count({ where: { userId: ownerA, normalizedUrl: decision.normalizedUrl } }), 1);
  assert.equal(await db.ingestJob.count({ where: { userId: ownerA } }), 1);
  checks.push('concurrent-owner-normalized-url-unique-and-losing-job-rolled-back');

  await createRecord(ownerB, decision.normalizedUrl);
  assert.equal(await db.importRecord.count({ where: { normalizedUrl: decision.normalizedUrl } }), 2);
  checks.push('same-url-independent-record-for-second-owner');

  const fulfilled = competitors.find((item) => item.status === 'fulfilled');
  assert.ok(fulfilled && fulfilled.status === 'fulfilled');
  const winner = fulfilled.value;
  const wrongOwnerRecordId = randomUUID();
  const wrongOwnerRecord = await Promise.allSettled([db.importRecord.create({ data: {
    id: wrongOwnerRecordId, userId: ownerB, jobId: winner.jobId,
    normalizedUrl: `${decision.normalizedUrl}?other=1`, normalizationVersion: decision.policyVersion,
    originalUrlProtected: sealImportOriginalUrl({ ownerId: ownerB, recordId: wrongOwnerRecordId, originalUrl }, keyring) as unknown as Prisma.InputJsonValue,
  } })]);
  expectPrismaCode(wrongOwnerRecord[0]!, 'P2003');
  checks.push('record-job-composite-owner-foreign-key');

  const wrongOwnerInspiration = await Promise.allSettled([db.inspiration.create({ data: {
    id: randomUUID(), userId: ownerB, importRecordId: winner.recordId,
    sourceHash: createHash('sha256').update(randomUUID()).digest('hex'), tags: [],
  } })]);
  expectPrismaCode(wrongOwnerInspiration[0]!, 'P2003');
  checks.push('inspiration-record-composite-owner-foreign-key');

  const own = await db.importRecord.findFirstOrThrow({ where: { id: winner.recordId, userId: ownerA } });
  assert.equal(own.status, 'created');
  assert.equal(own.sourceTitle, null);
  assert.ok(!JSON.stringify(own.originalUrlProtected).includes(originalUrl));
  checks.push('accepted-record-status-pending-title-and-sealed-original');

  const first = await db.$transaction(async (tx) => appendSnapshotEvent(tx,
    await tx.ingestJob.findFirstOrThrow({ where: { id: winner.jobId, userId: ownerA } }),
    initialSnapshot(`ing_${winner.jobId}`)));
  const next = advanceSnapshot(first.event.snapshot, { state: 'fetching', source_title: 'Synthetic title' }, 1);
  await db.$transaction(async (tx) => appendSnapshotEvent(tx,
    await tx.ingestJob.findFirstOrThrow({ where: { id: winner.jobId, userId: ownerA } }), next));
  const materialized = await db.importRecord.findFirstOrThrow({ where: { id: winner.recordId, userId: ownerA } });
  assert.equal(materialized.status, 'fetching');
  assert.equal(materialized.sourceTitle, 'Synthetic title');
  assert.equal((await db.ingestJob.findUniqueOrThrow({ where: { id: winner.jobId } })).status, 'fetching');
  assert.equal(await db.ingestEventRecord.count({ where: { jobId: winner.jobId } }), 2);
  checks.push('record-status-and-title-advance-with-job-and-event-in-one-transaction');

  const inspirationId = randomUUID();
  await db.inspiration.create({ data: { id: inspirationId, userId: ownerA, jobId: winner.jobId,
    sourceHash: createHash('sha256').update(randomUUID()).digest('hex'), tags: [], title: 'Synthetic title' } });
  const storing = advanceSnapshot(next, { state: 'storing', result: {
    inspiration_id: inspirationId, locate_status: 'pending', asset_count: 0, city_name: null,
  } }, 1);
  await db.$transaction(async (tx) => appendSnapshotEvent(tx,
    await tx.ingestJob.findFirstOrThrow({ where: { id: winner.jobId, userId: ownerA } }), storing));
  assert.equal((await db.inspiration.findUniqueOrThrow({ where: { id: inspirationId } })).importRecordId, winner.recordId);
  checks.push('committed-inspiration-attaches-to-the-same-owner-record');
} finally {
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify({ kind: 'story-1-8-isolated-postgresql-schema-probe',
    headSha: process.env.GITHUB_SHA || null, checks, completed: checks.length === 8,
    realProviderCalls: 0, databaseScope: 'guarded-isolated-synthetic-only' }, null, 2) + '\n');
  await db.$disconnect();
}

assert.equal(checks.length, 8);
