import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { PrismaClient, Prisma } from '@prisma/client';
import { appendSnapshotEvent, eventFromRecord } from '../src/ingest/event-log.js';
import { initialSnapshot, advanceSnapshot, type IngestSnapshot } from '../src/ingest/job-state.js';
import { assertIngestSchema } from '../src/ingest/store.js';
import { getPrisma } from '../src/db/prisma.js';
import { AuthFault } from '../src/auth/errors.js';
assert.equal(process.env.AUTH_TEST_DATABASE_ACK,'isolated-synthetic-only');
assert.match(new URL(process.env.DATABASE_URL!).pathname,/^\/nomad_auth_test_[a-z0-9_]+$/);
process.env.AUTH_RUNTIME_MODE='staging';process.env.AUTH_PROVIDER='aliyun-pnvs';
const db=new PrismaClient(),peer=new PrismaClient(),owner=randomUUID(),jobId=randomUUID();
let phase='start'; const checks:string[]=[];
const unavailable=(error:unknown)=>error instanceof AuthFault&&error.code==='INGEST_EVENT_STATE_UNAVAILABLE';
try {
 phase='schema-guard';
 await assertIngestSchema();
 await db.$executeRawUnsafe('ALTER TABLE "IngestEventRecord" DISABLE TRIGGER "IngestEventRecord_no_update"');
 try { await assert.rejects(assertIngestSchema(),error=>error instanceof AuthFault&&error.code==='INGEST_SCHEMA_NOT_READY'); }
 finally { await db.$executeRawUnsafe('ALTER TABLE "IngestEventRecord" ENABLE TRIGGER "IngestEventRecord_no_update"'); }
 checks.push('startup-immutable-guard-required');
 await db.user.create({data:{id:owner,authState:'active'}});
 phase='initial-transaction';
 const first=await db.$transaction(async tx=>{
  const row=await tx.ingestJob.create({data:{id:jobId,userId:owner,authVersion:0,sourceType:'xhs',sourceUrl:'https://xhslink.com/synthetic-event',sourceHash:createHash('sha256').update(jobId).digest('hex'),traceId:randomUUID(),snapshotJson:initialSnapshot(`ing_${jobId}`) as Prisma.InputJsonValue}});
  return appendSnapshotEvent(tx,row,initialSnapshot(`ing_${jobId}`));
 });
 assert.equal(first.row.lastEventSeq,1n); assert.equal(first.event.snapshot.state_version,0);
 assert.equal(await db.ingestEventRecord.count({where:{jobId}}),1); checks.push('initial-event-and-snapshot');
 await assert.rejects(()=>appendSnapshotEvent(db,first.row,advanceSnapshot(first.event.snapshot,{state:'fetching'},1)),unavailable);
 checks.push('global-client-rejected');
 phase='concurrent-cas';
 const next=advanceSnapshot(first.event.snapshot,{state:'fetching'},1);
 const races=await Promise.allSettled([db.$transaction(tx=>appendSnapshotEvent(tx,first.row,next)),peer.$transaction(tx=>appendSnapshotEvent(tx,first.row,next))]);
 assert.equal(races.filter(r=>r.status==='fulfilled').length,1);assert.equal(await db.ingestEventRecord.count({where:{jobId}}),2);
 checks.push('two-client-stale-version-one-winner');
 phase='insert-failure';
 await db.$executeRawUnsafe(`CREATE OR REPLACE FUNCTION probe_ingest_event_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF current_setting('nomad.probe.fail_event',true)='yes' THEN RAISE EXCEPTION 'SYNTHETIC_EVENT_INSERT_FAILURE'; END IF; RETURN NEW; END; $$`);
 await db.$executeRawUnsafe(`CREATE TRIGGER probe_ingest_event_failure BEFORE INSERT ON "IngestEventRecord" FOR EACH ROW EXECUTE FUNCTION probe_ingest_event_failure()`);
 const before=await db.ingestJob.findUniqueOrThrow({where:{id:jobId}});
 try {
  await assert.rejects(()=>db.$transaction(async tx=>{
   await tx.$executeRawUnsafe("SET LOCAL nomad.probe.fail_event='yes'");
   return appendSnapshotEvent(tx,before,advanceSnapshot(before.snapshotJson as unknown as IngestSnapshot,{state:'parsing',sub_stage:'asr'},1));
  }));
  const unchanged=await db.ingestJob.findUniqueOrThrow({where:{id:jobId}});
  assert.equal(unchanged.lastEventSeq,before.lastEventSeq);assert.equal(unchanged.stateVersion,before.stateVersion);assert.deepEqual(unchanged.snapshotJson,before.snapshotJson);
  assert.equal(await db.ingestEventRecord.count({where:{jobId}}),2);
 } finally { await db.$executeRawUnsafe('DROP TRIGGER probe_ingest_event_failure ON "IngestEventRecord"');await db.$executeRawUnsafe('DROP FUNCTION probe_ingest_event_failure()'); }
 checks.push('event-insert-failure-rolls-back-job');
 phase='rollback-after-event';
 await assert.rejects(()=>db.$transaction(async tx=>{await appendSnapshotEvent(tx,before,advanceSnapshot(before.snapshotJson as unknown as IngestSnapshot,{state:'parsing',sub_stage:'asr'},1));throw new Error('synthetic rollback');}));
 assert.equal(await db.ingestEventRecord.count({where:{jobId}}),2);checks.push('post-event-failure-rolls-back-both');
 phase='immutable-and-replay';
 const applied=await db.$transaction(tx=>appendSnapshotEvent(tx,before,advanceSnapshot(before.snapshotJson as unknown as IngestSnapshot,{state:'parsing',sub_stage:'asr'},1)));
 const records=await peer.ingestEventRecord.findMany({where:{jobId},orderBy:{seq:'asc'}});
 assert.deepEqual(records.map(row=>row.seq),[1n,2n,3n]);
 assert.deepEqual(records.map(row=>eventFromRecord(row,applied.row.eventStreamId!).seq),['1','2','3']);
 await assert.rejects(()=>db.ingestEventRecord.update({where:{jobId_seq:{jobId,seq:1n}},data:{kind:'checkpoint'}}));
 assert.equal((await db.ingestEventRecord.findUniqueOrThrow({where:{jobId_seq:{jobId,seq:1n}}})).kind,'fact');
 checks.push('immutable-history-replay-from-second-client');
 phase='owner-qualification';
 await db.user.update({where:{id:owner},data:{authVersion:1}});
 await assert.rejects(()=>db.$transaction(tx=>appendSnapshotEvent(tx,applied.row,advanceSnapshot(applied.event.snapshot,{state:'storing'},1))),error=>error instanceof AuthFault&&error.code==='AUTH_ACCOUNT_UNAVAILABLE');
 assert.equal(await db.ingestEventRecord.count({where:{jobId}}),3);checks.push('stale-job-qualification-denied');
 console.log(JSON.stringify({result:'passed',checks,providerCalls:0,routesWired:false,workerLeaseVerified:false}));
} catch(error) {
 console.log(JSON.stringify({result:'failed',phase,errorCode:error instanceof AuthFault?error.code:'PROBE_ASSERTION_OR_DATABASE_ERROR'}));process.exitCode=1;
} finally { await db.$disconnect();await peer.$disconnect();await getPrisma()?.$disconnect(); }
