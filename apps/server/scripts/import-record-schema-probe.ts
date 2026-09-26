import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { Prisma, PrismaClient } from '@prisma/client';
import { normalizeImportSourceUrl } from '../src/ingest/url-normalization-policy.js';
import { normalizeXhsUrl } from '../src/ingest/link-parser.js';
import { loadImportUrlKeyring, openImportOriginalUrl, sealImportOriginalUrl, type ProtectedImportUrl } from '../src/ingest/import-url-protection.js';
import { appendSnapshotEvent } from '../src/ingest/event-log.js';
import { acceptIngestCommand, readIngestCommand } from '../src/ingest/store.js';
import { advanceSnapshot, initialSnapshot } from '../src/ingest/job-state.js';
import { assertImportRecordSchema } from '../src/ingest/import-record-schema.js';
import { getImportRecordDetail, listImportRecords } from '../src/ingest/import-record-read.js';
import { AuthFault } from '../src/auth/errors.js';

const connection = process.env.DATABASE_URL;
assert.equal(process.env.AUTH_TEST_DATABASE_ACK, 'isolated-synthetic-only');
assert.ok(connection, 'isolated database required');
const target = new URL(connection);
assert.ok(['localhost', '127.0.0.1'].includes(target.hostname));
assert.match(target.pathname, /^\/nomad_auth_test_[a-z0-9_]+$/u);

