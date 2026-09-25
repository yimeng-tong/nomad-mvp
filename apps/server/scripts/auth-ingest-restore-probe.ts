/** Isolated active-checkpoint dump/restore proof; no deployed database or real provider calls. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
import {PrismaClient} from '@prisma/client';
import Fastify from 'fastify';
import ingestRoutes from '../src/routes/ingest.js';
import {acceptIngestCommand} from '../src/ingest/store.js';
import {claimIngestExecution} from '../src/ingest/execution-lease.js';
import {checkpointFromRow,commitIngestCheckpoint} from '../src/ingest/execution-checkpoint.js';
import {resolveIngestExecutionPolicy} from '../src/ingest/execution-policy.js';
import {getPrisma} from '../src/db/prisma.js';
assert.equal(process.env.AUTH_TEST_DATABASE_ACK,'isolated-synthetic-only');
assert.match(new URL(process.env.DATABASE_URL!).pathname,/^\/nomad_auth_test_[a-f0-9]+_recovery_(src|copy)$/);
const [mode,statePath]=process.argv.slice(2);assert.ok(statePath?.startsWith('/tmp/nomad-ingest-restore-'));
const db=new PrismaClient(),apps:ReturnType<typeof Fastify>[]=[];
const encode=(value:unknown)=>JSON.stringify(value,(_key,value)=>typeof value==='bigint'?value.toString():value);
const facts=async()=>({users:await db.user.findMany({orderBy:{id:'asc'}}),jobs:await db.ingestJob.findMany({orderBy:{id:'asc'}}),events:await db.ingestEventRecord.findMany({orderBy:[{jobId:'asc'},{seq:'asc'}]}),commands:await db.ingestCommand.findMany({orderBy:{operationId:'asc'}}),results:await db.inspiration.findMany({orderBy:{id:'asc'}})});
const hash=(text:string)=>createHash('sha256').update(text).digest('hex');
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
const policy=resolveIngestExecutionPolicy({INGEST_WORKER_MODE:'enabled',INGEST_RECOVERY_ISOLATED:'false',INGEST_LEASE_MS:'1000'});
try{
 process.env.AUTH_RUNTIME_MODE='staging';process.env.AUTH_PROVIDER='aliyun-pnvs';delete process.env.XHS_DOWNLOADER_URL;
 if(mode==='seed'){
  assert.equal(await db.user.count(),0);
  const owner=randomUUID(),disabled=randomUUID();await db.user.createMany({data:[{id:owner,authState:'active'},{id:disabled,authState:'active'}]});
  const accepted=await acceptIngestCommand({userId:owner,sourceUrl:`https://xhslink.com/${randomUUID()}`,traceId:randomUUID(),operationId:randomUUID()});
  const claimed=await claimIngestExecution(db,randomUUID(),policy);assert.ok(claimed);assert.equal(claimed.row.id,accepted.job.dbId);
  const initial=checkpointFromRow(claimed.row);
  await commitIngestCheckpoint(db,claimed.lease,{...initial,inFlight:'fetch',inFlightReplayable:true},{state:'fetching'});
  await commitIngestCheckpoint(db,claimed.lease,{...initial,phase:'fetched',post:{title:'Restored synthetic checkpoint',text:'Synthetic saved fetch',media:[]}},{state:'parsing'});
  const denied=await acceptIngestCommand({userId:disabled,sourceUrl:`https://xhslink.com/${randomUUID()}`,traceId:randomUUID(),operationId:randomUUID()});
  await db.user.update({where:{id:disabled},data:{authState:'disabled',authVersion:{increment:1}}});
  const baseline=encode(await facts());await writeFile(statePath,encode({owner,disabled,job:accepted.job.dbId,denied:denied.job.dbId,baseline}),{mode:0o600});
  console.log(JSON.stringify({result:'seeded',nonterminalJobs:2,checkpoint:'fetched',baselineSha256:hash(baseline)}));
 }else{
  const state=JSON.parse(await readFile(statePath,'utf8')),before=encode(await facts());assert.equal(before,state.baseline);
  if(mode==='source-unchanged'){console.log(JSON.stringify({result:'passed',sourceUnchanged:true,baselineSha256:hash(before)}));}
  else{
   assert.equal(mode,'verify');const checks=['restored-users-jobs-events-seq-floor-lease-checkpoint-command-exactly-match-source'];
   process.env.AUTH_RUNTIME_MODE='test';process.env.AUTH_PROVIDER='fixture';process.env.AUTH_TEST_ADAPTER_ENABLED='true';process.env.NODE_ENV='test';process.env.INGEST_WORKER_MODE='enabled';process.env.INGEST_RECOVERY_ISOLATED='true';process.env.INGEST_POLL_MS='100';process.env.INGEST_CONCURRENCY='1';
   const makeApp=async()=>{const app=Fastify({logger:false});apps.push(app);await app.register(ingestRoutes);await app.ready();return app;};
   const isolated=await makeApp();await sleep(1300);assert.equal(encode(await facts()),before);await isolated.close();checks.push('restored-fastify-start-with-expired-active-checkpoint-and-disabled-owner-dispatches-zero');
   // Suppression is checked before enabling the synthetic worker, not inferred after the fact.
   assert.equal((await db.user.findUniqueOrThrow({where:{id:state.disabled}})).authState,'disabled');
   const deniedBefore=encode(await db.ingestJob.findUniqueOrThrow({where:{id:state.denied}}));
   process.env.INGEST_RECOVERY_ISOLATED='false';process.env.INGEST_STUB_FAIL_STAGE='fetch';const active=await makeApp();
   const deadline=Date.now()+15000;let row;
   for(;;){row=await db.ingestJob.findUniqueOrThrow({where:{id:state.job}});if(['done','failed'].includes(row.status))break;assert.ok(Date.now()<deadline);await sleep(30);}
   await active.close();assert.equal(row.status,'done');assert.equal(row.retryCount,0);assert.equal(row.executionPending,false);assert.ok(row.leaseFence>BigInt(JSON.parse(before).jobs.find((job:any)=>job.id===state.job).leaseFence));
   assert.equal(await db.inspiration.count({where:{jobId:state.job}}),1);assert.equal(await db.ingestCommand.count(),2);assert.equal(await db.ingestJob.count(),2);
   assert.equal(encode(await db.ingestJob.findUniqueOrThrow({where:{id:state.denied}})),deniedBefore);
   const events=await db.ingestEventRecord.findMany({where:{jobId:state.job},orderBy:{seq:'asc'}});assert.deepEqual(events.map(event=>event.seq.toString()),events.map((_event,index)=>String(index+1)));
   checks.push('controlled-enable-resumes-original-fetched-checkpoint-with-fetch-disabled-and-no-new-job-attempt-command');checks.push('disabled-owner-remains-suppressed-after-worker-enable');
   console.log(JSON.stringify({result:'passed',checks,realProviderCalls:0,productionPitrVerified:false,activeCheckpointRestoreVerified:true}));
  }
 }
}catch(error){console.log(JSON.stringify({result:'failed',stage:mode,code:(error as {code?:string}).code??'PROBE_ASSERTION'}));process.exitCode=1;}
finally{for(const app of apps)await app.close();await db.$disconnect();await getPrisma()?.$disconnect();}
