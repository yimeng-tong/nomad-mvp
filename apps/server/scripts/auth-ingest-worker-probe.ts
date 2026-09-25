import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import Fastify from 'fastify';
import ingestRoutes, {stopIngestWorker} from '../src/routes/ingest.js';
import {buildApplication} from '../src/application.js';
import {readAuthRuntimeConfig} from '../src/auth/runtime-config.js';
import {PersistentAuthService} from '../src/auth/service.js';
import {PrismaAuthRepository} from '../src/auth/prisma-repository.js';
import {randomUUID} from 'node:crypto';
import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {PrismaClient} from '@prisma/client';
import {AuthFault} from '../src/auth/errors.js';
import {getPrisma} from '../src/db/prisma.js';
import {acceptIngestCommand,retryIngestCommand,appendIngestEvent} from '../src/ingest/store.js';
import {claimIngestExecution,renewIngestLease,releaseIngestLease} from '../src/ingest/execution-lease.js';
import {checkpointFromRow,commitIngestCheckpoint} from '../src/ingest/execution-checkpoint.js';
import {resolveIngestExecutionPolicy} from '../src/ingest/execution-policy.js';
import {runDurableIngestPipeline} from '../src/ingest/durable-pipeline.js';
import {IngestWorker} from '../src/ingest/worker.js';
assert.equal(process.env.AUTH_TEST_DATABASE_ACK,'isolated-synthetic-only');
assert.match(new URL(process.env.DATABASE_URL!).pathname,/^\/nomad_auth_test_[a-z0-9_]+$/);
process.env.AUTH_RUNTIME_MODE='staging';process.env.AUTH_PROVIDER='aliyun-pnvs';
delete process.env.XHS_DOWNLOADER_URL;
const db=new PrismaClient(),policy=resolveIngestExecutionPolicy({INGEST_WORKER_MODE:'enabled',INGEST_RECOVERY_ISOLATED:'false',INGEST_LEASE_MS:'1000',INGEST_POLL_MS:'100',INGEST_CONCURRENCY:'1'});
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
const until=async(check:()=>Promise<boolean>)=>{const deadline=Date.now()+15000;while(!await check()){if(Date.now()>deadline)throw new Error('PROBE_TIMEOUT');await sleep(20);}};
if(process.env.INGEST_WORKER_PROBE_CHILD==='accept'){
 const accepted=await acceptIngestCommand({userId:process.env.PROBE_OWNER!,sourceUrl:`https://xhslink.com/${randomUUID()}`,traceId:randomUUID(),operationId:randomUUID()});
 console.log(JSON.stringify({point:'accepted',jobId:accepted.job.dbId}));setInterval(()=>{},1000);
}else if(process.env.INGEST_WORKER_PROBE_CHILD==='worker'){
 const id=process.env.PROBE_JOB!,pause=process.env.PROBE_PAUSE;
 const keepAlive=setInterval(()=>{},1000);
 const worker=new IngestWorker(policy,{
  claim:async()=>{const claimed=await claimIngestExecution(db,randomUUID(),policy);if(!claimed)return null;assert.equal(claimed.row.id,id);
   if(pause==='claimed'){console.log(JSON.stringify({point:'claimed'}));await new Promise(()=>{});}
   return {lease:claimed.lease,failures:claimed.row.executionFailureCount};},
  execute:(lease,signal)=>runDurableIngestPipeline(lease,signal,{assertCapability:()=>{},onCheckpoint:async checkpoint=>{
   if(checkpoint.phase===pause&&checkpoint.inFlight===null){console.log(JSON.stringify({point:pause}));await new Promise(()=>{});}
  }}),renew:lease=>renewIngestLease(db,lease,policy.leaseMs),release:(lease,delay)=>releaseIngestLease(db,lease,delay),
 });
 worker.start();
 try{await until(async()=>['done','failed'].includes((await db.ingestJob.findUniqueOrThrow({where:{id}})).status));await worker.stop();console.log(JSON.stringify({point:'finished'}));}
 finally{clearInterval(keepAlive);await worker.stop();await db.$disconnect();await getPrisma()?.$disconnect();}
}else{
 const owner=randomUUID(),checks:string[]=[],children=new Set<ChildProcess>();let phase='setup';let restoreDisconnect:(()=>void)|undefined;
 const apps:ReturnType<typeof Fastify>[]=[],servers:ReturnType<typeof createServer>[]=[];
 const restoreNames=['AUTH_RUNTIME_MODE','AUTH_PROVIDER','AUTH_TEST_ADAPTER_ENABLED','NODE_ENV','INGEST_WORKER_MODE','INGEST_RECOVERY_ISOLATED','INGEST_CONCURRENCY','XHS_DOWNLOADER_URL'];
 const savedEnv=new Map(restoreNames.map(name=>[name,process.env[name]]));
 const launch=(mode:string,extra:Record<string,string>={})=>{
  const child=spawn(process.execPath,['--import','tsx','scripts/auth-ingest-worker-probe.ts'],{cwd:process.cwd(),env:{...process.env,INGEST_WORKER_PROBE_CHILD:mode,PROBE_OWNER:owner,...extra},stdio:['ignore','pipe','pipe']});children.add(child);
  const records:any[]=[];let buffer='';child.stdout!.on('data',chunk=>{buffer+=chunk;for(;;){const end=buffer.indexOf('\n');if(end<0)break;const line=buffer.slice(0,end);buffer=buffer.slice(end+1);try{records.push(JSON.parse(line));}catch{/* Only sanitized probe records are consumed. */}}});
  let stderr='';child.stderr!.on('data',chunk=>{stderr=(stderr+chunk).slice(-1000);});child.once('exit',()=>children.delete(child));
  return {child,wait:async(point:string)=>{await until(async()=>{if(child.exitCode!==null&&!records.some(row=>row.point===point))throw new Error('CHILD_EXITED');return records.some(row=>row.point===point);});return records.find(row=>row.point===point);}};
 };
 const kill=async(child:ChildProcess)=>{const exit=once(child,'exit');child.kill('SIGKILL');await exit;};
 const accept=()=>acceptIngestCommand({userId:owner,sourceUrl:`https://xhslink.com/${randomUUID()}`,traceId:randomUUID(),operationId:randomUUID()});
 const expire=async(id:string)=>{await db.$executeRaw`UPDATE "IngestJob" SET lease_expires_at=clock_timestamp()-interval '1 millisecond' WHERE id=${id}::uuid AND lease_owner IS NOT NULL`;};
 try{
  await db.user.create({data:{id:owner,authState:'active'}});
  assert.equal(await db.ingestJob.count({where:{executionPending:true,user:{authState:'active'}}}),0,'probe requires no other runnable fixture jobs');
  phase='atomic-acceptance';
  const operation=randomUUID();getPrisma()!.$use(async(params,next)=>{if(params.model==='IngestCommand'&&params.action==='create'&&params.args.data.operationId===operation)throw new Error('SYNTHETIC_COMMAND_FAILURE');return next(params);});
  await assert.rejects(acceptIngestCommand({userId:owner,sourceUrl:`https://xhslink.com/${randomUUID()}`,traceId:randomUUID(),operationId:operation}));
  assert.equal(await db.ingestJob.count({where:{userId:owner}}),0);checks.push('command-failure-rolls-back-job-pending-and-initial-event');
  for(const point of ['accepted','claimed','fetched','saved']){
   phase=`kill-${point}`;let id:string;
   if(point==='accepted'){const child=launch('accept');id=(await child.wait(point)).jobId;await kill(child.child);}
   else{id=(await accept()).job.dbId;const child=launch('worker',{PROBE_JOB:id,PROBE_PAUSE:point});await child.wait(point);await kill(child.child);}
   const before=await db.ingestJob.findUniqueOrThrow({where:{id}});assert.equal(before.executionPending,true);assert.equal(before.retryCount,0);
   if(point==='saved'){assert.equal(await db.inspiration.count({where:{jobId:id}}),1);assert.equal((before.checkpointJson as any).phase,'saved');}
   await sleep(1200); // Let the real DB-clock lease expire naturally after SIGKILL.
   const resumed=launch('worker',{PROBE_JOB:id,INGEST_STUB_FAIL_STAGE:point==='saved'?'fetch,extract,geo,rehost':point==='fetched'?'fetch':''});await resumed.wait('finished');
   if(resumed.child.exitCode===null)await once(resumed.child,'exit');assert.equal(resumed.child.exitCode,0);
   const after=await db.ingestJob.findUniqueOrThrow({where:{id}});assert.equal(after.status,'done');assert.equal(after.retryCount,0);assert.equal(after.executionPending,false);assert.equal(after.leaseOwner,null);
   assert.ok(after.leaseFence>before.leaseFence);assert.equal(await db.inspiration.count({where:{jobId:id}}),1);
   if(point==='saved')assert.equal(after.lastEventSeq,before.lastEventSeq+1n);
   const events=await db.ingestEventRecord.findMany({where:{jobId:id},orderBy:{seq:'asc'}});assert.deepEqual(events.map(e=>e.seq.toString()),Array.from({length:events.length},(_,i)=>String(i+1)));assert.ok(events.every(e=>e.attempt===1));
   checks.push(`sigkill-after-${point}-same-job-attempt-checkpoint-resume`);
  }
  phase='duplicate-does-not-reset-lease';
  const input={userId:owner,sourceUrl:`https://xhslink.com/${randomUUID()}`,traceId:randomUUID(),operationId:randomUUID()};const accepted=await acceptIngestCommand(input);
  const claim=await claimIngestExecution(db,randomUUID(),policy);assert.ok(claim);const repeated=await acceptIngestCommand(input);assert.equal(repeated.shouldRun,false);
  const held=await db.ingestJob.findUniqueOrThrow({where:{id:accepted.job.dbId}});assert.equal(held.leaseOwner,claim.lease.workerId);assert.equal(held.leaseFence,claim.lease.fence);
  await appendIngestEvent(accepted.job.id,{state:'failed',error_code:'INGEST_TEST_COMPLETE'},1,claim.lease);checks.push('duplicate-receipt-does-not-reset-pending-lease-or-checkpoint');
  phase='checkpoint-transaction';
  const atomic=await accept(),atomicClaim=await claimIngestExecution(db,randomUUID(),policy);assert.ok(atomicClaim);
  const start=await db.ingestJob.findUniqueOrThrow({where:{id:atomic.job.dbId}}),checkpoint=checkpointFromRow(start);
  let rejectEvent=true;db.$use(async(params,next)=>{if(rejectEvent&&params.model==='IngestEventRecord'&&params.action==='create'&&params.args.data.jobId===atomic.job.dbId)throw new Error('SYNTHETIC_EVENT_FAILURE');return next(params);});
  await assert.rejects(commitIngestCheckpoint(db,atomicClaim.lease,{...checkpoint,inFlight:'fetch',inFlightReplayable:true},{state:'fetching'}));rejectEvent=false;
  const unchanged=await db.ingestJob.findUniqueOrThrow({where:{id:atomic.job.dbId}});assert.equal(unchanged.checkpointVersion,0);assert.equal(unchanged.lastEventSeq,start.lastEventSeq);assert.equal(unchanged.status,'created');
  await appendIngestEvent(atomic.job.id,{state:'failed',error_code:'INGEST_TEST_COMPLETE'},1,atomicClaim.lease);checks.push('checkpoint-snapshot-event-rollback-together');
  phase='bounded-recovery';
  const exhausted=await accept();
  for(let i=0;i<4;i++){assert.ok(await claimIngestExecution(db,randomUUID(),policy));await expire(exhausted.job.dbId);}
  const last=await claimIngestExecution(db,randomUUID(),policy);assert.ok(last);assert.equal(last.row.executionFailureCount,5);
  await runDurableIngestPipeline(last.lease,new AbortController().signal,{assertCapability:()=>{}});
  const failed=await db.ingestJob.findUniqueOrThrow({where:{id:exhausted.job.dbId}});assert.equal(failed.status,'failed');assert.equal(failed.lastError,'INGEST_RECOVERY_EXHAUSTED');assert.equal(failed.retryCount,0);checks.push('repeated-no-progress-recovery-bounded-without-increasing-user-attempt');
  phase='unknown-external-step';
  const uncertain=await accept(),uncertainClaim=await claimIngestExecution(db,randomUUID(),policy);assert.ok(uncertainClaim);
  await commitIngestCheckpoint(db,uncertainClaim.lease,{...checkpointFromRow(uncertainClaim.row),inFlight:'fetch',inFlightReplayable:false},{state:'fetching'});
  await releaseIngestLease(db,uncertainClaim.lease);const newClaim=await claimIngestExecution(db,randomUUID(),policy);assert.ok(newClaim);
  delete process.env.XHS_DOWNLOADER_URL; // The recorded effect classification must survive configuration removal.
  await runDurableIngestPipeline(newClaim.lease,new AbortController().signal,{assertCapability:()=>{}});delete process.env.XHS_DOWNLOADER_URL;
  assert.equal((await db.ingestJob.findUniqueOrThrow({where:{id:uncertain.job.dbId}})).lastError,'INGEST_RECOVERY_UNCERTAIN');checks.push('unknown-external-fetch-is-not-automatically-repeated');
  phase='saved-transaction-rollback';
  const output=await accept(),outputClaim=await claimIngestExecution(db,randomUUID(),{...policy,leaseMs:5000});assert.ok(outputClaim);
  getPrisma()!.$use(async(params,next)=>{if(params.model==='IngestEventRecord'&&params.action==='create'&&params.args.data.jobId===output.job.dbId&&params.args.data.snapshotJson.result)throw new Error('SYNTHETIC_RESULT_EVENT_FAILURE');return next(params);});
  await runDurableIngestPipeline(outputClaim.lease,new AbortController().signal,{assertCapability:()=>{}});
  const rolled=await db.ingestJob.findUniqueOrThrow({where:{id:output.job.dbId}});assert.equal(rolled.status,'failed');assert.equal((rolled.checkpointJson as any).phase,'rehosted');assert.equal(await db.inspiration.count({where:{jobId:output.job.dbId}}),0);checks.push('result-and-saved-checkpoint-rollback-when-event-fails');
  phase='managed-retry';
  const partial=await accept(),partialClaim=await claimIngestExecution(db,randomUUID(),{...policy,leaseMs:5000});assert.ok(partialClaim);
  process.env.INGEST_STUB_FAIL_STAGE='rehost';await runDurableIngestPipeline(partialClaim.lease,new AbortController().signal,{assertCapability:()=>{}});delete process.env.INGEST_STUB_FAIL_STAGE;
  const partialRow=await db.ingestJob.findUniqueOrThrow({where:{id:partial.job.dbId}}),partialSnapshot=partialRow.snapshotJson as any;
  assert.equal(partialRow.status,'failed');assert.equal(partialSnapshot.partial,true);assert.ok(partialSnapshot.result);
  const failedRetry=randomUUID();getPrisma()!.$use(async(params,next)=>{if(params.model==='IngestCommand'&&params.action==='create'&&params.args.data.operationId===failedRetry)throw new Error('SYNTHETIC_RETRY_COMMAND_FAILURE');return next(params);});
  const retry={userId:owner,jobId:partial.job.id,operationId:failedRetry,expectedAttempt:1,expectedVersion:partialRow.stateVersion};
  await assert.rejects(retryIngestCommand(retry));
  const preserved=await db.ingestJob.findUniqueOrThrow({where:{id:partial.job.dbId}});
  assert.deepEqual(preserved,partialRow);assert.equal(await db.ingestCommand.count({where:{operationId:failedRetry}}),0);
  retry.operationId=randomUUID();const retried=await retryIngestCommand(retry);assert.equal(retried.shouldRun,true);
  const reset=await db.ingestJob.findUniqueOrThrow({where:{id:partial.job.dbId}});assert.equal(reset.retryCount,1);assert.equal(reset.checkpointJson,null);assert.equal(reset.checkpointVersion,0);assert.equal(reset.executionPending,true);
  assert.equal((reset.snapshotJson as any).result.inspiration_id,partialSnapshot.result.inspiration_id);
  const retryClaim=await claimIngestExecution(db,randomUUID(),{...policy,leaseMs:5000});assert.ok(retryClaim);assert.equal(retryClaim.lease.attempt,2);
  assert.equal((await retryIngestCommand(retry)).shouldRun,false);assert.equal((await db.ingestJob.findUniqueOrThrow({where:{id:partial.job.dbId}})).leaseOwner,retryClaim.lease.workerId);
  await runDurableIngestPipeline(retryClaim.lease,new AbortController().signal,{assertCapability:()=>{}});
  const retriedResult=await db.ingestJob.findUniqueOrThrow({where:{id:partial.job.dbId}});assert.equal(retriedResult.status,'done');assert.equal(retriedResult.retryCount,1);
  assert.equal((retriedResult.snapshotJson as any).result.inspiration_id,partialSnapshot.result.inspiration_id);assert.equal(await db.inspiration.count({where:{jobId:partial.job.dbId}}),1);
  checks.push('managed-retry-atomic-reset-partial-preservation-new-attempt-and-replay-no-reset');
  phase='hung-provider-deadline';
  let requests=0;const server=createServer((req,res)=>{requests++;req.resume();res.writeHead(200,{'Content-Type':'application/json'});res.write('{"text":');});servers.push(server);
  server.listen(0,'127.0.0.1');await once(server,'listening');const address=server.address();assert.ok(address&&typeof address!=='string');
  process.env.XHS_DOWNLOADER_URL=`http://127.0.0.1:${address.port}/synthetic-hung-response`;
  const hung=await accept(),hungClaim=await claimIngestExecution(db,randomUUID(),{...policy,leaseMs:5000});assert.ok(hungClaim);
  const began=Date.now();await runDurableIngestPipeline(hungClaim.lease,new AbortController().signal,{assertCapability:()=>{},stepTimeoutMs:150});assert.ok(Date.now()-began<3000);
  const timedOut=await db.ingestJob.findUniqueOrThrow({where:{id:hung.job.dbId}});assert.equal(timedOut.lastError,'INGEST_STEP_OUTCOME_UNKNOWN');assert.equal(timedOut.executionPending,false);assert.equal((timedOut.checkpointJson as any).inFlightReplayable,false);assert.equal(requests,1);
  checks.push('hung-response-body-has-bounded-step-deadline-and-retains-unknown-effect');
  phase='actual-plugin-isolation-and-stop';
  const stopped=await accept();
  process.env.AUTH_RUNTIME_MODE='test';process.env.AUTH_PROVIDER='fixture';process.env.AUTH_TEST_ADAPTER_ENABLED='true';process.env.NODE_ENV='test';process.env.INGEST_WORKER_MODE='enabled';process.env.INGEST_RECOVERY_ISOLATED='true';process.env.INGEST_CONCURRENCY='1';
  const makeApp=async()=>{const app=Fastify({logger:false});apps.push(app);await app.register(ingestRoutes);await app.ready();return app;};
  const isolated=await makeApp();await sleep(150);assert.equal(requests,1);assert.equal((await db.ingestJob.findUniqueOrThrow({where:{id:stopped.job.dbId}})).leaseFence,0n);await isolated.close();
  process.env.INGEST_RECOVERY_ISOLATED='false';const active=await makeApp();await until(async()=>requests===2);await stopIngestWorker(active);assert.equal((await db.ingestJob.findUniqueOrThrow({where:{id:stopped.job.dbId}})).leaseOwner,null);await active.close();
  const released=await db.ingestJob.findUniqueOrThrow({where:{id:stopped.job.dbId}});assert.equal(released.leaseOwner,null);assert.equal(released.executionPending,true);assert.equal((released.checkpointJson as any).inFlightReplayable,false);
  process.env.AUTH_RUNTIME_MODE='staging';process.env.AUTH_PROVIDER='aliyun-pnvs';delete process.env.XHS_DOWNLOADER_URL;
  const next=await accept();process.env.AUTH_RUNTIME_MODE='test';process.env.AUTH_PROVIDER='fixture';
  const restored=await makeApp();await until(async()=>(await db.ingestJob.findUniqueOrThrow({where:{id:next.job.dbId}})).status==='done');await restored.close();
  assert.equal((await db.ingestJob.findUniqueOrThrow({where:{id:stopped.job.dbId}})).lastError,'INGEST_RECOVERY_UNCERTAIN');assert.equal(requests,2);
  checks.push('actual-fastify-ready-isolation-zero-claim-close-aborts-and-releases-next-start-recovers');
  checks.push('persisted-external-effect-survives-downloader-configuration-removal');
  phase='full-application-close-order';
  process.env.AUTH_RUNTIME_MODE='staging';process.env.AUTH_PROVIDER='aliyun-pnvs';const rootJob=await accept();
  process.env.AUTH_RUNTIME_MODE='test';process.env.AUTH_PROVIDER='fixture';process.env.XHS_DOWNLOADER_URL=`http://127.0.0.1:${address.port}/synthetic-hung-response`;
  assert.ok(!process.env.SENTRY_DSN&&!process.env.UNLEASH_URL&&!process.env.REDIS_URL,'full application probe forbids external integration configuration');
  const config=readAuthRuntimeConfig({AUTH_RUNTIME_MODE:'staging',AUTH_PROVIDER:'aliyun-pnvs',DATABASE_URL:process.env.DATABASE_URL,AUTH_PUBLIC_ORIGIN:'https://nomad.example',
   ALIBABA_CLOUD_ACCESS_KEY_ID:'synthetic-ak',ALIBABA_CLOUD_ACCESS_KEY_SECRET:'synthetic-secret',ALIYUN_PNVS_SIGN_NAME:'synthetic-sign',ALIYUN_PNVS_TEMPLATE_CODE:'100001',
   ALIYUN_PNVS_TEMPLATE_PARAM:'{"code":"##code##","min":"5"}',ALIYUN_PNVS_CAPTCHA_PLATFORM:'h5',ALIYUN_PNVS_CAPTCHA_APP_ID:'synthetic-app',ALIYUN_PNVS_CAPTCHA_APP_KEY:'synthetic-key'});
  const proof={async send(){throw new Error('NO_REAL_PROVIDER_ALLOWED');},async verify(){throw new Error('NO_REAL_PROVIDER_ALLOWED');},async verifyGraphic(){throw new Error('NO_REAL_PROVIDER_ALLOWED');}};
  const service=new PersistentAuthService(config,new PrismaAuthRepository(db),proof),globalDb=getPrisma()!;
  const originalDisconnect=globalDb.$disconnect.bind(globalDb);let disconnectObserved=false;
  globalDb.$disconnect=async()=>{const current=await db.ingestJob.findUniqueOrThrow({where:{id:rootJob.job.dbId}});assert.equal(current.leaseOwner,null);assert.equal(current.executionPending,true);disconnectObserved=true;await originalDisconnect();};
  restoreDisconnect=()=>{globalDb.$disconnect=originalDisconnect;};
  const full=await buildApplication(config,service);apps.push(full);await full.ready();await until(async()=>requests===3);await full.close();assert.equal(disconnectObserved,true);restoreDisconnect();restoreDisconnect=undefined;
  checks.push('full-buildApplication-close-releases-active-worker-before-prisma-disconnect');
  process.env.AUTH_RUNTIME_MODE='staging';process.env.AUTH_PROVIDER='aliyun-pnvs';
  // Preserve the deliberately interrupted fixture but remove it from this probe's next claim candidate set.
  await db.ingestJob.update({where:{id:rootJob.job.dbId},data:{executionPending:false}});
  phase='pure-to-external-adapter-change';
  const changedAdapter=await accept(),changedClaim=await claimIngestExecution(db,randomUUID(),{...policy,leaseMs:5000});assert.ok(changedClaim);
  await commitIngestCheckpoint(db,changedClaim.lease,{...checkpointFromRow(changedClaim.row),inFlight:'fetch',inFlightReplayable:true},{state:'fetching'});
  await runDurableIngestPipeline(changedClaim.lease,new AbortController().signal,{assertCapability:()=>{}});
  assert.equal((await db.ingestJob.findUniqueOrThrow({where:{id:changedAdapter.job.dbId}})).lastError,'INGEST_CHECKPOINT_ADAPTER_CHANGED');assert.equal(requests,3);
  checks.push('new-external-adapter-does-not-replace-a-recorded-pure-inflight-step');
  console.log(JSON.stringify({result:'passed',checks,realProviderCalls:0,adapters:'explicit-injected-fixture-capability-with-real-pg-owner-checks',realProcessKills:4,appLifecycleVerified:true,appLifecycleProfile:'explicit-fixture-adapters-with-actual-fastify-hooks-and-full-application-close-order',sseReplayVerified:false,nativeVerified:false}));
 }catch(error){console.log(JSON.stringify({result:'failed',phase,errorCode:error instanceof AuthFault?error.code:'PROBE_ASSERTION_OR_DATABASE_ERROR'}));process.exitCode=1;}
 finally{restoreDisconnect?.();for(const child of children)child.kill('SIGKILL');for(const app of apps)await app.close();for(const server of servers){server.closeAllConnections();if(server.listening)await new Promise<void>(resolve=>server.close(()=>resolve()));}for(const [name,value] of savedEnv){if(value===undefined)delete process.env[name];else process.env[name]=value;}await db.ingestJob.updateMany({where:{userId:owner},data:{executionPending:false,leaseOwner:null,leaseExpiresAt:null}});await db.$disconnect();await getPrisma()?.$disconnect();}
}