const db = new PrismaClient();
const ownerA = randomUUID(), ownerB = randomUUID();
const keyring = { activeKeyId: 'synthetic-ci', keys: new Map([['synthetic-ci', randomBytes(32)]]) };
process.env.IMPORT_URL_KEYRING_JSON = JSON.stringify({ activeKeyId: keyring.activeKeyId,
  keys: { [keyring.activeKeyId]: keyring.keys.get(keyring.activeKeyId)!.toString('base64') } });
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
      normalizedUrl, activeNormalizedUrl: normalizedUrl, normalizationVersion: decision.policyVersion,
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
    activeNormalizedUrl: `${decision.normalizedUrl}?other=1`,
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

  const stem = `https://www.xiaohongshu.com/explore/${randomUUID()}`;
  const rawA = `${stem}?x=1&utm_source=alpha#original`;
  const rawB = `${stem.replace('www.', '')}?utm_source=beta&x=1`;
  const input = (originalSourceUrl: string, userId = ownerA) => ({ userId, originalSourceUrl,
    sourceUrl: normalizeXhsUrl(originalSourceUrl), traceId: randomUUID(), operationId: randomUUID(), enqueue: false });
  const firstInput = input(rawA), secondInput = input(rawB);
  const accepted = await Promise.all([acceptIngestCommand(firstInput), acceptIngestCommand(secondInput)]);
  assert.equal(accepted.filter((item) => item.disposition === 'created').length, 1);
  assert.equal(accepted.filter((item) => item.disposition === 'reused').length, 1);
  assert.equal(accepted[0]!.job.id, accepted[1]!.job.id);
  assert.equal(accepted.filter((item) => item.shouldRun).length, 1);
  checks.push('actual-acceptance-deduplicates-canonical-variants-across-two-operations');

  const acceptedJobId = accepted[0]!.job.dbId;
  const actual = await db.importRecord.findFirstOrThrow({ where: { userId: ownerA, jobId: acceptedJobId } });
  assert.equal(actual.normalizedUrl, normalizeImportSourceUrl(rawA).normalizedUrl);
  assert.equal(actual.activeNormalizedUrl, actual.normalizedUrl);
  assert.equal(actual.deletedAt, null);
  assert.equal(actual.normalizationVersion, decision.policyVersion);
  assert.equal(actual.sourceTitle, null);
  assert.ok(!JSON.stringify(actual.originalUrlProtected).includes('utm_source'));
  const opened = openImportOriginalUrl(actual.originalUrlProtected as unknown as ProtectedImportUrl,
    { ownerId: ownerA, recordId: actual.id }, loadImportUrlKeyring(process.env));
  assert.ok([rawA, rawB].includes(opened));
  assert.equal((await db.ingestJob.findUniqueOrThrow({ where: { id: acceptedJobId } })).sourceUrl, null);
  assert.equal((await db.ingestJob.findUniqueOrThrow({ where: { id: acceptedJobId } })).deletedAt, null);
  assert.equal(await db.ingestEventRecord.count({ where: { jobId: acceptedJobId } }), 1);
  assert.equal(await db.ingestCommand.count({ where: { jobId: acceptedJobId } }), 2);
  checks.push('actual-acceptance-atomically-commits-sealed-original-record-job-event-and-command');

  await assert.rejects(db.importRecord.update({
    where: { id: actual.id }, data: { activeNormalizedUrl: decision.normalizedUrl },
  }));
  assert.equal((await db.importRecord.findUniqueOrThrow({ where: { id: actual.id } })).activeNormalizedUrl, actual.normalizedUrl);
  checks.push('staged-active-normalized-url-must-match-immutable-identity');

  const priorKeyring = process.env.IMPORT_URL_KEYRING_JSON;
  delete process.env.IMPORT_URL_KEYRING_JSON;
  try {
    const replay = await acceptIngestCommand(firstInput);
    assert.equal(replay.disposition, accepted[0]!.disposition);
    assert.equal(replay.shouldRun, false);
    assert.equal(replay.job.id, accepted[0]!.job.id);
    assert.equal((await readIngestCommand(ownerA, firstInput.operationId)).ingest_id, replay.job.id);
    const missing = input(`https://www.xiaohongshu.com/explore/${randomUUID()}`);
    await assert.rejects(acceptIngestCommand(missing), (error: unknown) => error instanceof AuthFault && error.code === 'INGEST_URL_PROTECTION_UNAVAILABLE');
    assert.equal(await db.ingestCommand.count({ where: { userId: ownerA, operationId: missing.operationId } }), 0);
  } finally { process.env.IMPORT_URL_KEYRING_JSON = priorKeyring; }
  checks.push('committed-operation-replays-without-key-and-new-write-fails-closed');

  const other = await acceptIngestCommand(input(rawA, ownerB));
  assert.equal(other.disposition, 'created');
  assert.notEqual(other.job.id, accepted[0]!.job.id);
  assert.equal(await db.importRecord.count({ where: { normalizedUrl: actual.normalizedUrl } }), 2);
  checks.push('actual-acceptance-keeps-identical-url-owner-records-separate');

  const beforeReads = { jobs: await db.ingestJob.count(), commands: await db.ingestCommand.count(), events: await db.ingestEventRecord.count() };
  const list = await listImportRecords(ownerA);
  assert.ok(list.items.some((item) => item.id === actual.id));
  assert.ok(!JSON.stringify(list).includes(rawA) && !JSON.stringify(list).includes(rawB));
  assert.ok(list.items.every((item) => !('original_url' in item)));
  const detail = await getImportRecordDetail(ownerA, actual.id);
  assert.equal(detail.original_url, opened);
  await assert.rejects(getImportRecordDetail(ownerB, actual.id),
    (error: unknown) => error instanceof AuthFault && error.code === 'LIBRARY_IMPORT_RECORD_NOT_FOUND');
  await assert.rejects(getImportRecordDetail(ownerA, randomUUID()),
    (error: unknown) => error instanceof AuthFault && error.code === 'LIBRARY_IMPORT_RECORD_NOT_FOUND');
  checks.push('owner-only-detail-decrypts-while-list-excludes-original-and-foreign-identity');

  const page1 = await listImportRecords(ownerA, { limit: '1' });
  assert.equal(page1.items.length, 1);
  assert.ok(page1.next_cursor);
  const page2 = await listImportRecords(ownerA, { limit: '1', cursor: page1.next_cursor! });
  assert.equal(page2.items.length, 1);
  assert.notEqual(page1.items[0]!.id, page2.items[0]!.id);
  await assert.rejects(listImportRecords(ownerA, { cursor: 'invalid' }),
    (error: unknown) => error instanceof AuthFault && error.code === 'LIBRARY_CURSOR_INVALID');
  const afterReads = { jobs: await db.ingestJob.count(), commands: await db.ingestCommand.count(), events: await db.ingestEventRecord.count() };
  assert.deepEqual(afterReads, beforeReads);
  checks.push('keyset-list-and-detail-reads-do-not-create-job-command-or-event');

  const legacyRaw = `https://xhslink.com/${randomUUID()}#copied`;
  const legacyUrl = normalizeXhsUrl(legacyRaw), legacyJobId = randomUUID(), legacyOperationId = randomUUID();
  await db.ingestJob.create({ data: { id: legacyJobId, userId: ownerA, authVersion: 0, sourceType: 'xhs', sourceUrl: legacyUrl,
    sourceHash: createHash('sha256').update(`${ownerA}:${legacyUrl}`).digest('hex'), traceId: randomUUID(),
    snapshotJson: initialSnapshot(`ing_${legacyJobId}`) as Prisma.InputJsonValue } });
  await db.ingestCommand.create({ data: { userId: ownerA, operationId: legacyOperationId, kind: 'start',
    requestHash: createHash('sha256').update(JSON.stringify(['start', legacyUrl])).digest('hex'),
    jobId: legacyJobId, attempt: 1, disposition: 'created' } });
  const legacyReplay = await acceptIngestCommand({ userId: ownerA, originalSourceUrl: legacyRaw,
    sourceUrl: legacyUrl, traceId: randomUUID(), operationId: legacyOperationId, enqueue: false });
  assert.equal(legacyReplay.job.dbId, legacyJobId);
  assert.equal(legacyReplay.shouldRun, false);
  assert.equal(await db.importRecord.count({ where: { jobId: legacyJobId } }), 0);
  checks.push('pre-upgrade-command-replays-from-legacy-normalized-hash-without-backfill');

  const unsupported = `https://example.invalid/retained/${randomUUID()}`;
  const unsupportedJobId = randomUUID(), unsupportedResultId = randomUUID();
  await db.ingestJob.create({ data: { id: unsupportedJobId, userId: ownerA, authVersion: 0, sourceType: 'xhs',
    sourceUrl: unsupported, sourceHash: createHash('sha256').update(`${ownerA}:${unsupported}`).digest('hex'), status: 'done' } });
  await db.inspiration.create({ data: { id: unsupportedResultId, userId: ownerA, jobId: unsupportedJobId,
    sourceHash: createHash('sha256').update(randomUUID()).digest('hex'), tags: [], title: 'Synthetic retained result' } });
  const retained = await acceptIngestCommand({ userId: ownerA, sourceUrl: unsupported,
    traceId: randomUUID(), operationId: randomUUID(), enqueue: false });
  assert.equal(retained.disposition, 'reused');
  assert.equal(retained.job.dbId, unsupportedJobId);
  assert.equal(retained.job.snapshot?.result?.inspiration_id, unsupportedResultId);
  assert.equal(await db.importRecord.count({ where: { jobId: unsupportedJobId } }), 0);
  checks.push('unsupported-pre-upgrade-source-recovers-owned-job-and-result-before-new-policy');

  // Simulate a unique-index rejection after the pre-insert lookup.
  // A sequence survives the losing transaction's rollback, so only the first
  // INSERT raises a genuine PostgreSQL 23505 and the fresh attempt can proceed.
  await db.$executeRawUnsafe('CREATE SEQUENCE "ImportRecord_probe_unique_once"');
  await db.$executeRawUnsafe(`CREATE FUNCTION "ImportRecord_probe_unique_once"() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF nextval('"ImportRecord_probe_unique_once"') = 1 THEN
        RAISE EXCEPTION 'synthetic unique race' USING ERRCODE = '23505', CONSTRAINT = 'ImportRecord_userId_normalized_url_key';
      END IF;
      RETURN NEW;
    END $$`);
  await db.$executeRawUnsafe('CREATE TRIGGER "ImportRecord_probe_unique_once" BEFORE INSERT ON "ImportRecord" FOR EACH ROW EXECUTE FUNCTION "ImportRecord_probe_unique_once"()');
  try {
    const raced = input(`https://www.xiaohongshu.com/explore/${randomUUID()}`);
    const acceptedAfterRetry = await acceptIngestCommand(raced);
    assert.equal(acceptedAfterRetry.disposition, 'created');
    assert.equal(await db.ingestJob.count({ where: { id: acceptedAfterRetry.job.dbId, userId: ownerA } }), 1);
    assert.equal(await db.importRecord.count({ where: { jobId: acceptedAfterRetry.job.dbId, userId: ownerA } }), 1);
    assert.equal(await db.ingestCommand.count({ where: { userId: ownerA, operationId: raced.operationId } }), 1);
    assert.equal(await db.ingestEventRecord.count({ where: { jobId: acceptedAfterRetry.job.dbId } }), 1);
    checks.push('unique-constraint-abort-retries-in-fresh-transaction-with-one-committed-job-record-event-and-command');
  } finally {
    await db.$executeRawUnsafe('DROP TRIGGER "ImportRecord_probe_unique_once" ON "ImportRecord"');
    await db.$executeRawUnsafe('DROP FUNCTION "ImportRecord_probe_unique_once"()');
    await db.$executeRawUnsafe('DROP SEQUENCE "ImportRecord_probe_unique_once"');
  }
} finally {
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify({ kind: 'story-1-8-isolated-postgresql-schema-probe',
    headSha: process.env.GITHUB_SHA || null, checks, completed: checks.length === 18,
    realProviderCalls: 0, databaseScope: 'guarded-isolated-synthetic-only' }, null, 2) + '\n');
  await db.$disconnect();
}

assert.equal(checks.length, 18);
