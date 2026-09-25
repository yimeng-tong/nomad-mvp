import assert from 'node:assert/strict';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import authPlugin from '../src/plugins/auth.js';
import errors from '../src/plugins/error-envelope.js';
import ingestRoutes from '../src/routes/ingest.js';
import { PrismaAuthRepository } from '../src/auth/prisma-repository.js';
import { PersistentAuthService } from '../src/auth/service.js';
import { readAuthRuntimeConfig } from '../src/auth/runtime-config.js';
import { newCredential,nativeCredentialHash } from '../src/auth/credentials.js';
import { randomUUID } from 'node:crypto';
import { PrismaClient, type Prisma } from '@prisma/client';
import { AuthFault } from '../src/auth/errors.js';
import { getPrisma } from '../src/db/prisma.js';
import { acceptIngestCommand,appendIngestEvent,retryIngestCommand } from '../src/ingest/store.js';
import { readIngestRecovery,readIngestReplayPage } from '../src/ingest/event-replay.js';
import { encodeIngestCursor } from '../src/ingest/cursor.js';
import type { IngestSnapshot } from '../src/ingest/job-state.js';
assert.equal(process.env.AUTH_TEST_DATABASE_ACK,'isolated-synthetic-only');
assert.match(new URL(process.env.DATABASE_URL!).pathname,/^\/nomad_auth_test_[a-z0-9_]+$/);
process.env.AUTH_RUNTIME_MODE='staging';process.env.AUTH_PROVIDER='aliyun-pnvs';
const db=new PrismaClient(),owner=randomUUID(),other=randomUUID(),checks:string[]=[];
const fault=(code:string)=>(error:unknown)=>error instanceof AuthFault&&error.code===code;
let phase='setup',payloadReads=0;
let app:ReturnType<typeof Fastify>|undefined;
getPrisma()!.$use(async(params,next)=>{if(params.model==='IngestEventRecord'&&params.action.startsWith('find'))payloadReads++;return next(params);});
try{
 await db.user.createMany({data:[{id:owner,authState:'active'},{id:other,authState:'active'}]});
 const {job}=await acceptIngestCommand({enqueue:false,userId:owner,sourceUrl:`https://xhslink.com/${randomUUID()}`,traceId:randomUUID(),operationId:randomUUID()});
 await appendIngestEvent(job.id,{state:'parsing',sub_stage:'asr'},1);
 for(let i=0;i<150;i++)await appendIngestEvent(job.id,{state:'parsing',parsed_count:i},1);
 phase='owner-before-cursor-and-payload';
 const count=payloadReads;
 await assert.rejects(readIngestReplayPage(other,job.id,'malformed'),fault('INGEST_JOB_NOT_FOUND'));
 await assert.rejects(readIngestRecovery(other,job.id,{mode:'resync',cursor:'malformed'}),fault('INGEST_JOB_NOT_FOUND'));
 assert.equal(payloadReads,count);checks.push('wrong-owner-before-cursor-and-zero-event-payload-read');
 phase='recover';
 const initial=await readIngestRecovery(owner,job.id);assert.equal(initial.mode,'replay');
 const row=await db.ingestJob.findUniqueOrThrow({where:{id:job.dbId}});
 assert.equal(initial.cursor,encodeIngestCursor(row.eventStreamId!,0n));assert.equal(initial.head_seq,'152');
 const resync=await readIngestRecovery(owner,job.id,{mode:'resync'});assert.equal(resync.mode,'resync');
 if(resync.mode==='resync'){assert.equal(resync.reason,'checkpoint_missing');assert.equal(resync.snapshot.head_cursor,resync.cursor);assert.equal(resync.snapshot.state_version,row.stateVersion);}
 assert.equal(await db.ingestJob.count({where:{userId:owner}}),1);assert.equal(row.executionPending,false);
 checks.push('recovery-does-not-ack-head-or-dispatch-and-explicit-resync-is-coherent');
 for(const value of ['0',null,[],encodeIngestCursor(randomUUID(),0n),encodeIngestCursor(row.eventStreamId!,999n)]){
  const code=typeof value==='string'&&value.startsWith('i1:')?(value.endsWith(':999')?'INGEST_CURSOR_AHEAD':'INGEST_CURSOR_JOB_MISMATCH'):'INGEST_CURSOR_INVALID';
  await assert.rejects(readIngestReplayPage(owner,job.id,value),fault(code));
 }
 await assert.rejects(readIngestRecovery(owner,job.id,{cursor:initial.cursor,headerCursor:initial.head_cursor}),fault('INGEST_CURSOR_INVALID'));
 await assert.rejects(readIngestRecovery(owner,job.id,{mode:'resync',cursor:initial.cursor}),fault('INGEST_CURSOR_INVALID'));
 await assert.rejects(readIngestRecovery(owner,job.id,{mode:['replay','resync']}),fault('INGEST_RECOVERY_MODE_INVALID'));
 checks.push('malformed-conflicting-foreign-and-ahead-cursors-rejected');
 phase='paged-replay-and-live-append';
 let cursor=initial.cursor;const seqs:string[]=[];let pages=0;
 for(;;){
  const page=await readIngestReplayPage(owner,job.id,cursor);assert.equal(page.mode,'replay');
  if(page.mode!=='replay')throw new Error('unexpected resync');
  assert.ok(page.events.length<=20);assert.equal(page.complete,null);
  seqs.push(...page.events.map(event=>event.seq));cursor=page.cursor;pages++;
  if(pages===1)await appendIngestEvent(job.id,{state:'parsing',parsed_count:151},1);
  if(cursor===page.headCursor)break;
 }
 assert.deepEqual(seqs,Array.from({length:153},(_,i)=>String(i+1)));assert.ok(pages>7);
 const empty=await readIngestReplayPage(owner,job.id,cursor);assert.equal(empty.mode,'replay');if(empty.mode==='replay')assert.equal(empty.events.length,0);
 checks.push('more-than-128-events-paged-in-order-with-between-page-commit-and-empty-tail');
 phase='old-terminal-new-attempt';
 const failed=await appendIngestEvent(job.id,{state:'failed',error_code:'INGEST_SYNTHETIC_RETRY',retriable:true},1);
 await retryIngestCommand({enqueue:false,userId:owner,jobId:job.id,operationId:randomUUID(),expectedAttempt:1,expectedVersion:failed.state_version});
 const running=await readIngestReplayPage(owner,job.id,cursor);assert.equal(running.mode,'replay');
 if(running.mode==='replay'){assert.equal(running.events.length,2);assert.equal(running.events[0].state,'failed');assert.equal(running.events[1].attempt,2);assert.equal(running.complete,null);cursor=running.cursor;}
 await appendIngestEvent(job.id,{state:'failed',error_code:'INGEST_TEST_COMPLETE'},2);
 const terminal=await readIngestReplayPage(owner,job.id,cursor);assert.equal(terminal.mode,'replay');
 if(terminal.mode==='replay'){assert.equal(terminal.events.length,1);assert.equal(terminal.complete?.attempt,2);cursor=terminal.cursor;}
 const completed=await readIngestReplayPage(owner,job.id,cursor);assert.equal(completed.mode,'replay');
 if(completed.mode==='replay'){assert.equal(completed.events.length,0);assert.equal(completed.complete?.cursor,cursor);}
 checks.push('old-attempt-terminal-does-not-complete-running-retry-and-confirmed-head-is-not-resent');
 phase='retention';
 const latest=await db.ingestJob.findUniqueOrThrow({where:{id:job.dbId}});
 await db.ingestJob.update({where:{id:job.dbId},data:{replayFloorSeq:latest.lastEventSeq-1n}});
 const expired=await readIngestRecovery(owner,job.id,{cursor:initial.cursor});assert.equal(expired.mode,'resync');
 if(expired.mode==='resync'){assert.equal(expired.reason,'retention');assert.equal(expired.cursor,cursor);assert.equal(expired.snapshot.head_cursor,cursor);}
 const expiredPage=await readIngestReplayPage(owner,job.id,initial.cursor);assert.equal(expiredPage.mode,'resync');
 checks.push('expired-floor-requires-explicit-resync-control');
 phase='legacy';
 const legacyId=randomUUID();await db.ingestJob.create({data:{id:legacyId,userId:owner,authVersion:0,sourceType:'xhs',sourceHash:randomUUID(),status:'failed'}});
 const legacy=await readIngestRecovery(owner,`ing_${legacyId}`,{mode:'resync'});assert.equal(legacy.head_seq,'1');
 assert.equal(await db.ingestEventRecord.count({where:{jobId:legacyId,kind:'checkpoint'}}),1);
 checks.push('legacy-recovery-adopts-one-current-checkpoint-without-fabricated-history');
 phase='protected-http-recovery';
 const origin='https://nomad.example';
 const config=readAuthRuntimeConfig({AUTH_RUNTIME_MODE:'staging',AUTH_PROVIDER:'aliyun-pnvs',DATABASE_URL:process.env.DATABASE_URL,
  AUTH_NATIVE_ENABLED:'true',AUTH_TRUSTED_PROXY_CIDRS:'127.0.0.1/32',AUTH_PUBLIC_ORIGIN:origin,
  AUTH_PRIVACY_URL:`${origin}/synthetic/privacy`,AUTH_USER_AGREEMENT_URL:`${origin}/synthetic/terms`,
  ALIBABA_CLOUD_ACCESS_KEY_ID:'synthetic-ak',ALIBABA_CLOUD_ACCESS_KEY_SECRET:'synthetic-secret',ALIYUN_PNVS_SIGN_NAME:'synthetic-sign',ALIYUN_PNVS_TEMPLATE_CODE:'100001',
  ALIYUN_PNVS_TEMPLATE_PARAM:'{"code":"##code##","min":"5"}',ALIYUN_PNVS_CAPTCHA_PLATFORM:'h5',ALIYUN_PNVS_CAPTCHA_APP_ID:'synthetic-app',ALIYUN_PNVS_CAPTCHA_APP_KEY:'synthetic-key'});
 const service=new PersistentAuthService(config,new PrismaAuthRepository(db),{async send(){throw new Error('NO_PROVIDER_CALL_ALLOWED');},async verify(){throw new Error('NO_PROVIDER_CALL_ALLOWED');},async verifyGraphic(){throw new Error('NO_PROVIDER_CALL_ALLOWED');}});
 app=Fastify({logger:false,trustProxy:config.trustProxy});await app.register(cookie);await app.register(errors);await app.register(authPlugin,{service});await app.register(ingestRoutes);await app.ready();
 const seedSession=async(userId:string)=>{
  const secret=newCredential(),binding=randomUUID().replaceAll('-','')+randomUUID().replaceAll('-','');
  await db.authBrowser.create({data:{bindingHash:binding,sessionGeneration:1}});
  const session=await db.session.create({data:{userId,transport:'native',audience:origin,credentialHash:nativeCredentialHash(secret,origin),browserBindingHash:binding,browserGeneration:1,authVersion:0,expiresAt:new Date(Date.now()+60000)}});
  return {session,headers:{authorization:`Bearer ${secret}`,'x-nomad-auth-audience':origin,'x-forwarded-proto':'https','x-auth-user-id':userId,'x-auth-session-id':session.id}};
 };
 const ownSession=await seedSession(owner),otherSession=await seedSession(other),url=`/ingest/${job.id}/recovery`;
 assert.equal((await app.inject({method:'GET',url})).statusCode,401);
 const response=await app.inject({method:'GET',url:url+'?mode=resync',headers:ownSession.headers});
 assert.equal(response.statusCode,200);assert.equal(response.headers['cache-control'],'no-store');assert.equal(response.json().snapshot.head_cursor,response.json().cursor);
 const beforeWrong=payloadReads;
 assert.equal((await app.inject({method:'GET',url:url+'?last_event_id=malformed',headers:otherSession.headers})).statusCode,404);assert.equal(payloadReads,beforeWrong);
 assert.equal((await app.inject({method:'GET',url:url+'?mode=replay&mode=resync',headers:ownSession.headers})).statusCode,400);
 assert.equal((await app.inject({method:'GET',url:url+'?last_event_id='+encodeURIComponent(cursor)+'&last_event_id='+encodeURIComponent(cursor),headers:ownSession.headers})).statusCode,400);
 await db.session.update({where:{id:ownSession.session.id},data:{revokedAt:new Date()}});
 assert.equal((await app.inject({method:'GET',url,headers:ownSession.headers})).statusCode,401);
 checks.push('actual-recovery-route-with-pg-session-auth-owner-duplicate-parameter-and-revocation-checks');
 phase='gap';
 const gapJob=(await acceptIngestCommand({enqueue:false,userId:owner,sourceUrl:`https://xhslink.com/${randomUUID()}`,traceId:randomUUID(),operationId:randomUUID()})).job;
 const gapRow=await db.ingestJob.findUniqueOrThrow({where:{id:gapJob.dbId}});
 const snapshot={...(gapRow.snapshotJson as unknown as IngestSnapshot),state_version:gapRow.stateVersion+1,head_cursor:encodeIngestCursor(gapRow.eventStreamId!,3n)};
 await db.$transaction(async tx=>{
  await tx.ingestJob.update({where:{id:gapRow.id},data:{lastEventSeq:3n,stateVersion:snapshot.state_version,snapshotJson:snapshot as Prisma.InputJsonValue}});
  await tx.ingestEventRecord.create({data:{jobId:gapRow.id,seq:3n,kind:'fact',attempt:1,stateVersion:snapshot.state_version,stage:'created',traceId:gapRow.id,snapshotJson:snapshot as Prisma.InputJsonValue}});
 });
 await assert.rejects(readIngestReplayPage(owner,gapJob.id),fault('INGEST_EVENT_STATE_UNAVAILABLE'));
 checks.push('missing-internal-event-never-silently-skipped');
 await db.user.update({where:{id:owner},data:{authState:'disabled'}});
 await assert.rejects(readIngestReplayPage(owner,job.id,cursor),fault('AUTH_ACCOUNT_UNAVAILABLE'));
 checks.push('tail-read-rechecks-current-owner-qualification');
 console.log(JSON.stringify({result:'passed',checks,realProviderCalls:0,syntheticFloorWithoutDeletion:true,sseSocketReplayVerified:false,clientDurableAckVerified:false}));
}catch(error){console.log(JSON.stringify({result:'failed',phase,errorCode:error instanceof AuthFault?error.code:'PROBE_ASSERTION_OR_DATABASE_ERROR'}));process.exitCode=1;}
finally{await app?.close();await db.$disconnect();await getPrisma()?.$disconnect();}
