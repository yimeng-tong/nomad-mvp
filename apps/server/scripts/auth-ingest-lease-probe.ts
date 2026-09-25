import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { PrismaClient, type Prisma } from '@prisma/client';
import { claimIngestExecution,markIngestPending,renewIngestLease,releaseIngestLease,lockIngestLease,type IngestLease } from '../src/ingest/execution-lease.js';
import { resolveIngestExecutionPolicy } from '../src/ingest/execution-policy.js';
import { acceptIngestCommand,appendIngestEvent,getOrHydrateJob,persistIngestOutput } from '../src/ingest/store.js';
import { getPrisma } from '../src/db/prisma.js';
import { appendSnapshotEvent } from '../src/ingest/event-log.js';
import { advanceSnapshot,type IngestSnapshot } from '../src/ingest/job-state.js';
import { AuthFault } from '../src/auth/errors.js';
assert.equal(process.env.AUTH_TEST_DATABASE_ACK,'isolated-synthetic-only');
assert.match(new URL(process.env.DATABASE_URL!).pathname,/^\/nomad_auth_test_[a-z0-9_]+$/);
process.env.AUTH_RUNTIME_MODE='staging';process.env.AUTH_PROVIDER='aliyun-pnvs';
const db=new PrismaClient(),peer=new PrismaClient(),owner=randomUUID(),run=promisify(execFile),checks:string[]=[];
const policy=resolveIngestExecutionPolicy({INGEST_WORKER_MODE:'enabled',INGEST_RECOVERY_ISOLATED:'false',INGEST_LEASE_MS:'5000'});
const fault=(code:string)=>(error:unknown)=>error instanceof AuthFault&&error.code===code;
const extraOwners:string[]=[];
// Delay after the successful locked lease read, using a real transaction and DB clock.
function delayedTx(tx:Prisma.TransactionClient):Prisma.TransactionClient {
 let delayed=false;
 return new Proxy(tx,{get(target,key){
  if(key==='ingestJob')return new Proxy(target.ingestJob,{get(model,method){
   if(method==='findUniqueOrThrow')return async(args:any)=>{const row=await model.findUniqueOrThrow(args);if(!delayed){delayed=true;await tx.$queryRaw`SELECT 1 AS waited FROM pg_sleep(1.1)`;}return row;};
   return Reflect.get(model,method);
  }});
  const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;
 }});
}
const delayedDb=new Proxy(db,{get(target,key){if(key==='$transaction')return (work:any)=>target.$transaction(tx=>work(delayedTx(tx)));const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;}});
let phase='setup';
try {
 await db.user.create({data:{id:owner,authState:'active'}});
 const accepted=await acceptIngestCommand({enqueue:false,userId:owner,sourceUrl:`https://xhslink.com/${randomUUID()}`,traceId:randomUUID(),operationId:randomUUID()});
 const job=accepted.job;await db.$transaction(tx=>markIngestPending(tx,job.dbId));
 assert.equal(await claimIngestExecution(db,randomUUID(),resolveIngestExecutionPolicy({INGEST_WORKER_MODE:'enabled'})),null);
 assert.equal((await db.ingestJob.findUniqueOrThrow({where:{id:job.dbId}})).leaseFence,0n);checks.push('recovery-isolation-zero-claim');
 phase='two-process-claim';
 const child=async()=>{
  const workerId=randomUUID();
  const code=`import {PrismaClient} from '@prisma/client';import {claimIngestExecution} from './src/ingest/execution-lease.ts';const db=new PrismaClient();const x=await claimIngestExecution(db,${JSON.stringify(workerId)},${JSON.stringify(policy)});console.log(JSON.stringify(x?{...x.lease,fence:x.lease.fence.toString(),pid:process.pid}:null));await db.$disconnect();`;
  const {stdout}=await run(process.execPath,['--import','tsx','--input-type=module','-e',code],{cwd:process.cwd(),env:process.env,timeout:20000});return JSON.parse(stdout.trim());
 };
 const claims=await Promise.all([child(),child()]);assert.equal(claims.filter(Boolean).length,1);
 const winner=claims.find(Boolean);const old:IngestLease={...winner,fence:BigInt(winner.fence)};
 assert.equal(old.jobId,job.dbId);checks.push('two-process-single-claim');
 await assert.rejects(appendIngestEvent(job.id,{state:'fetching'},1),fault('INGEST_LEASE_LOST'));
 await appendIngestEvent(job.id,{state:'fetching'},1,old);
 await db.$transaction(tx=>markIngestPending(tx,job.dbId));
 assert.equal((await db.ingestJob.findUniqueOrThrow({where:{id:job.dbId}})).leaseOwner,old.workerId);
 checks.push('managed-writes-require-lease');
 phase='expired-takeover';
 await db.$executeRaw`UPDATE "IngestJob" SET lease_expires_at=clock_timestamp()-interval '1 millisecond' WHERE id=${job.dbId}::uuid`;
 await assert.rejects(renewIngestLease(db,old,5000),fault('INGEST_LEASE_LOST'));
 const takeover=await claimIngestExecution(db,randomUUID(),policy);assert.ok(takeover);assert.equal(takeover.lease.jobId,job.dbId);
 assert.equal(takeover.lease.attempt,old.attempt);assert.ok(takeover.lease.fence>old.fence);
 await assert.rejects(appendIngestEvent(job.id,{state:'parsing'},1,old),fault('INGEST_LEASE_LOST'));
 await assert.rejects(releaseIngestLease(db,old),fault('INGEST_LEASE_LOST'));
 const current=(await getOrHydrateJob(job.id))!;
 await assert.rejects(persistIngestOutput({job:current,post:{title:'Late worker',text:'Must not persist',media:[]},assets:[],candidates:[],timeEvidence:[],lease:old}),fault('INGEST_LEASE_LOST'));
 assert.equal(await db.inspiration.count({where:{jobId:job.dbId}}),0);checks.push('expired-worker-phase-output-renew-release-fenced');
 phase='lock-wait-expiry';
 await renewIngestLease(db,takeover.lease,1000);
 let unlock!:()=>void,locked!:()=>void;const signal=new Promise<void>(r=>{locked=r;}),gate=new Promise<void>(r=>{unlock=r;});
 const hold=db.$transaction(async tx=>{await tx.$queryRaw`SELECT id FROM "IngestJob" WHERE id=${job.dbId}::uuid FOR UPDATE`;locked();await gate;});
 await signal;
 const renewal=renewIngestLease(peer,takeover.lease,5000);const rejected=assert.rejects(renewal,fault('INGEST_LEASE_LOST'));
 await new Promise(r=>setTimeout(r,1100));unlock();await hold;await rejected;checks.push('expiry-rechecked-after-row-lock-wait');
 phase='post-validation-expiry';
 for(const action of ['renew','release','event'] as const){
  phase=`post-validation-expiry-${action}`;
  const claim=await claimIngestExecution(db,randomUUID(),{...policy,leaseMs:1000});assert.ok(claim);
  const before=await db.ingestJob.findUniqueOrThrow({where:{id:job.dbId}});
  if(action==='renew')await assert.rejects(renewIngestLease(delayedDb,claim.lease,5000),fault('INGEST_LEASE_LOST'));
  if(action==='release')await assert.rejects(releaseIngestLease(delayedDb,claim.lease),fault('INGEST_LEASE_LOST'));
  if(action==='event')await assert.rejects(db.$transaction(tx=>appendSnapshotEvent(delayedTx(tx),before,advanceSnapshot(before.snapshotJson as unknown as IngestSnapshot,{state:'parsing'},1),'fact',claim.lease)),fault('INGEST_LEASE_LOST'));
  const after=await db.ingestJob.findUniqueOrThrow({where:{id:job.dbId}});
  assert.equal(after.leaseOwner,claim.lease.workerId);assert.equal(after.lastEventSeq,before.lastEventSeq);
  assert.equal(after.leaseExpiresAt!.getTime(),before.leaseExpiresAt!.getTime());
 }
 checks.push('expiry-at-renew-release-event-write-rejected');
 phase='valid-release';
 const releasable=await claimIngestExecution(db,randomUUID(),policy);assert.ok(releasable);
 await releaseIngestLease(db,releasable.lease,1000);
 assert.equal(await claimIngestExecution(db,randomUUID(),policy),null);
 await db.$queryRaw`SELECT 1 AS waited FROM pg_sleep(1.1)`;
 const released=await claimIngestExecution(db,randomUUID(),policy);assert.ok(released);
 assert.equal(released.lease.attempt,releasable.lease.attempt);assert.ok(released.lease.fence>releasable.lease.fence);
 checks.push('valid-release-backoff-and-same-attempt-reclaim');
 phase='qualification-after-claim';
 for(const change of [{authState:'disabled'},{authVersion:1}]){
  await db.user.update({where:{id:owner},data:change});
  await assert.rejects(appendIngestEvent(job.id,{state:'parsing'},1,released.lease),fault('AUTH_ACCOUNT_UNAVAILABLE'));
  await assert.rejects(persistIngestOutput({job:current,post:{title:'Denied',text:'',media:[]},assets:[],candidates:[],timeEvidence:[],lease:released.lease}),fault('AUTH_ACCOUNT_UNAVAILABLE'));
  await assert.rejects(renewIngestLease(db,released.lease,5000),fault('AUTH_ACCOUNT_UNAVAILABLE'));
  await assert.rejects(releaseIngestLease(db,released.lease),fault('AUTH_ACCOUNT_UNAVAILABLE'));
  await db.user.update({where:{id:owner},data:{authState:'active',authVersion:0}});
 }
 checks.push('revoked-owner-phase-result-renew-release-rejected');
 await releaseIngestLease(db,released.lease);
 phase='terminal-and-qualification';
 const final=await claimIngestExecution(db,randomUUID(),policy);assert.ok(final);
 await appendIngestEvent(job.id,{state:'failed',error_code:'INGEST_TEST_COMPLETE',retriable:false},1,final.lease);
 const ended=await db.ingestJob.findUniqueOrThrow({where:{id:job.dbId}});assert.equal(ended.executionPending,false);assert.equal(ended.leaseOwner,null);assert.equal(ended.leaseExpiresAt,null);
 await assert.rejects(db.$transaction(tx=>lockIngestLease(tx,final.lease)),fault('INGEST_LEASE_LOST'));checks.push('terminal-atomically-releases-lease');
 const blocked=await acceptIngestCommand({enqueue:false,userId:owner,sourceUrl:`https://xhslink.com/${randomUUID()}`,traceId:randomUUID(),operationId:randomUUID()});
 await db.$transaction(tx=>markIngestPending(tx,blocked.job.dbId));await db.user.update({where:{id:owner},data:{authVersion:1}});
 assert.equal(await claimIngestExecution(db,randomUUID(),policy),null);checks.push('stale-owner-qualification-not-claimed');
 phase='valid-result';
 const resultOwner=randomUUID();extraOwners.push(resultOwner);await db.user.create({data:{id:resultOwner,authState:'active'}});
 const resultJob=(await acceptIngestCommand({enqueue:false,userId:resultOwner,sourceUrl:`https://xhslink.com/${randomUUID()}`,traceId:randomUUID(),operationId:randomUUID()})).job;
 await db.$transaction(tx=>markIngestPending(tx,resultJob.dbId));
 const resultLease=await claimIngestExecution(db,randomUUID(),policy);assert.ok(resultLease);assert.equal(resultLease.lease.jobId,resultJob.dbId);
 const output={job:resultJob,post:{title:'Managed result',text:'Synthetic lease output',media:[]},assets:[{kind:'image' as const,cosKey:'synthetic/lease-result'}],candidates:[],timeEvidence:[],partial:true};
 await assert.rejects(persistIngestOutput(output),fault('INGEST_LEASE_LOST'));
 assert.equal(await db.inspiration.count({where:{jobId:resultJob.dbId}}),0);
 await persistIngestOutput({...output,lease:resultLease.lease});
 const resultRow=await db.ingestJob.findUniqueOrThrow({where:{id:resultJob.dbId}});
 const resultEvent=await db.ingestEventRecord.findUniqueOrThrow({where:{jobId_seq:{jobId:resultJob.dbId,seq:resultRow.lastEventSeq}}});
 assert.deepEqual(resultEvent.snapshotJson,resultRow.snapshotJson);
 const snapshot=resultRow.snapshotJson as unknown as IngestSnapshot;
 assert.ok(snapshot.result);assert.equal(snapshot.result.asset_count,1);
 assert.equal(await db.inspiration.count({where:{id:snapshot.result.inspiration_id,jobId:resultJob.dbId}}),1);
 await appendIngestEvent(resultJob.id,{state:'failed',error_code:'INGEST_TEST_COMPLETE'},1,resultLease.lease);
 checks.push('managed-result-rejects-missing-lease-and-commits-valid-result-with-event');
 phase='claim-skip-locked';
 const lockOwner=randomUUID(),freeOwner=randomUUID();extraOwners.push(lockOwner,freeOwner);
 await db.user.createMany({data:[{id:lockOwner,authState:'active'},{id:freeOwner,authState:'active'}]});
 const prefix=randomUUID().slice(-8);
 const ids=Array.from({length:33},(_,i)=>`00000000-0000-4000-8000-${prefix}${i.toString(16).padStart(4,'0')}`);
 await db.ingestJob.createMany({data:ids.map((id,i)=>({id,userId:i===32?freeOwner:lockOwner,authVersion:0,sourceType:'xhs',sourceHash:randomUUID(),executionPending:true,eventStreamId:randomUUID()}))});
 const whileLocked=async(table:'User'|'IngestJob',work:()=>Promise<void>)=>{
  let unlock!:()=>void,ready!:()=>void;const gate=new Promise<void>(r=>{unlock=r;}),signal=new Promise<void>(r=>{ready=r;});
  const hold=peer.$transaction(async tx=>{if(table==='User')await tx.$queryRaw`SELECT id FROM "User" WHERE id=${lockOwner}::uuid FOR UPDATE`;else await tx.ingestJob.updateMany({where:{id:{in:ids.slice(0,32)}},data:{checkpointVersion:0}});ready();await gate;},{timeout:10000});
  await signal;try{await work();}finally{unlock();await hold;}
 };
 for(const table of ['User','IngestJob'] as const){
  await whileLocked(table,async()=>{const claimed=await claimIngestExecution(db,randomUUID(),policy);assert.ok(claimed);assert.equal(claimed.row.id,ids[32]);});
  await db.ingestJob.update({where:{id:ids[32]},data:{leaseOwner:null,leaseExpiresAt:null}});
 }
 checks.push('busy-owner-and-full-locked-page-do-not-starve-next-job');
 console.log(JSON.stringify({result:'passed',checks,providerCalls:0,schedulerWired:false,pipelineCheckpointRecoveryVerified:false}));
} catch(error) {console.log(JSON.stringify({result:'failed',phase,errorCode:error instanceof AuthFault?error.code:'PROBE_ASSERTION_OR_DATABASE_ERROR'}));process.exitCode=1;}
finally {await db.ingestJob.updateMany({where:{userId:{in:[owner,...extraOwners]}},data:{executionPending:false,leaseOwner:null,leaseExpiresAt:null}});await db.$disconnect();await peer.$disconnect();await getPrisma()?.$disconnect();}
