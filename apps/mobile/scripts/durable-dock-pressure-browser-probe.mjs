/** Actual App + IndexedDB + PG-backed auth/recovery/SSE. Credentials and identity routing are explicit local fixtures. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import Fastify from '../../server/node_modules/fastify/fastify.js';
import cookie from '../../server/node_modules/@fastify/cookie/plugin.js';
import authPlugin from '../../server/src/plugins/auth.ts';
import errors from '../../server/src/plugins/error-envelope.ts';
import authRoutes from '../../server/src/routes/auth.ts';
import ingestRoutes from '../../server/src/routes/ingest.ts';
import homeRoutes from '../../server/src/routes/home.ts';
import libraryRoutes from '../../server/src/routes/library.ts';
import {readAuthRuntimeConfig} from '../../server/src/auth/runtime-config.ts';
import {PrismaAuthRepository} from '../../server/src/auth/prisma-repository.ts';
import {PersistentAuthService} from '../../server/src/auth/service.ts';
import {newCredential,nativeCredentialHash} from '../../server/src/auth/credentials.ts';
import {getPrisma} from '../../server/src/db/prisma.ts';
import {acceptIngestCommand,appendIngestEvent,getOrHydrateJob,persistIngestOutput} from '../../server/src/ingest/store.ts';
const require=createRequire(new URL('../../server/package.json',import.meta.url)),{PrismaClient}=require('@prisma/client'),puppeteer=require('puppeteer');
assert.equal(process.env.AUTH_TEST_DATABASE_ACK,'isolated-synthetic-only');assert.match(new URL(process.env.DATABASE_URL).pathname,/^\/nomad_auth_test_[a-z0-9_]+$/);
process.env.AUTH_RUNTIME_MODE='staging';process.env.AUTH_PROVIDER='aliyun-pnvs';process.env.INGEST_WORKER_MODE='disabled';process.env.INGEST_RECOVERY_ISOLATED='true';
const repeat=Number(process.env.RECOVERY_REPEAT??'1');assert.ok(Number.isInteger(repeat)&&repeat>=1&&repeat<=3);const clockId=randomUUID();
const root=resolve(fileURLToPath(new URL('../../..',import.meta.url))),origin='http://127.0.0.1:5194',audience='https://nomad.example';
const output=resolve(root,'_bmad-output/implementation-artifacts/evidence/story-1-7-client-2026-09-19');await mkdir(output,{recursive:true});
const sourceFiles=['apps/mobile/scripts/durable-dock-pressure-browser-probe.mjs','apps/mobile/src/App.tsx','apps/mobile/src/home/api.ts','apps/mobile/src/home/durable-watch.ts','apps/mobile/src/auth/ordered-stream.ts','apps/mobile/src/home/dock-controller.ts','apps/mobile/src/home/dock-model.ts','apps/mobile/src/home/operation-journal.ts','apps/mobile/src/home/ingest-checkpoint-store.ts','apps/mobile/src/home/ingest-protocol.ts','apps/mobile/src/home/HomeImportDock.tsx'];
const hashes=Object.fromEntries(await Promise.all(sourceFiles.map(async path=>[path,createHash('sha256').update(await readFile(resolve(root,path))).digest('hex')])));
const db=new PrismaClient(),ownerA=randomUUID(),ownerB=randomUUID(),sessions=new Map(),requests=[],checks=[];let selectedOwner=ownerA,browser,vite,phase='setup',app;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(test,timeout=20000)=>{const end=Date.now()+timeout;while(!await test()){if(Date.now()>end)throw new Error('PROBE_TIMEOUT');await sleep(50);}};
const identity=async(userId)=>{const secret=newCredential(),binding=randomUUID().replaceAll('-','')+randomUUID().replaceAll('-','');await db.authBrowser.create({data:{bindingHash:binding,sessionGeneration:1}});const session=await db.session.create({data:{userId,transport:'native',audience,credentialHash:nativeCredentialHash(secret,audience),authVersion:0,browserBindingHash:binding,browserGeneration:1,expiresAt:new Date(Date.now()+3600000)}});sessions.set(userId,{secret,id:session.id});};
const profile=await mkdtemp('/tmp/nomad-durable-dock-pg-');let pageErrors=[];let duplicateJob,duplicateFrames=0,paddedJob,paddedFrames=0;
async function newPage(){
 const page=await browser.newPage();await page.evaluateOnNewDocument(()=>{window.probeStreams=[];const Source=window.EventSource;window.EventSource=class extends Source{constructor(...args){super(...args);this.probeReceived=0;this.addEventListener('ingest',()=>{this.probeReceived++;});window.probeStreams.push(this);}};});await page.setViewport({width:390,height:844,deviceScaleFactor:1});page.on('pageerror',error=>pageErrors.push(error.message));await page.setRequestInterception(true);
 page.on('request',request=>{const url=new URL(request.url());if(url.origin!==origin&&!['data:','about:'].includes(url.protocol))return request.abort();return request.continue();});return page;
}
async function checkpoint(page,jobId,owner=ownerA){return page.evaluate(async({jobId,owner})=>{const {operationJournal}=await import('/src/home/operation-journal.ts');return operationJournal.readCheckpoint({ownerId:owner,valid:()=>true},jobId);},{jobId,owner});}
async function seed(page,label){
 const sourceUrl=`https://xhslink.com/synthetic-${randomUUID()}`;
 const operation=await page.evaluate(async({owner,sourceUrl})=>{const {operationJournal}=await import('/src/home/operation-journal.ts');const prepared=await operationJournal.prepare({ownerId:owner,valid:()=>true},[{url:sourceUrl}]);return prepared.records[0].operationId;},{owner:ownerA,sourceUrl});
 const {job}=await acceptIngestCommand({enqueue:false,userId:ownerA,sourceUrl,traceId:randomUUID(),operationId:operation});await appendIngestEvent(job.id,{state:'fetching',source_title:label,fetched_count:1},1);
 await page.evaluate(async({owner,operation,jobId})=>{const {operationJournal}=await import('/src/home/operation-journal.ts');await operationJournal.mark({ownerId:owner,valid:()=>true},operation,'accepted',jobId,{disposition:'created',completionEligible:true});},{owner:ownerA,operation,jobId:job.id});return job;
}
async function crash(){const child=browser.process(),exit=once(child,'exit');child.kill('SIGKILL');await exit;browser=undefined;}
const launch=()=>puppeteer.launch({headless:true,userDataDir:profile,args:['--no-sandbox','--disable-setuid-sandbox']});
try{
 await db.user.createMany({data:[{id:ownerA,authState:'active'},{id:ownerB,authState:'active'}]});await identity(ownerA);await identity(ownerB);
 const pgVersion=(await db.$queryRaw`SHOW server_version`)[0].server_version;
 const initialStart=(await db.$queryRaw`SELECT pg_postmaster_start_time() AS started`)[0].started.toISOString();
 const config=readAuthRuntimeConfig({AUTH_RUNTIME_MODE:'staging',AUTH_PROVIDER:'aliyun-pnvs',DATABASE_URL:process.env.DATABASE_URL,AUTH_PUBLIC_ORIGIN:audience,AUTH_NATIVE_ENABLED:'true',AUTH_TRUSTED_PROXY_CIDRS:'127.0.0.1/32',AUTH_PRIVACY_URL:`${audience}/synthetic/privacy`,AUTH_USER_AGREEMENT_URL:`${audience}/synthetic/terms`,
  ALIBABA_CLOUD_ACCESS_KEY_ID:'synthetic-ak',ALIBABA_CLOUD_ACCESS_KEY_SECRET:'synthetic-secret',ALIYUN_PNVS_SIGN_NAME:'synthetic-sign',ALIYUN_PNVS_TEMPLATE_CODE:'100001',ALIYUN_PNVS_TEMPLATE_PARAM:'{"code":"##code##","min":"5"}',ALIYUN_PNVS_CAPTCHA_PLATFORM:'h5',ALIYUN_PNVS_CAPTCHA_APP_ID:'synthetic-app',ALIYUN_PNVS_CAPTCHA_APP_KEY:'synthetic-key'});
 const proof={async send(){throw new Error('NO_REAL_PROVIDER_CALL');},async verify(){throw new Error('NO_REAL_PROVIDER_CALL');},async verifyGraphic(){throw new Error('NO_REAL_PROVIDER_CALL');}};
 const service=new PersistentAuthService(config,new PrismaAuthRepository(db),proof);app=Fastify({logger:false,trustProxy:config.trustProxy});
 // Local test-only identity adapter: the App still obtains its identity from the actual PG-backed /me route.
 app.addHook('onRequest',async (req,reply)=>{
  // Explicit test-only duplicate-delivery fault. Every repeated frame still comes from the real PG/SSE path.
  if(req.url.includes('/events')){const write=reply.raw.write.bind(reply.raw);reply.raw.write=(chunk,...args)=>{
   const value=Buffer.isBuffer(chunk)?chunk.toString():chunk;
   if(paddedJob&&req.url.includes(paddedJob)&&typeof value==='string'&&value.includes('event: ingest\n')){
    paddedFrames++;const padded=value.replace(/^data: (.+)$/m,(_line,data)=>'data: '+JSON.stringify({...JSON.parse(data),fixture_padding:'x'.repeat(56000)}));return write(padded,...args);
   }
   if(duplicateJob&&req.url.includes(duplicateJob)&&typeof value==='string'&&value.includes('event: ingest\n')){duplicateFrames+=19;return write(value.repeat(20),...args);}
   return write(chunk,...args);
  };}

  const query=new URL(req.url,'http://local.test').searchParams,supplied=req.headers['x-auth-user-id']??query.get('auth_user_id');const owner=typeof supplied==='string'&&sessions.has(supplied)?supplied:selectedOwner,session=sessions.get(owner);
  requests.push({method:req.method,path:req.url.split('?')[0],owner,cursor:query.get('last_event_id'),at:performance.now()});
  req.raw.headers.authorization=`Bearer ${session.secret}`;req.raw.headers['x-nomad-auth-audience']=audience;req.raw.headers['x-forwarded-proto']='https';delete req.raw.headers.origin;delete req.raw.headers.cookie;
  if(!supplied){req.raw.headers['x-auth-user-id']=owner;req.raw.headers['x-auth-session-id']=session.id;}
 });
 await app.register(cookie);await app.register(errors);await app.register(authPlugin,{service});await app.register(authRoutes,{service});await app.register(ingestRoutes);await app.register(homeRoutes);await app.register(libraryRoutes);await app.listen({host:'127.0.0.1',port:0});
 const backend=app.server.address();assert.ok(backend&&typeof backend!=='string');const nonce=randomUUID(),configPath=resolve(await mkdtemp('/tmp/nomad-client-pg-vite-'),'config.mjs');
 await writeFile(configPath,`import base from ${JSON.stringify(resolve(root,'apps/mobile/vite.config.ts'))};export default {...base,root:${JSON.stringify(resolve(root,'apps/mobile'))},server:{proxy:{'/api':{target:'http://127.0.0.1:${backend.port}',rewrite:path=>path.replace(/^\\/api/,'')}}},plugins:[...base.plugins,{name:'client-proof',configureServer(server){server.middlewares.use((req,res,next)=>{if(req.url==='/__client_probe_identity'){res.end(${JSON.stringify(nonce)});return;}if(req.url==='/__probe_blank'){res.setHeader('Content-Type','text/html');res.end('<html><body>Seed accepted synthetic records</body></html>');return;}next();});}}]};`);
 vite=spawn(process.execPath,['node_modules/vite/bin/vite.js','--config',configPath,'--host','127.0.0.1','--port','5194','--strictPort'],{cwd:resolve(root,'apps/mobile'),env:{...process.env,VITE_API_BASE_URL:`${origin}/api`},stdio:'ignore'});
 await until(async()=>{if(vite.exitCode!==null)throw new Error('owned Vite exited');try{return await(await fetch(origin+'/__client_probe_identity')).text()===nonce;}catch{return false;}});
 browser=await launch();let page=await newPage();await page.goto(origin+'/__probe_blank');const second=await seed(page,'压力与双窗口合成任务');await page.goto(origin);await page.waitForSelector('textarea[aria-label="统一输入"]');
 await until(async()=>(await checkpoint(page,second.id)).value?.cursor.endsWith(':2')===true);await sleep(500);
 const burst=async(count,offset)=>db.$transaction(async tx=>{
  const row=await tx.ingestJob.findUniqueOrThrow({where:{id:second.id.slice(4)}}),now=new Date();
  const events=Array.from({length:count},(_,i)=>{const seq=row.lastEventSeq+BigInt(i+1),version=row.stateVersion+i+1;return {jobId:row.id,seq,schemaVersion:1,kind:'fact',attempt:1,stateVersion:version,stage:'parsing',subStage:null,traceId:row.id,occurredAt:now,snapshotJson:{...row.snapshotJson,state:'parsing',sub_stage:null,head_cursor:`i1:${row.eventStreamId}:${seq}`,state_version:version,parsed_count:offset+i,updated_at:now.toISOString()}};});
  await tx.ingestEventRecord.createMany({data:events});const last=events.at(-1);await tx.ingestJob.update({where:{id:row.id},data:{status:'parsing',lastEventSeq:last.seq,stateVersion:last.stateVersion,snapshotJson:last.snapshotJson}});return last.seq.toString();
 });
 const pressureSamples=[];
 for(const variant of ['count','bytes']){
  phase=variant+'-pressure';console.log(JSON.stringify({phase}));const started=performance.now(),before=await checkpoint(page,second.id),target=before.value.cursor.replace(/:\d+$/,':'+(BigInt(before.value.cursor.split(':')[2])+1n));
  await page.evaluate(({target,id})=>{
   window.blocked=false;window.pressureClosed=false;window.blockOnce=true;window.pressureReceived=0;
   const source=window.probeStreams.filter(s=>s.url.includes(id)&&s.readyState!==2).at(-1);if(!source)throw new Error('NO_ACTIVE_SOURCE');
   const receivedBefore=source.probeReceived;const close=source.close.bind(source);source.close=()=>{window.pressureClosed=true;window.receivedAtClose=source.probeReceived-receivedBefore;return close();};
   const encrypt=SubtleCrypto.prototype.encrypt.bind(crypto.subtle);crypto.subtle.encrypt=async(...args)=>{let fields;try{fields=JSON.parse(new TextDecoder().decode(args[0]?.additionalData));}catch{}if(window.blockOnce&&fields?.[0]==='nomad-ingest-checkpoint-v1'&&fields[4]===target){window.blockOnce=false;window.blocked=true;await new Promise(resolve=>{window.releasePressure=resolve;});}return encrypt(...args);};
  },{target,id:second.id});
  if(variant==='bytes')paddedJob=second.id;
  await burst(1,1);await page.waitForFunction(()=>window.blocked,{polling:50,timeout:8000});
  if(variant==='count')duplicateJob=second.id;
  const restartIndex=requests.length,head=await burst(variant==='count'?5:6,2);
  await page.waitForFunction(()=>window.pressureClosed,{polling:50,timeout:8000});
  const frames=await page.evaluate(()=>window.receivedAtClose);assert.ok(variant==='count'?frames>=65:frames>=5&&frames<64,variant+' received '+frames);
  assert.equal((await checkpoint(page,second.id)).value.cursor,before.value.cursor);
  duplicateJob=undefined;paddedJob=undefined;await page.evaluate(()=>window.releasePressure());
  await until(async()=>(await checkpoint(page,second.id)).value?.cursor.endsWith(':'+head)===true,20000);
  assert.equal(requests.slice(restartIndex).find(r=>r.path===`/ingest/${second.id}/events`)?.cursor,target);
  checks.push(variant+'-overflow-with-real-pg-sse-idb-preserves-active-save-and-replays-remaining-events');pressureSamples.push({variant,repeat,outcome:'passed',receivedFramesAtClose:frames,elapsedMs:performance.now()-started});
 }
 phase='actual-app-two-windows-late-commit';
 const tabUrl=origin+'/?proof-window='+randomUUID(),cdp=await browser.target().createCDPSession();await cdp.send('Target.createTarget',{url:tabUrl,newWindow:true});
 const targetTab=await browser.waitForTarget(target=>target.url()===tabUrl),other=await targetTab.page();await other.waitForSelector('textarea[aria-label="统一输入"]');
 assert.equal(await page.evaluate(()=>document.visibilityState),'visible');assert.equal(await other.evaluate(()=>document.visibilityState),'visible');
 const beforeTwin=await checkpoint(page,second.id),twinCursor=beforeTwin.value.cursor.replace(/:\d+$/,':'+(BigInt(beforeTwin.value.cursor.split(':')[2])+1n));
 await page.evaluate(target=>{window.twinBlocked=false;const encrypt=SubtleCrypto.prototype.encrypt.bind(crypto.subtle);crypto.subtle.encrypt=async(...args)=>{let fields;try{fields=JSON.parse(new TextDecoder().decode(args[0]?.additionalData));}catch{}if(fields?.[0]==='nomad-ingest-checkpoint-v1'&&fields[4]===target){window.twinBlocked=true;await new Promise(resolve=>{window.releaseTwin=resolve;});}return encrypt(...args);};},twinCursor);
 await until(()=>requests.filter(r=>r.path===`/ingest/${second.id}/events`).length>=2);
 await appendIngestEvent(second.id,{state:'parsing',parsed_count:90},1);await page.waitForFunction(()=>window.twinBlocked,{polling:50,timeout:10000});
 await until(async()=>(await checkpoint(other,second.id)).value?.cursor===twinCursor,8000);await page.evaluate(()=>window.releaseTwin());await sleep(400);
 assert.equal((await checkpoint(page,second.id)).value.cursor,twinCursor);await other.close();await cdp.detach();
 checks.push('two-visible-app-windows-share-real-idb-late-encryption-cannot-overwrite-other-window-committed-pg-event');
 assert.ok(duplicateFrames>0);assert.ok(paddedFrames>=5);assert.deepEqual(pageErrors,[]);
 for(const [path,hash] of Object.entries(hashes))assert.equal(createHash('sha256').update(await readFile(resolve(root,path))).digest('hex'),hash);
 const report={result:'passed',measurementVersion:'nomad.recovery.pressure.v1',workload:'WL-RECOVERY',mode:'fixture',repeat,clockId,checks,pressureSamples,postgresVersion:pgVersion,actualPg:true,actualSse:true,actualIndexedDb:true,actualApp:true,duplicateFrameFaultInjection:duplicateFrames,paddedFrameFaultInjection:paddedFrames,realProviderCalls:0,newIngestPosts:requests.filter(r=>r.method==='POST'&&/^\/ingest\/(xhs|start)$/.test(r.path)).length,sourceSha256:hashes};
 await writeFile(resolve(output,`pressure-repeat-${repeat}.json`),JSON.stringify(report,null,2));console.log(JSON.stringify({result:'passed',checks:checks.length,duplicateFrames,paddedFrames}));

}catch(error){console.log(JSON.stringify({result:'failed',phase,errorCode:typeof error?.code==='string'?error.code:'PROBE_FAILURE',errorType:error?.name,message:error instanceof assert.AssertionError||error?.name==='TimeoutError'?error.message:undefined,duplicateFrames,paddedFrames}));process.exitCode=1;}
finally{await browser?.close();vite?.kill('SIGTERM');await app?.close();await db.$disconnect();await getPrisma()?.$disconnect();}
