/** Controlled staging read/recovery baseline. Synthetic data/auth issuance; no provider or public TLS claims. */
import assert from 'node:assert/strict';
import {openBenchmarkStream} from './benchmark-stream.js';
import {randomUUID,createHash} from 'node:crypto';
import {readFile,readdir} from 'node:fs/promises';
import {cpus,totalmem,release} from 'node:os';
import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {PrismaClient,Prisma} from '@prisma/client';
import {newCredential,nativeCredentialHash} from '../src/auth/credentials.js';
import {getPrisma} from '../src/db/prisma.js';
import {acceptIngestCommand} from '../src/ingest/store.js';
import {encodeIngestCursor} from '../src/ingest/cursor.js';
import type {IngestSnapshot} from '../src/ingest/job-state.js';
assert.equal(process.env.AUTH_TEST_DATABASE_ACK,'isolated-synthetic-only');
const databaseName=new URL(process.env.DATABASE_URL!).pathname.slice(1);assert.match(databaseName,/^nomad_auth_test_[a-z0-9_]+$/);
process.env.AUTH_RUNTIME_MODE='staging';process.env.AUTH_PROVIDER='aliyun-pnvs';process.env.INGEST_WORKER_MODE='disabled';process.env.INGEST_RECOVERY_ISOLATED='true';
const origin='https://nomad.example',db=new PrismaClient(),sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
const until=async(check:()=>Promise<boolean>|boolean,timeout=20000)=>{const end=Date.now()+timeout;while(!await check()){if(Date.now()>end)throw new Error('PROBE_TIMEOUT');await sleep(20);}};
 const children=new Set<ChildProcess>(),readers:Array<{close:()=>void}>=[],checks:string[]=[],owner=randomUUID(),other=randomUUID();let phase='setup';let diagnostics:Record<string,unknown>={};
 const launch=async()=>{
  const child=spawn(process.execPath,['--import','tsx','scripts/auth-ingest-sse-probe.ts'],{cwd:process.cwd(),env:{...process.env,INGEST_SSE_PROBE_CHILD:'1'},stdio:['ignore','pipe','pipe']});children.add(child);
  let buffer='',record:any;child.stdout!.on('data',chunk=>{buffer+=chunk;const end=buffer.indexOf('\n');if(end>=0&&!record){try{record=JSON.parse(buffer.slice(0,end));}catch{}}});child.stderr!.resume();child.once('exit',()=>children.delete(child));
  await until(()=>{if(child.exitCode!==null)throw new Error('CHILD_EXITED');return !!record;});return {...record,child} as {port:number;pid:number;child:ChildProcess};
 };
 const stop=async(child:ChildProcess,signal:'SIGTERM'|'SIGKILL'='SIGTERM')=>{if(child.exitCode!==null||child.signalCode!==null)return;const exit=once(child,'exit');void exit.catch(()=>{});child.kill(signal);const wait=async(ms:number)=>{let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([exit.then(()=>true),new Promise<boolean>(resolve=>{timer=setTimeout(()=>resolve(false),ms);})]);}finally{if(timer)clearTimeout(timer);}};if(!await wait(5000)){child.kill('SIGKILL');if(!await wait(5000))throw new Error('CHILD_STOP_TIMEOUT');}};
 const session=async(userId:string)=>{
  const secret=newCredential(),binding=randomUUID().replaceAll('-','')+randomUUID().replaceAll('-','');await db.authBrowser.create({data:{bindingHash:binding,sessionGeneration:1}});
  const row=await db.session.create({data:{userId,transport:'native',audience:origin,credentialHash:nativeCredentialHash(secret,origin),browserBindingHash:binding,browserGeneration:1,expiresAt:new Date(Date.now()+300000)}});
  return {id:row.id,headers:{authorization:`Bearer ${secret}`,'x-nomad-auth-audience':origin,'x-forwarded-proto':'https','x-auth-user-id':userId,'x-auth-session-id':row.id}};
 };
 const accept=()=>acceptIngestCommand({enqueue:false,userId:owner,sourceUrl:`https://xhslink.com/${randomUUID()}`,traceId:randomUUID(),operationId:randomUUID()});
 const open=async(port:number,jobId:string,headers:Record<string,string>,cursor?:string)=>{
  const url=`http://127.0.0.1:${port}/ingest/${jobId}/events`+(cursor?`?last_event_id=${encodeURIComponent(cursor)}`:'');
  const result=await openBenchmarkStream(url,headers);readers.push(result);return result;
 };

