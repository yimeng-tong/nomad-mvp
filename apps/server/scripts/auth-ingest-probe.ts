import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import Fastify from 'fastify';
import fastifySSE from 'fastify-sse-v2';
import errorEnvelope from '../src/plugins/error-envelope.js';
import ingestRoutes from '../src/routes/ingest.js';
import { Prisma, PrismaClient } from '@prisma/client';
import { getPrisma } from '../src/db/prisma.js';
import { acceptIngestCommand, appendIngestEvent, getIngestSnapshot, getIngestResult, getJob, getOrHydrateJob, persistIngestOutput, readIngestCommand, retryIngestCommand, subscribeToIngest } from '../src/ingest/store.js';
import { AuthFault } from '../src/auth/errors.js';
assert.equal(process.env.AUTH_TEST_DATABASE_ACK,'isolated-synthetic-only');
assert.match(new URL(process.env.DATABASE_URL!).pathname,/^\/nomad_auth_test_[a-z0-9_]+$/);
process.env.AUTH_RUNTIME_MODE='staging';process.env.AUTH_PROVIDER='aliyun-pnvs';
const db=new PrismaClient(), owner=randomUUID(), other=randomUUID();
const fault=(code:string)=>(error:unknown)=>error instanceof AuthFault&&error.code===code;
const run=promisify(execFile);
async function worker(method:'acceptIngestCommand'|'retryIngestCommand',input:object){
 const code=`import {${method}} from './src/ingest/store.ts'; import {getPrisma} from './src/db/prisma.ts'; const result=await ${method}(${JSON.stringify(input)}); console.log(JSON.stringify({id:result.job.id,shouldRun:result.shouldRun,disposition:result.disposition,pid:process.pid})); await getPrisma()?.$disconnect();`;
 const {stdout}=await run(process.execPath,['--import','tsx','--input-type=module','-e',code],{cwd:process.cwd(),env:process.env,timeout:20000});return JSON.parse(stdout.trim());
}
async function readWorker(userId:string,id:string){
 const code=`import {getIngestSnapshot} from './src/ingest/store.ts';import {getPrisma} from './src/db/prisma.ts';const result=await getIngestSnapshot(${JSON.stringify(userId)},${JSON.stringify(id)});console.log(JSON.stringify({id:result.ingest_id,cursor:result.head_cursor,pid:process.pid}));await getPrisma()?.$disconnect();`;
 const {stdout}=await run(process.execPath,['--import','tsx','--input-type=module','-e',code],{cwd:process.cwd(),env:process.env,timeout:20000});return JSON.parse(stdout.trim());
}
try{
 await db.user.createMany({data:[{id:owner,authState:'active'},{id:other,authState:'active'}]});
 const request={enqueue:false,userId:owner,sourceUrl:`https://xhslink.com/${randomUUID()}`,traceId:randomUUID(),operationId:randomUUID()};
 const peers=await Promise.all([worker('acceptIngestCommand',request),worker('acceptIngestCommand',{...request,operationId:randomUUID()})]);
 assert.notEqual(peers[0].pid,peers[1].pid);assert.equal(new Set(peers.map(x=>x.id)).size,1);assert.equal(peers.filter(x=>x.shouldRun).length,1);
 const id=peers[0].id as string;
 assert.equal((await readIngestCommand(owner,request.operationId)).ingest_id,id,'receipt survives a different process');
 assert.equal((await acceptIngestCommand(request)).shouldRun,false);
 await assert.rejects(acceptIngestCommand({enqueue:false,...request,sourceUrl:'https://xhslink.com/changed'}),fault('INGEST_COMMAND_CONFLICT'));
 await assert.rejects(getIngestSnapshot(other,id),fault('INGEST_JOB_NOT_FOUND'));
 const job=(await getOrHydrateJob(id))!;
 await appendIngestEvent(id,{state:'storing'},1);
 await persistIngestOutput({job,post:{title:'Synthetic retained result',text:'Retain this committed text',media:[]},assets:[{kind:'image',cosKey:`synthetic/${randomUUID()}`}],candidates:[],timeEvidence:[],partial:true});
 await appendIngestEvent(id,{state:'failed',error_code:'INGEST_FINALIZE_FAILED',retriable:true},1);
 const before=await getIngestSnapshot(owner,id);assert.equal(before.partial,true);assert.equal(before.result?.asset_count,1);
 const retry={enqueue:false,userId:owner,jobId:id,operationId:randomUUID(),expectedAttempt:1,expectedVersion:before.state_version};
 const retried=await Promise.all([worker('retryIngestCommand',retry),worker('retryIngestCommand',retry)]);
 assert.equal(retried.filter(x=>x.shouldRun).length,1);assert.ok(retried.every(x=>x.id===id));
 await assert.rejects(appendIngestEvent(id,{state:'parsing'},1),fault('INGEST_ATTEMPT_CHANGED'));
 await assert.rejects(persistIngestOutput({job,post:{title:'Late old write',text:'Must not replace',media:[]},assets:[],candidates:[],timeEvidence:[]}),fault('INGEST_ATTEMPT_CHANGED'));
 const resumed=(await getOrHydrateJob(id))!;await appendIngestEvent(id,{state:'storing'},2);
 await persistIngestOutput({job:resumed,post:{title:'',text:'',media:[]},assets:[],candidates:[],timeEvidence:[],partial:true});
 await appendIngestEvent(id,{state:'failed',error_code:'INGEST_RETRY_FAILED',retriable:true},2);
 const retained=await getIngestSnapshot(owner,id);assert.equal(retained.result?.asset_count,1);assert.equal(retained.result?.inspiration_id,before.result?.inspiration_id);
 const eventRows=await db.ingestEventRecord.findMany({where:{jobId:job.dbId},orderBy:{seq:'asc'}});
 const persistedJob=await db.ingestJob.findUniqueOrThrow({where:{id:job.dbId}});
 assert.equal(eventRows.length,8,'accept, retry, stage and each result persistence must append an event');
 assert.deepEqual(eventRows.map(row=>row.seq),[1n,2n,3n,4n,5n,6n,7n,8n]);
 assert.equal(persistedJob.lastEventSeq,8n); assert.deepEqual(eventRows.at(-1)!.snapshotJson,persistedJob.snapshotJson);
 assert.equal(eventRows.filter(row=>row.stage==='storing'&&(row.snapshotJson as any).result).length,3,'both saved-output facts and retained retry facts are represented');
 const data=await db.inspiration.findUniqueOrThrow({where:{id:retained.result!.inspiration_id},include:{assets:true}});
 assert.equal(data.text,'Retain this committed text');assert.equal(data.assets.length,1);
 const view=await getIngestResult(owner,id);assert.equal(view.id,data.id);assert.equal('canonical_url' in view,false);await assert.rejects(getIngestResult(other,id),fault('INGEST_JOB_NOT_FOUND'));
 const another=await acceptIngestCommand({enqueue:false,...request,operationId:randomUUID(),sourceUrl:`https://xhslink.com/${randomUUID()}`});
 let notifications=0;const unsubscribe=subscribeToIngest(another.job.id,()=>{notifications++;});
 const constraint=`probe_${randomUUID().replaceAll('-','')}`;
 // PostgreSQL ALTER does not accept bind parameters through Prisma. Both interpolations are generated and validated here, only in this synthetic database.
 assert.match(constraint,/^probe_[a-f0-9]{32}$/);assert.match(another.job.dbId,/^[a-f0-9-]{36}$/);
 await db.$executeRawUnsafe(`ALTER TABLE "IngestJob" ADD CONSTRAINT ${constraint} CHECK (id <> '${another.job.dbId}'::uuid OR status <> 'parsing')`);
 try{
  await assert.rejects(appendIngestEvent(another.job.id,{state:'parsing'},1),fault('AUTH_AUTHORITY_UNAVAILABLE'));
  assert.equal(notifications,0,'a failed DB commit must not publish a factual event');
  const unchanged=await getIngestSnapshot(owner,another.job.id);assert.equal(unchanged.state,'created');assert.equal(unchanged.state_version,0);
 }finally{unsubscribe();await db.$executeRaw(Prisma.sql`ALTER TABLE "IngestJob" DROP CONSTRAINT ${Prisma.raw(constraint)}`);}
 // A committed old response is deliberately delayed beyond a newer retry's cache hydration.
 const delayed=await acceptIngestCommand({enqueue:false,...request,operationId:randomUUID(),sourceUrl:`https://xhslink.com/${randomUUID()}`});
 const authority=getPrisma()!;const original=authority.$transaction.bind(authority);
 let signalCommit!:()=>void,releaseCommit!:()=>void;const committed=new Promise<void>(resolve=>{signalCommit=resolve;});
 const release=new Promise<void>(resolve=>{releaseCommit=resolve;});
 (authority as any).$transaction=async(...args:any[])=>{const result=await (original as any)(...args);if(result?.event?.ingest_id===delayed.job.id&&result?.event?.state==='failed'){signalCommit();await release;}return result;};
 try{
  const late=appendIngestEvent(delayed.job.id,{state:'failed',retriable:true,error_code:'INGEST_FETCH_FAILED'},1);await committed;
  const failedRow=await getIngestSnapshot(owner,delayed.job.id);
  await retryIngestCommand({enqueue:false,userId:owner,jobId:delayed.job.id,operationId:randomUUID(),expectedAttempt:1,expectedVersion:failedRow.state_version});
  releaseCommit();await late;
  assert.equal(getJob(delayed.job.id)?.status,'created');assert.equal(getJob(delayed.job.id)?.snapshot?.attempt,2,'late publication cannot replace the newer cache');
 }finally{releaseCommit();(authority as any).$transaction=original;}
 // Fail the event append after modifying a previously saved partial result, assets and candidates.
 const rollbackJob=await acceptIngestCommand({enqueue:false,...request,operationId:randomUUID(),sourceUrl:`https://xhslink.com/${randomUUID()}`});
 await appendIngestEvent(rollbackJob.job.id,{state:'storing'},1);
 await persistIngestOutput({job:rollbackJob.job,post:{title:'Original partial',text:'Original retained content',media:[]},assets:[{kind:'image',cosKey:'synthetic/original'}],candidates:[{rank:1,name:'Original candidate'}],timeEvidence:[],partial:true});
 await appendIngestEvent(rollbackJob.job.id,{state:'failed',retriable:true,error_code:'INGEST_FINALIZE_FAILED'},1);
 const rollbackBefore=await getIngestSnapshot(owner,rollbackJob.job.id);
 await retryIngestCommand({enqueue:false,userId:owner,jobId:rollbackJob.job.id,operationId:randomUUID(),expectedAttempt:1,expectedVersion:rollbackBefore.state_version});
 await appendIngestEvent(rollbackJob.job.id,{state:'storing'},2);
 const rollbackCurrent=(await getOrHydrateJob(rollbackJob.job.id))!;
 const rowBefore=await db.ingestJob.findUniqueOrThrow({where:{id:rollbackJob.job.dbId}});
 const originalResult=await db.inspiration.findUniqueOrThrow({where:{id:rollbackBefore.result!.inspiration_id},include:{assets:true,candidates:true}});
 const failOutput=`probe_output_${randomUUID().replaceAll('-','')}`;
 assert.match(failOutput,/^probe_output_[a-f0-9]{32}$/);assert.match(rollbackJob.job.dbId,/^[a-f0-9-]{36}$/);
 await db.$executeRawUnsafe(`ALTER TABLE "IngestEventRecord" ADD CONSTRAINT ${failOutput} CHECK (job_id <> '${rollbackJob.job.dbId}'::uuid OR seq <> ${rowBefore.lastEventSeq+1n})`);
 try {
  await assert.rejects(persistIngestOutput({job:rollbackCurrent,post:{title:'Must roll back',text:'Must roll back',media:[]},assets:[{kind:'image',cosKey:'synthetic/new'}],candidates:[{rank:1,name:'Changed candidate'},{rank:2,name:'New candidate'}],timeEvidence:[],partial:true}));
  const rowAfter=await db.ingestJob.findUniqueOrThrow({where:{id:rollbackJob.job.dbId}});
  assert.deepEqual(rowAfter.snapshotJson,rowBefore.snapshotJson);assert.equal(rowAfter.stateVersion,rowBefore.stateVersion);assert.equal(rowAfter.lastEventSeq,rowBefore.lastEventSeq);
  const preserved=await db.inspiration.findUniqueOrThrow({where:{id:originalResult.id},include:{assets:true,candidates:true}});
  assert.equal(preserved.title,originalResult.title);assert.equal(preserved.text,originalResult.text);
  assert.deepEqual(preserved.assets,originalResult.assets);assert.deepEqual(preserved.candidates,originalResult.candidates);
  assert.equal(await db.ingestEventRecord.count({where:{jobId:rollbackJob.job.dbId}}),Number(rowBefore.lastEventSeq));
 } finally { await db.$executeRawUnsafe(`ALTER TABLE "IngestEventRecord" DROP CONSTRAINT ${failOutput}`); }
 // Legacy projection is tested over the real route with a controlled, fixed principal.
 // This is a data-projection fixture, not proof of production authentication (tested by auth-http-probe).
 const legacyId=randomUUID();
 await db.ingestJob.create({data:{id:legacyId,userId:owner,authVersion:0,sourceType:'xhs',sourceHash:randomUUID(),status:'done'}});
 await db.inspiration.create({data:{userId:owner,jobId:legacyId,title:'Legacy saved row',text:'fixture',tags:[],sourceHash:randomUUID()}});
 await assert.rejects(getIngestSnapshot(other,`ing_${legacyId}`),fault('INGEST_JOB_NOT_FOUND'));
 assert.equal(await db.ingestEventRecord.count({where:{jobId:legacyId}}),0);
 assert.equal((await db.ingestJob.findUniqueOrThrow({where:{id:legacyId}})).eventStreamId,null);
 const adopters=await Promise.all([readWorker(owner,`ing_${legacyId}`),readWorker(owner,`ing_${legacyId}`)]);
 assert.notEqual(adopters[0].pid,adopters[1].pid);assert.equal(adopters[0].cursor,adopters[1].cursor);
 const legacySnapshot=await getIngestSnapshot(owner,`ing_${legacyId}`);assert.ok(legacySnapshot.result);
 const legacyLog=await db.ingestEventRecord.findMany({where:{jobId:legacyId}});assert.equal(legacyLog.length,1);assert.equal(legacyLog[0].kind,'checkpoint');assert.equal(legacyLog[0].stage,'done');
 const app=Fastify({logger:false});await app.register(fastifySSE as any);await app.register(errorEnvelope);
 app.addHook('onRequest',(req,_reply,done)=>{req.user={id:owner};done();});await app.register(ingestRoutes);
 try{
  const stream=await app.inject({method:'GET',url:`/ingest/ing_${legacyId}/events`});assert.equal(stream.statusCode,200);
  const snapshots=stream.body.split(/\r?\n\r?\n/).filter(block=>block.includes('event: ingest')).flatMap(block=>block.split(/\r?\n/).filter(line=>line.startsWith('data: ')).map(line=>JSON.parse(line.slice(6)))).filter(event=>event.snapshot);
  assert.equal(snapshots.length,1);assert.equal(snapshots[0].snapshot.result.inspiration_id,legacySnapshot.result!.inspiration_id);
 }finally{await app.close();}
 const legacyFailedId=randomUUID();
 await db.ingestJob.create({data:{id:legacyFailedId,userId:owner,authVersion:0,sourceType:'xhs',sourceHash:randomUUID(),status:'failed'}});
 await db.inspiration.create({data:{userId:owner,jobId:legacyFailedId,title:'Legacy partial row',text:'fixture',tags:[],sourceHash:randomUUID()}});
 assert.equal((await getIngestSnapshot(owner,`ing_${legacyFailedId}`)).partial,true,'a legacy failure with a saved result remains partial');
 await db.user.update({where:{id:owner},data:{authState:'disabled',authVersion:{increment:1}}});
 await assert.rejects(retryIngestCommand({enqueue:false,...retry,operationId:randomUUID(),expectedAttempt:2,expectedVersion:retained.state_version}),fault('AUTH_ACCOUNT_UNAVAILABLE'));
 assert.equal((await db.ingestJob.findUniqueOrThrow({where:{id:job.dbId}})).retryCount,1);
 console.log(JSON.stringify({result:'ingest-authority-probe-passed',realProviderCalls:0,independentWorkerProcesses:true,
  verified:['one-dispatch-across-processes','durable-command-recovery','command-conflict','owner-isolation','retry-cas-and-replay','late-attempt-fenced','atomic-result-and-snapshot','partial-content-retained','db-failure-no-publication','account-qualification','late-cache-publication-fenced','legacy-authoritative-sse-result','legacy-partial-projection','all-producer-transactions-append-events','legacy-current-fact-checkpoint-only','result-assets-candidates-event-failure-full-rollback','legacy-adopt-two-process-single-checkpoint','wrong-owner-does-not-adopt-log']}));
}finally{await db.$disconnect();await getPrisma()?.$disconnect();}
