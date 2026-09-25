import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import {PrismaClient,Prisma} from '@prisma/client';
import pg from 'pg';
import authPlugin from '../src/plugins/auth.js';
import errors from '../src/plugins/error-envelope.js';
import ingestRoutes from '../src/routes/ingest.js';
import {PersistentAuthService} from '../src/auth/service.js';
import {PrismaAuthRepository} from '../src/auth/prisma-repository.js';
import {readAuthRuntimeConfig} from '../src/auth/runtime-config.js';
import {newCredential,nativeCredentialHash} from '../src/auth/credentials.js';
import {getPrisma} from '../src/db/prisma.js';
import {acceptIngestCommand,appendIngestEvent,retryIngestCommand} from '../src/ingest/store.js';
import {encodeIngestCursor} from '../src/ingest/cursor.js';
import type {IngestSnapshot} from '../src/ingest/job-state.js';
assert.equal(process.env.AUTH_TEST_DATABASE_ACK,'isolated-synthetic-only');
const databaseName=new URL(process.env.DATABASE_URL!).pathname.slice(1);assert.match(databaseName,/^nomad_auth_test_[a-z0-9_]+$/);
process.env.AUTH_RUNTIME_MODE='staging';process.env.AUTH_PROVIDER='aliyun-pnvs';process.env.INGEST_WORKER_MODE='disabled';process.env.INGEST_RECOVERY_ISOLATED='true';
const origin='https://nomad.example',db=new PrismaClient(),sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
const until=async(check:()=>Promise<boolean>|boolean,timeout=20000)=>{const end=Date.now()+timeout;while(!await check()){if(Date.now()>end)throw new Error('PROBE_TIMEOUT');await sleep(20);}};
if(process.env.INGEST_SSE_PROBE_CHILD==='1'){
 const config=readAuthRuntimeConfig({AUTH_RUNTIME_MODE:'staging',AUTH_PROVIDER:'aliyun-pnvs',DATABASE_URL:process.env.DATABASE_URL,AUTH_PUBLIC_ORIGIN:origin,AUTH_NATIVE_ENABLED:'true',AUTH_TRUSTED_PROXY_CIDRS:'127.0.0.1/32',
  ALIBABA_CLOUD_ACCESS_KEY_ID:'synthetic-ak',ALIBABA_CLOUD_ACCESS_KEY_SECRET:'synthetic-secret',ALIYUN_PNVS_SIGN_NAME:'synthetic-sign',ALIYUN_PNVS_TEMPLATE_CODE:'100001',ALIYUN_PNVS_TEMPLATE_PARAM:'{"code":"##code##","min":"5"}',
  ALIYUN_PNVS_CAPTCHA_PLATFORM:'h5',ALIYUN_PNVS_CAPTCHA_APP_ID:'synthetic-app',ALIYUN_PNVS_CAPTCHA_APP_KEY:'synthetic-key'});
 const proof={async send(){throw new Error('NO_PROVIDER_ALLOWED');},async verify(){throw new Error('NO_PROVIDER_ALLOWED');},async verifyGraphic(){throw new Error('NO_PROVIDER_ALLOWED');}};
 const service=new PersistentAuthService(config,new PrismaAuthRepository(db),proof),app=Fastify({logger:false,trustProxy:config.trustProxy});
 await app.register(cookie);await app.register(errors);await app.register(authPlugin,{service});await app.register(ingestRoutes);
 let controlGate:{jobId?:string;commentSeen:boolean;entered:boolean;used:boolean;release?:()=>void}={commentSeen:false,entered:false,used:false};
 const authenticate=service.authenticate.bind(service);
 service.authenticate=async(secret,native)=>{if(controlGate.jobId&&controlGate.commentSeen&&!controlGate.used){controlGate.used=true;controlGate.entered=true;await new Promise<void>(resolve=>{controlGate.release=resolve;});}return authenticate(secret,native);};
 app.post('/probe/control/arm/:jobId',async req=>{controlGate={jobId:(req.params as {jobId:string}).jobId,commentSeen:false,entered:false,used:false};return {armed:true};});
 app.get('/probe/control/status',async()=>({entered:controlGate.entered}));
 app.post('/probe/control/release',async()=>{controlGate.release?.();controlGate.jobId=undefined;return {released:true};});
 const states=new Map<string,{active:number;backpressure:number;maxQueuedBytes:number;businessFrames:number}>();
 app.addHook('onRequest',async(req,reply)=>{
  if(req.routeOptions.url!=='/ingest/:jobId/events')return;
  const id=(req.params as {jobId:string}).jobId;
  const state=states.get(id)??{active:0,backpressure:0,maxQueuedBytes:0,businessFrames:0};states.set(id,state);state.active++;
  const original=reply.raw.write.bind(reply.raw);(reply.raw as any).write=(...args:any[])=>{const accepted=(original as any)(...args);if(id===controlGate.jobId&&typeof args[0]==='string'&&args[0].startsWith(': heartbeat'))controlGate.commentSeen=true;if(typeof args[0]==='string'&&args[0].startsWith('id: '))state.businessFrames++;if(!accepted)state.backpressure++;state.maxQueuedBytes=Math.max(state.maxQueuedBytes,reply.raw.writableLength);return accepted;};
  reply.raw.once('close',()=>{state.active--;});
 });
 app.get('/probe/state/:jobId',async req=>states.get((req.params as {jobId:string}).jobId)??{active:0,backpressure:0,maxQueuedBytes:0,businessFrames:0});
 app.get('/health',async()=>{await service.repository.ready();await getPrisma()!.$queryRaw`SELECT 1`;return {ready:true};});
 await app.listen({host:'127.0.0.1',port:0});const address=app.server.address();assert.ok(address&&typeof address!=='string');console.log(JSON.stringify({port:address.port,pid:process.pid}));
 process.once('SIGTERM',()=>{void app.close().then(async()=>{await db.$disconnect();await getPrisma()?.$disconnect();process.exit(0);});});
}else{
 const children=new Set<ChildProcess>(),readers:Array<{close:()=>void}>=[],checks:string[]=[],owner=randomUUID(),other=randomUUID();let phase='setup';let diagnostics:Record<string,unknown>={};let gate:pg.Client|undefined,connectionsBlocked=false;
 const launch=async()=>{
  const child=spawn(process.execPath,['--import','tsx','scripts/auth-ingest-sse-probe.ts'],{cwd:process.cwd(),env:{...process.env,INGEST_SSE_PROBE_CHILD:'1'},stdio:['ignore','pipe','pipe']});children.add(child);
  let buffer='',record:any;child.stdout!.on('data',chunk=>{buffer+=chunk;const end=buffer.indexOf('\n');if(end>=0&&!record){try{record=JSON.parse(buffer.slice(0,end));}catch{}}});child.stderr!.resume();child.once('exit',()=>children.delete(child));
  await until(()=>{if(child.exitCode!==null)throw new Error('CHILD_EXITED');return !!record;});return {...record,child} as {port:number;pid:number;child:ChildProcess};
 };
 const stop=async(child:ChildProcess,signal:'SIGTERM'|'SIGKILL'='SIGTERM')=>{if(child.exitCode!==null||child.signalCode!==null)return;const exit=once(child,'exit');child.kill(signal);await exit;};
 const session=async(userId:string)=>{
  const secret=newCredential(),binding=randomUUID().replaceAll('-','')+randomUUID().replaceAll('-','');await db.authBrowser.create({data:{bindingHash:binding,sessionGeneration:1}});
  const row=await db.session.create({data:{userId,transport:'native',audience:origin,credentialHash:nativeCredentialHash(secret,origin),browserBindingHash:binding,browserGeneration:1,expiresAt:new Date(Date.now()+300000)}});
  return {id:row.id,headers:{authorization:`Bearer ${secret}`,'x-nomad-auth-audience':origin,'x-forwarded-proto':'https','x-auth-user-id':userId,'x-auth-session-id':row.id}};
 };
 const accept=()=>acceptIngestCommand({enqueue:false,userId:owner,sourceUrl:`https://xhslink.com/${randomUUID()}`,traceId:randomUUID(),operationId:randomUUID()});
 type Frame={id?:string;event?:string;data?:any;comment?:string;at:number};
 const open=async(port:number,jobId:string,headers:Record<string,string>,cursor?:string)=>{
  const controller=new AbortController(),url=`http://127.0.0.1:${port}/ingest/${jobId}/events`+(cursor?`?last_event_id=${encodeURIComponent(cursor)}`:'');
  const response=await fetch(url,{headers,signal:controller.signal});if(response.status!==200){const body=await response.json().catch(()=>({})) as {error_code?:string};diagnostics={httpStatus:response.status,httpError:body.error_code&&/^[A-Z_]{1,80}$/.test(body.error_code)?body.error_code:undefined};}assert.equal(response.status,200);assert.match(response.headers.get('cache-control')??'',/no-store/);
  const frames:Frame[]=[];let ended=false;const decoder=new TextDecoder(),reader=response.body!.getReader();let buffer='';
  const done=(async()=>{try{for(;;){const chunk=await reader.read();if(chunk.done)break;buffer+=decoder.decode(chunk.value,{stream:true});assert.ok(buffer.length<256*1024);for(;;){const index=buffer.indexOf('\n\n');if(index<0)break;const block=buffer.slice(0,index);buffer=buffer.slice(index+2);const frame:Frame={at:performance.now()};let data:string[]=[];for(const line of block.split('\n')){if(line.startsWith(':'))frame.comment=line.slice(1).trim();if(line.startsWith('id:'))frame.id=line.slice(3).trim();if(line.startsWith('event:'))frame.event=line.slice(6).trim();if(line.startsWith('data:'))data.push(line.slice(5).trimStart());}if(data.length)frame.data=JSON.parse(data.join('\n'));frames.push(frame);}}}catch(error){if(error instanceof assert.AssertionError)throw error;}finally{ended=true;reader.releaseLock();}})();
  const result={frames,done,close:()=>controller.abort(),ended:()=>ended,events:()=>frames.filter(frame=>frame.event==='ingest')};readers.push(result);return result;
 };
 try{
  await db.user.createMany({data:[{id:owner,authState:'active'},{id:other,authState:'active'}]});const own=await session(owner),foreign=await session(other);
  let a=await launch();const b=await launch();assert.notEqual(a.pid,b.pid);
  const {job}=await accept();await appendIngestEvent(job.id,{state:'parsing',sub_stage:'asr'},1);
  for(let i=0;i<150;i++)await appendIngestEvent(job.id,{state:'parsing',parsed_count:i},1);
  const failed=await appendIngestEvent(job.id,{state:'failed',error_code:'INGEST_SYNTHETIC_RETRY',retriable:true},1);await retryIngestCommand({enqueue:false,userId:owner,jobId:job.id,operationId:randomUUID(),expectedAttempt:1,expectedVersion:failed.state_version});await appendIngestEvent(job.id,{state:'parsing'},2);
  const row=await db.ingestJob.findUniqueOrThrow({where:{id:job.dbId}}),zero=encodeIngestCursor(row.eventStreamId!,0n);
  phase='cross-process-replay';
  const first=await open(a.port,job.id,own.headers,zero);await until(()=>first.events().length>=45);const prefix=first.events().slice(0,45);first.close();await first.done;
  await stop(a.child,'SIGKILL');a=await launch();
  const second=await open(b.port,job.id,own.headers,prefix[44].id);await until(()=>second.events().length>=20);
  await appendIngestEvent(job.id,{state:'parsing',parsed_count:151},2);await appendIngestEvent(job.id,{state:'failed',error_code:'INGEST_TEST_COMPLETE'},2);await second.done;
  const end=await db.ingestJob.findUniqueOrThrow({where:{id:job.dbId}}),all=[...prefix,...second.events()];assert.deepEqual(all.map(frame=>frame.data.seq),Array.from({length:Number(end.lastEventSeq)},(_,i)=>String(i+1)));
  assert.ok(all.every(frame=>frame.id===frame.data.cursor));assert.equal(second.frames.filter(frame=>frame.event==='ingest_control').length,1);assert.equal(second.frames.at(-1)?.data.kind,'complete');assert.equal(second.frames.at(-1)?.data.attempt,2);assert.equal(second.frames.at(-1)?.id,undefined);
  let maxWindow=0;for(const frame of second.events())maxWindow=Math.max(maxWindow,second.events().filter(other=>other.at>=frame.at&&other.at<frame.at+1000).length);assert.ok(maxWindow<=100);
  checks.push('two-process-socket-replay-after-disconnect-and-server-kill-has-contiguous-seq-and-live-tail');checks.push('old-terminal-does-not-cut-new-attempt-and-control-has-no-id');checks.push('paced-replay-stays-below-native-100-events-per-second');
  const terminal=await open(a.port,job.id,own.headers,encodeIngestCursor(end.eventStreamId!,end.lastEventSeq));await terminal.done;assert.equal(terminal.events().length,0);assert.equal(terminal.frames.at(-1)?.data.kind,'complete');checks.push('confirmed-terminal-head-only-emits-complete');
  phase='typed-http-errors';
  const endpoint=`http://127.0.0.1:${a.port}/ingest/${job.id}/events`;
  for(const [query,headers,status] of [ ['?last_event_id=invalid',foreign.headers,404],['?last_event_id=invalid',own.headers,400],[`?last_event_id=${encodeURIComponent(zero)}&last_event_id=${encodeURIComponent(zero)}`,own.headers,400],[`?last_event_id=${encodeURIComponent(encodeIngestCursor(randomUUID(),0n))}`,own.headers,409],[`?last_event_id=${encodeURIComponent(encodeIngestCursor(end.eventStreamId!,end.lastEventSeq+1n))}`,own.headers,409],[`?last_event_id=${encodeURIComponent(zero)}`,{...own.headers,'last-event-id':encodeIngestCursor(end.eventStreamId!,end.lastEventSeq)},400] ] as const){const response=await fetch(endpoint+query,{headers});assert.equal(response.status,status);assert.match(response.headers.get('content-type')??'',/application\/json/);await response.arrayBuffer();}
  const negotiation=await fetch(`http://127.0.0.1:${a.port}/ingest/${job.id}/recovery?last_event_id=${encodeURIComponent(zero)}`,{headers:own.headers});assert.equal(negotiation.status,200);const negotiated=await negotiation.json() as {mode:string;cursor:string};assert.equal(negotiated.mode,'replay');assert.equal(negotiated.cursor,zero);
  await db.ingestJob.update({where:{id:job.dbId},data:{replayFloorSeq:10n}});const retained=await open(b.port,job.id,own.headers,negotiated.cursor);await retained.done;assert.equal(retained.events().length,0);assert.equal(retained.frames.at(-1)?.data.kind,'resync');assert.equal(retained.frames.at(-1)?.id,undefined);checks.push('owner-first-typed-cursor-errors-and-retention-resync-over-real-sockets');
  phase='terminal-auth-wait-retry-race';
  const raced=(await accept()).job,racedSnapshot=await appendIngestEvent(raced.id,{state:'failed',error_code:'INGEST_SYNTHETIC_RETRY',retriable:true},1);
  const racedRow=await db.ingestJob.findUniqueOrThrow({where:{id:raced.dbId}});
  assert.equal((await fetch(`http://127.0.0.1:${a.port}/probe/control/arm/${raced.id}`,{method:'POST',headers:own.headers})).status,200);
  const racedStream=await open(a.port,raced.id,own.headers,encodeIngestCursor(racedRow.eventStreamId!,racedRow.lastEventSeq));
  await until(async()=>{const response=await fetch(`http://127.0.0.1:${a.port}/probe/control/status`,{headers:own.headers});return (await response.json() as {entered:boolean}).entered;},1500);
  await retryIngestCommand({enqueue:false,userId:owner,jobId:raced.id,operationId:randomUUID(),expectedAttempt:1,expectedVersion:racedSnapshot.state_version});
  await appendIngestEvent(raced.id,{state:'parsing'},2);await appendIngestEvent(raced.id,{state:'failed',error_code:'INGEST_TEST_COMPLETE'},2);
  assert.equal((await fetch(`http://127.0.0.1:${a.port}/probe/control/release`,{method:'POST',headers:own.headers})).status,200);await racedStream.done;
  assert.deepEqual(racedStream.events().map(frame=>frame.data.seq),['3','4','5']);assert.ok(racedStream.events().every(frame=>frame.data.attempt===2));assert.deepEqual(racedStream.frames.filter(frame=>frame.event==='ingest_control').map(frame=>frame.data.attempt),[2]);
  checks.push('retry-committed-during-terminal-send-authentication-is-not-cut-off-by-old-complete');
  phase='slow-consumer-socket';
  const slowJob=(await accept()).job,slowRow=await db.ingestJob.findUniqueOrThrow({where:{id:slowJob.dbId}}),slowZero=encodeIngestCursor(slowRow.eventStreamId!,0n);
  phase='slow-consumer-seed';await db.$transaction(async tx=>{
   const records:Prisma.IngestEventRecordCreateManyInput[]=[];let last:IngestSnapshot=slowRow.snapshotJson as unknown as IngestSnapshot;
   for(let i=1;i<=4000;i++){
    last={...last,state:'parsing',sub_stage:'asr',state_version:i,source_title:'测'.repeat(240),parsed_count:i,head_cursor:encodeIngestCursor(slowRow.eventStreamId!,BigInt(i+1))};
    records.push({jobId:slowRow.id,seq:BigInt(i+1),kind:'fact',attempt:1,stateVersion:i,stage:'parsing',subStage:'asr',traceId:slowRow.id,snapshotJson:last as Prisma.InputJsonValue});
    if(records.length===500){await tx.ingestEventRecord.createMany({data:records});records.length=0;}
   }
   await tx.ingestJob.update({where:{id:slowRow.id},data:{lastEventSeq:4001n,stateVersion:4000,status:'parsing',snapshotJson:last as Prisma.InputJsonValue}});
  },{timeout:15000});
  phase='slow-consumer-connect';const python=`import json,socket,sys,time
cfg=json.loads(sys.stdin.readline());sock=socket.socket();sock.setsockopt(socket.SOL_SOCKET,socket.SO_RCVBUF,1024);sock.connect(('127.0.0.1',cfg['port']))
request='GET '+cfg['path']+' HTTP/1.1\\r\\nHost: 127.0.0.1\\r\\n'+''.join(k+': '+v+'\\r\\n' for k,v in cfg['headers'].items())+'\\r\\n'
sock.sendall(request.encode());header=b''
while not header.endswith(b'\\r\\n\\r\\n'):
 chunk=sock.recv(1)
 if not chunk: raise RuntimeError('no headers')
 header+=chunk
assert header.startswith(b'HTTP/1.1 200')
print(json.dumps({'ready':True}),flush=True)
while True: time.sleep(1)
`;
  const slow=spawn('python3',['-c',python],{stdio:['pipe','pipe','pipe']});children.add(slow);slow.once('exit',()=>children.delete(slow));let ready=false;slow.stdout!.on('data',()=>{ready=true;});slow.stderr!.resume();
  slow.stdin!.end(JSON.stringify({port:a.port,path:`/ingest/${slowJob.id}/events?last_event_id=${encodeURIComponent(slowZero)}`,headers:own.headers})+'\n');
  await until(()=>{if(slow.exitCode!==null)throw new Error('SLOW_CLIENT_EXITED');return ready;});
  phase='slow-consumer-backpressure';let slowState:any;
  await until(async()=>{const response=await fetch(`http://127.0.0.1:${a.port}/probe/state/${slowJob.id}`,{headers:own.headers});assert.equal(response.status,200);slowState=await response.json();return slowState.active===0;},100000);
  assert.ok(slowState.backpressure>0);assert.ok(slowState.maxQueuedBytes<=192*1024);assert.ok(slowState.businessFrames<4001);await stop(slow);
  phase='slow-consumer-resume';const afterSlow=await open(b.port,slowJob.id,own.headers,slowZero);await until(()=>afterSlow.events().length>=220);assert.deepEqual(afterSlow.events().slice(0,220).map(frame=>frame.data.seq),Array.from({length:220},(_,i)=>String(i+1)));const replayHeartbeats=afterSlow.frames.filter(frame=>frame.comment);assert.ok(replayHeartbeats.length>=2);for(let i=1;i<replayHeartbeats.length;i++)assert.ok(replayHeartbeats[i].at-replayHeartbeats[i-1].at<=10000);assert.ok(replayHeartbeats.every(frame=>frame.id===undefined));afterSlow.close();await afterSlow.done;
  checks.push('actual-small-receive-window-nonreading-socket-times-out-with-bounded-server-buffer-and-resumes-original-cursor');checks.push('heartbeat-continues-during-paced-business-replay-without-business-id');
  phase='database-interruption';
  const idleJob=(await accept()).job,idleRow=await db.ingestJob.findUniqueOrThrow({where:{id:idleJob.dbId}}),idleCursor=encodeIngestCursor(idleRow.eventStreamId!,idleRow.lastEventSeq);
  const interrupted=await open(a.port,idleJob.id,own.headers,idleCursor);
  phase='database-interruption-connect-gate';const gateUrl=new URL(process.env.DATABASE_URL!);gateUrl.pathname='/postgres';gate=new pg.Client({connectionString:gateUrl.toString()});await gate.connect();phase='database-interruption-ownership';const ownership=await gate.query('SELECT pg_get_userbyid(datdba)=current_user AS owns FROM pg_database WHERE datname=$1', [databaseName]);assert.equal(ownership.rows[0].owns,true);
  phase='database-interruption-block';await gate.query(`ALTER DATABASE "${databaseName}" ALLOW_CONNECTIONS false`);connectionsBlocked=true;
  phase='database-interruption-terminate';await gate.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1 AND pid<>pg_backend_pid()', [databaseName]);phase='database-interruption-stream-close';await until(()=>interrupted.ended(),7000);
  assert.equal(interrupted.events().length,0);assert.equal(interrupted.frames.filter(frame=>frame.event==='ingest_control').length,0);
  phase='database-interruption-reenable';await gate.query(`ALTER DATABASE "${databaseName}" ALLOW_CONNECTIONS true`);connectionsBlocked=false;await gate.end();gate=undefined;
  phase='database-interruption-health';for(const port of [a.port,b.port])await until(async()=>{try{return(await fetch(`http://127.0.0.1:${port}/health`)).status===200;}catch{return false;}});
  await until(async()=>{try{await db.$queryRaw`SELECT 1`;await getPrisma()!.$queryRaw`SELECT 1`;return true;}catch{return false;}});
  phase='database-interruption-resume-write';await appendIngestEvent(idleJob.id,{state:'parsing',parsed_count:1},1);const afterOutage=await open(b.port,idleJob.id,own.headers,idleCursor);await until(()=>afterOutage.events().length===1);assert.equal(afterOutage.events()[0].data.seq,'2');afterOutage.close();await afterOutage.done;checks.push('actual-isolated-database-interruption-closes-without-fake-resync-and-replays-after-recovery');
  phase='idle-heartbeat-and-revocation';
  const freshRow=await db.ingestJob.findUniqueOrThrow({where:{id:idleJob.dbId}}),idle=await open(a.port,idleJob.id,own.headers,encodeIngestCursor(freshRow.eventStreamId!,freshRow.lastEventSeq));
  await sleep(10500);const heartbeats=idle.frames.filter(frame=>frame.comment);diagnostics={heartbeatCount:heartbeats.length,ended:idle.ended(),frameKinds:idle.frames.map(frame=>frame.event??'comment')};assert.ok(heartbeats.length>=4,'idle heartbeat count');let heartbeatGapMs=0;for(let i=1;i<heartbeats.length;i++){heartbeatGapMs=Math.max(heartbeatGapMs,heartbeats[i].at-heartbeats[i-1].at);assert.ok(heartbeats[i].at-heartbeats[i-1].at<=10000);}assert.equal(idle.events().length,0);assert.ok(heartbeats.every(frame=>frame.id===undefined));
  const revokedAt=performance.now();await db.session.update({where:{id:own.id},data:{revokedAt:new Date()}});await until(()=>idle.ended(),7000);assert.ok(performance.now()-revokedAt<7000);assert.equal((await db.ingestJob.findUniqueOrThrow({where:{id:idleJob.dbId}})).lastEventSeq,freshRow.lastEventSeq);checks.push('long-idle-heartbeats-without-seq-and-idle-session-revocation');
  phase='application-close-with-active-stream';
  const newSession=await session(owner),closing=await open(b.port,idleJob.id,newSession.headers,encodeIngestCursor(freshRow.eventStreamId!,freshRow.lastEventSeq));await stop(b.child);await until(()=>closing.ended());checks.push('application-preClose-ends-active-durable-stream-before-database-close');
  phase='preclose-during-initial-database-read';
  const initializing=(await accept()).job,lockDb=new PrismaClient();let unlock!:()=>void,locked!:()=>void;
  const gatePromise=new Promise<void>(resolve=>{unlock=resolve;}),lockSignal=new Promise<void>(resolve=>{locked=resolve;});
  const hold=lockDb.$transaction(async tx=>{await tx.$queryRaw`SELECT id FROM "User" WHERE id=${owner}::uuid FOR UPDATE`;locked();await gatePromise;},{timeout:10000});
  await lockSignal;
  try{
   const pendingResponse=fetch(`http://127.0.0.1:${a.port}/ingest/${initializing.id}/events`,{headers:newSession.headers}).then(async response=>{await response.arrayBuffer();return response.status;}).catch(()=>0);
   await until(async()=>{const rows=await db.$queryRaw<Array<{count:number}>>`SELECT count(*)::integer AS count FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock'`;return rows[0].count>0;});
   const exit=once(a.child,'exit');a.child.kill('SIGTERM');await sleep(50);unlock();await hold;await exit;
   assert.equal(await pendingResponse,0);checks.push('preClose-includes-stream-initialization-blocked-in-first-database-read');
  }finally{unlock();await hold.catch(()=>{});await lockDb.$disconnect();}
  console.log(JSON.stringify({result:'passed',checks,independentServerProcesses:true,serverKillAndRestart:true,actualIsolatedDatabaseInterruption:true,maxBusinessFramesPerSecond:maxWindow,maxIdleHeartbeatGapMs:heartbeatGapMs,realProviderCalls:0,transport:'real-loopback-http-with-explicit-trusted-proxy-fixture-headers',slowConsumerSocketVerified:true,slowConsumer:{backpressureWrites:slowState.backpressure,maxQueuedBytes:slowState.maxQueuedBytes,businessFramesBeforeClose:slowState.businessFrames},clientDurableAckVerified:false,nativeDeviceVerified:false}));
 }catch(error){console.log(JSON.stringify({result:'failed',phase,errorCode:'PROBE_ASSERTION_OR_DATABASE_ERROR',errorName:error instanceof Error?error.name:'unknown',diagnostics,databaseCode:typeof error==='object'&&error!==null&&'code' in error?String(error.code):undefined}));process.exitCode=1;}
 finally{if(gate){if(connectionsBlocked)await gate.query(`ALTER DATABASE "${databaseName}" ALLOW_CONNECTIONS true`);await gate.end();}for(const reader of readers)reader.close();for(const child of children)await stop(child);await db.$disconnect();await getPrisma()?.$disconnect();}
}