const collect=async(directory:string):Promise<string[]>=>{const entries=await readdir(directory,{withFileTypes:true});const groups=await Promise.all(entries.map(entry=>entry.isDirectory()?collect(`${directory}/${entry.name}`):/\.(ts|json)$/.test(entry.name)?[`${directory}/${entry.name}`]:[]));return groups.flat().sort();};
let files:string[]=[];
const fingerprints=async()=>Object.fromEntries(await Promise.all(files.map(async file=>{const bytes=await readFile(file);return [file,createHash('sha256').update(bytes).digest('hex')];})));
let sourceSha256:Record<string,string>|null=null,postgresVersion:string|null=null;let report:Record<string,unknown>|undefined;
const clockId=randomUUID(),startedAt=new Date().toISOString(),windowStartMs=performance.now();
type Sample={variant:string;repeat:number;outcome:'passed'|'failed';expectedEvents:number;receivedEvents:number;firstEventMs:number|null;completeMs:number|null;serverStartMs:number|null;errorCode?:string};
const samples:Sample[]=[];
const quantiles=(values:number[])=>{values.sort((a,b)=>a-b);return {n:values.length,p50:values.length?values[Math.ceil(.5*values.length)-1]:null,p95:values.length?values[Math.ceil(.95*values.length)-1]:null};};
const variants=[{id:'full-replay',cursor:0},{id:'tail-replay',cursor:142},{id:'terminal-head',cursor:152},{id:'server-restart',cursor:100}];
try{
 files=[...await collect('src'),'scripts/auth-ingest-recovery-benchmark.ts','scripts/auth-ingest-sse-probe.ts','scripts/benchmark-stream.ts'];sourceSha256=await fingerprints();postgresVersion=(await db.$queryRaw<Array<{server_version:string}>>`SHOW server_version`)[0].server_version;
 await db.user.createMany({data:[{id:owner,authState:'active'},{id:other,authState:'active'}]});const own=await session(owner);let a=await launch();
 const initialStart=(await db.$queryRaw<Array<{started:Date}>>`SELECT pg_postmaster_start_time() AS started`)[0].started.toISOString();
 for(let repeat=1;repeat<=3;repeat++){
  const {job}=await accept(),row=await db.ingestJob.findUniqueOrThrow({where:{id:job.dbId}});
  // Deterministic read workload, not an import-provider or production-writer benchmark.
  await db.$transaction(async tx=>{
   const records:Prisma.IngestEventRecordCreateManyInput[]=[];let last=row.snapshotJson as unknown as IngestSnapshot;
   for(let index=1;index<=151;index++){
    const terminal=index===151;last={...last,state:terminal?'failed':'parsing',state_version:index,parsed_count:Math.min(index,150),error_code:terminal?'INGEST_SYNTHETIC_TERMINAL':undefined,retriable:terminal,actions:{retry:terminal,view:false},head_cursor:encodeIngestCursor(row.eventStreamId!,BigInt(index+1))};
    records.push({jobId:row.id,seq:BigInt(index+1),schemaVersion:1,kind:'fact',attempt:1,stateVersion:index,stage:last.state,subStage:null,traceId:row.id,occurredAt:new Date(),snapshotJson:last as unknown as Prisma.InputJsonValue});
   }
   await tx.ingestEventRecord.createMany({data:records});await tx.ingestJob.update({where:{id:row.id},data:{status:'failed',stateVersion:151,lastEventSeq:152n,snapshotJson:last as unknown as Prisma.InputJsonValue}});
  });
  for(const variant of variants){
   phase=`${variant.id}-${repeat}`;let serverStartMs:number|null=null;const sample:Sample={variant:variant.id,repeat,outcome:'failed',expectedEvents:152-variant.cursor,receivedEvents:0,firstEventMs:null,completeMs:null,serverStartMs};
   let stream:Awaited<ReturnType<typeof open>>|undefined,requestStartedMs:number|undefined;
   try{
    if(variant.id==='server-restart'){const starting=performance.now();await stop(a.child,'SIGKILL');a=await launch();serverStartMs=performance.now()-starting;}
    const began=requestStartedMs=performance.now();stream=await open(a.port,job.id,own.headers,encodeIngestCursor(row.eventStreamId!,BigInt(variant.cursor)));await until(()=>stream!.ended(),15000);await stream.done;if(stream.error()||!stream.naturalEnd())throw new Error('BASELINE_STREAM_FAILED');
    const events=stream.events(),controls=stream.frames.filter(frame=>frame.event==='ingest_control');sample.receivedEvents=events.length;assert.equal(events.length,sample.expectedEvents);
    assert.deepEqual(events.map(frame=>(frame.data as {seq:string}).seq),Array.from({length:sample.expectedEvents},(_,i)=>String(i+variant.cursor+1)));assert.equal(controls.length,1);assert.equal((controls[0].data as {kind:string}).kind,'complete');assert.equal(stream.frames.at(-1)?.event,'ingest_control');
    sample.outcome='passed';sample.firstEventMs=events.length?events[0].at-began:null;sample.completeMs=controls[0].at-began;sample.serverStartMs=serverStartMs;
   }catch{sample.errorCode='BASELINE_CASE_FAILED';}finally{if(stream){const received=stream.events();sample.receivedEvents=received.length;sample.firstEventMs=received.length&&requestStartedMs!==undefined?received[0].at-requestStartedMs:null;}sample.serverStartMs=serverStartMs;stream?.close();samples.push(sample);}
   if(sample.outcome==='failed')throw new Error('BASELINE_CASE_FAILED');
  }
 }
 const after=(await db.$queryRaw<Array<{started:Date}>>`SELECT pg_postmaster_start_time() AS started`)[0].started.toISOString();assert.equal(after,initialStart);assert.deepEqual(await fingerprints(),sourceSha256);
 const summaries=Object.fromEntries(variants.map(variant=>{const group=samples.filter(sample=>sample.variant===variant.id);return [variant.id,{planned:3,observed:group.length,failed:group.filter(s=>s.outcome==='failed').length,firstEventMs:quantiles(group.flatMap(s=>s.outcome!=='passed'||s.firstEventMs===null?[]:[s.firstEventMs])),completeMs:quantiles(group.flatMap(s=>s.outcome!=='passed'||s.completeMs===null?[]:[s.completeMs])),serverStartMs:quantiles(group.flatMap(s=>s.outcome!=='passed'||s.serverStartMs===null?[]:[s.serverStartMs]))}];}));
 report={result:samples.every(s=>s.outcome==='passed')?'passed':'failed',workload:'WL-RECOVERY-SERVER',version:'homelab-loopback-v1',profile:'controlled-staging-synthetic-data',sourceEncoding:'runner-normalized-UTF8-LF',clockId,startedAt,endedAt:new Date().toISOString(),windowStartMs,windowEndMs:performance.now(),plan:{variants,repeats:3,n:12,eventsPerJob:152,concurrency:1,caseDeadlineMs:15000},samples,summaries,quantileMethod:'nearest-rank-ceil-p-times-n',sourceSha256,environment:{node:process.version,postgres:postgresVersion,os:release(),cpuCount:cpus().length,memoryBytes:totalmem(),cpuPinned:false,network:'same-VM-loopback-HTTP-with-explicit-trusted-proxy-header',otherServicesQuiesced:false},seededJobs:3,newJobPosts:0,measuredApi:'read-only-SSE-replay',realProviderCalls:0,usage:null,cost:null,clientDurableAckMeasured:false,productionTargetApproved:false,publicTlsVerified:false,baselineScope:'real-PG-and-real-staging-mode-server-processes-on-VM104; isolated-database and synthetic session issuance; not deployed-production workload'};
 if(samples.some(s=>s.outcome==='failed'))process.exitCode=1;
}catch{report={result:'failed',phase,errorCode:'BASELINE_SETUP_OR_INVARIANT_FAILED',workload:'WL-RECOVERY-SERVER',version:'homelab-loopback-v1',profile:'controlled-staging-synthetic-data',sourceEncoding:'runner-normalized-UTF8-LF',clockId,startedAt,endedAt:new Date().toISOString(),windowStartMs,windowEndMs:performance.now(),plan:{variants,repeats:3,n:12,eventsPerJob:152,concurrency:1,caseDeadlineMs:15000},sourceSha256,environment:{node:process.version,postgres:postgresVersion,os:release(),cpuCount:cpus().length,memoryBytes:totalmem(),cpuPinned:false,network:'same-VM-loopback-HTTP-with-explicit-trusted-proxy-header',otherServicesQuiesced:false},coverage:{planned:12,observed:samples.length,missing:12-samples.length},samples,usage:null,cost:null,realProviderCalls:0,clientDurableAckMeasured:false,productionTargetApproved:false,publicTlsVerified:false};process.exitCode=1;}
finally{
 for(const reader of readers)reader.close();let cleanupFailed=false;
 for(const child of children)try{await stop(child);}catch{cleanupFailed=true;}
 try{await db.$disconnect();await getPrisma()?.$disconnect();}catch{cleanupFailed=true;}
 if(report){report.cleanupComplete=!cleanupFailed;if(cleanupFailed){report.result='failed';process.exitCode=1;}console.log(JSON.stringify(report));}
}
