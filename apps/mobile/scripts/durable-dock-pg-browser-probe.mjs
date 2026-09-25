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
const root=resolve(fileURLToPath(new URL('../../..',import.meta.url))),origin='http://127.0.0.1:5193',audience='https://nomad.example';
const output=resolve(root,'_bmad-output/implementation-artifacts/evidence/story-1-7-client-2026-09-19');await mkdir(output,{recursive:true});
const sourceFiles=['apps/mobile/src/App.tsx','apps/mobile/src/home/api.ts','apps/mobile/src/home/durable-watch.ts','apps/mobile/src/auth/ordered-stream.ts','apps/mobile/src/home/dock-controller.ts','apps/mobile/src/home/dock-model.ts','apps/mobile/src/home/operation-journal.ts','apps/mobile/src/home/ingest-checkpoint-store.ts','apps/mobile/src/home/ingest-protocol.ts','apps/mobile/src/home/HomeImportDock.tsx'];
const hashes=Object.fromEntries(await Promise.all(sourceFiles.map(async path=>[path,createHash('sha256').update(await readFile(resolve(root,path))).digest('hex')])));
const db=new PrismaClient(),ownerA=randomUUID(),ownerB=randomUUID(),sessions=new Map(),requests=[],checks=[];let selectedOwner=ownerA,browser,vite,phase='setup',app;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(test,timeout=20000)=>{const end=Date.now()+timeout;while(!await test()){if(Date.now()>end)throw new Error('PROBE_TIMEOUT');await sleep(50);}};
const identity=async(userId)=>{const secret=newCredential(),binding=randomUUID().replaceAll('-','')+randomUUID().replaceAll('-','');await db.authBrowser.create({data:{bindingHash:binding,sessionGeneration:1}});const session=await db.session.create({data:{userId,transport:'native',audience,credentialHash:nativeCredentialHash(secret,audience),authVersion:0,browserBindingHash:binding,browserGeneration:1,expiresAt:new Date(Date.now()+3600000)}});sessions.set(userId,{secret,id:session.id});};
const profile=await mkdtemp('/tmp/nomad-durable-dock-pg-');let pageErrors=[];
async function newPage(){
 const page=await browser.newPage();await page.setViewport({width:390,height:844,deviceScaleFactor:1});page.on('pageerror',error=>pageErrors.push(error.message));await page.setRequestInterception(true);
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
  const query=new URL(req.url,'http://local.test').searchParams,supplied=req.headers['x-auth-user-id']??query.get('auth_user_id');const owner=typeof supplied==='string'&&sessions.has(supplied)?supplied:selectedOwner,session=sessions.get(owner);
  requests.push({method:req.method,path:req.url.split('?')[0],owner,cursor:query.get('last_event_id'),at:performance.now()});
  req.raw.headers.authorization=`Bearer ${session.secret}`;req.raw.headers['x-nomad-auth-audience']=audience;req.raw.headers['x-forwarded-proto']='https';delete req.raw.headers.origin;delete req.raw.headers.cookie;
  if(!supplied){req.raw.headers['x-auth-user-id']=owner;req.raw.headers['x-auth-session-id']=session.id;}
 });
 await app.register(cookie);await app.register(errors);await app.register(authPlugin,{service});await app.register(authRoutes,{service});await app.register(ingestRoutes);await app.register(homeRoutes);await app.register(libraryRoutes);await app.listen({host:'127.0.0.1',port:0});
 const backend=app.server.address();assert.ok(backend&&typeof backend!=='string');const nonce=randomUUID(),configPath=resolve(await mkdtemp('/tmp/nomad-client-pg-vite-'),'config.mjs');
 await writeFile(configPath,`import base from ${JSON.stringify(resolve(root,'apps/mobile/vite.config.ts'))};export default {...base,root:${JSON.stringify(resolve(root,'apps/mobile'))},server:{proxy:{'/api':{target:'http://127.0.0.1:${backend.port}',rewrite:path=>path.replace(/^\\/api/,'')}}},plugins:[...base.plugins,{name:'client-proof',configureServer(server){server.middlewares.use((req,res,next)=>{if(req.url==='/__client_probe_identity'){res.end(${JSON.stringify(nonce)});return;}if(req.url==='/__probe_blank'){res.setHeader('Content-Type','text/html');res.end('<html><body>Seed accepted synthetic records</body></html>');return;}next();});}}]};`);
 vite=spawn(process.execPath,['node_modules/vite/bin/vite.js','--config',configPath,'--host','127.0.0.1','--port','5193','--strictPort'],{cwd:resolve(root,'apps/mobile'),env:{...process.env,VITE_API_BASE_URL:`${origin}/api`},stdio:'ignore'});
 await until(async()=>{if(vite.exitCode!==null)throw new Error('owned Vite exited');try{return await(await fetch(origin+'/__client_probe_identity')).text()===nonce;}catch{return false;}});
 browser=await launch();let page=await newPage();await page.goto(origin+'/__probe_blank');const first=await seed(page,'真实PG恢复·合成A');await page.goto(origin);await page.waitForSelector('textarea[aria-label="统一输入"]');
 phase='bootstrap';await until(async()=>(await checkpoint(page,first.id)).value?.cursor.endsWith(':2')===true);
 assert.ok(requests.some(r=>r.path===`/ingest/${first.id}/recovery`));assert.equal(requests.filter(r=>r.method==='POST'&&/^\/ingest\/(xhs|start)$/.test(r.path)).length,0);checks.push('actual-app-confirms-pg-session-and-bootstraps-original-accepted-job-without-post');
 phase='received-before-commit-kill';
 const before=await checkpoint(page,first.id),target=before.value.cursor.replace(/:2$/,':3');
 await page.evaluate(cursor=>{window.blockCursor=cursor;window.encryptionBlocked=false;const encrypt=SubtleCrypto.prototype.encrypt.bind(crypto.subtle);crypto.subtle.encrypt=async(...args)=>{const aad=args[0]?.additionalData;let fields;try{fields=JSON.parse(new TextDecoder().decode(aad));}catch{}if(fields?.[0]==='nomad-ingest-checkpoint-v1'&&fields[4]===window.blockCursor){window.encryptionBlocked=true;await new Promise(()=>{});}return encrypt(...args);};},target);
 await appendIngestEvent(first.id,{state:'parsing',sub_stage:'asr',parsed_count:1},1);await page.waitForFunction(()=>window.encryptionBlocked,{polling:50,timeout:10000});assert.equal((await checkpoint(page,first.id)).value.cursor,before.value.cursor);await crash();
 await appendIngestEvent(first.id,{state:'parsing',sub_stage:'multimodal',parsed_count:2},1);const resumeIndex=requests.length;
 browser=await launch();page=await newPage();await page.goto(origin);await page.waitForSelector('textarea[aria-label="统一输入"]');await until(async()=>(await checkpoint(page,first.id)).value?.cursor.endsWith(':4')===true);
 const reopened=requests.slice(resumeIndex).filter(r=>r.path===`/ingest/${first.id}/events`);assert.ok(reopened.length);assert.equal(reopened[0].cursor,before.value.cursor);checks.push('browser-sigkill-before-checkpoint-commit-replays-from-saved-cursor-despite-newer-get-head');
 phase='completion-fifo-visible-time';
 await appendIngestEvent(first.id,{state:'storing'},1);const current=await getOrHydrateJob(first.id);await persistIngestOutput({job:current,post:{title:'真实PG恢复·已保存',text:'Synthetic retained result',media:[{url:first.sourceUrl+'#fixture',kind:'image'}]},assets:[{kind:'image',cosKey:'synthetic/client-proof'}],candidates:[],timeEvidence:[]});await appendIngestEvent(first.id,{state:'done',stored_count:1},1);
 await page.waitForSelector('.dock-completion');await until(async()=>(await checkpoint(page,first.id)).value?.snapshot.state==='done');await page.screenshot({path:resolve(output,'completed-before-background.png')});await sleep(4100);
 await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await sleep(3000);assert.ok(await page.$('.dock-completion'));
 const resumedAt=performance.now();await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));await page.waitForFunction(()=>document.documentElement.dataset.authChecking==='false',{polling:50});await page.waitForFunction(()=>!document.querySelector('.dock-completion'),{polling:50,timeout:9000});const remainder=performance.now()-resumedAt;assert.ok(remainder>=3500&&remainder<=8000,`remaining visible window ${remainder}`);
 await until(async()=>(await checkpoint(page,first.id)).value?.observedDoneAttempt===1);checks.push('four-visible-seconds-background-pause-resumes-remaining-window-and-persists-noteDone');
 phase='owner-change-and-return';
 const second=await seed(page,'仅A可见·活动任务');await page.reload();await page.waitForSelector('textarea[aria-label="统一输入"]');await until(async()=>(await checkpoint(page,second.id)).value?.cursor.endsWith(':2')===true);assert.equal(await page.$('.dock-completion'),null);
 selectedOwner=ownerB;await page.evaluate(async()=>{const auth=await import('/src/auth/session-context.ts');auth.markChecking();});await page.waitForFunction(async owner=>{const auth=await import('/src/auth/session-context.ts');return auth.getAuthSnapshot().identity?.ownerId===owner&&auth.getAuthSnapshot().phase==='authenticated';},{polling:50},ownerB);
 await appendIngestEvent(second.id,{state:'parsing',source_title:'仅A可见·迟到事实'},1);await sleep(900);assert.equal((await checkpoint(page,second.id)).value.cursor.endsWith(':2'),true);const body=await page.evaluate(()=>document.body.innerText);assert.ok(!body.includes('仅A可见'));assert.ok(!body.includes('真实PG恢复·已保存'));await page.screenshot({path:resolve(output,'owner-b-isolation.png')});
 selectedOwner=ownerA;const returnIndex=requests.length;await page.evaluate(async()=>{const auth=await import('/src/auth/session-context.ts');auth.markChecking();});await until(async()=>(await checkpoint(page,second.id)).value?.cursor.endsWith(':3')===true);assert.equal(await page.$('.dock-completion'),null);
 assert.ok(requests.slice(returnIndex).some(r=>r.path===`/ingest/${second.id}/events`&&r.cursor?.endsWith(':2')));checks.push('a-to-b-to-a-erases-private-ui-stops-old-stream-and-restores-each-job-checkpoint');
 phase='new-process-completed-window-suppressed';await browser.close();browser=await launch();page=await newPage();await page.goto(origin);await page.waitForSelector('textarea[aria-label="统一输入"]');await until(async()=>(await checkpoint(page,second.id)).value?.cursor.endsWith(':3')===true);await sleep(1200);assert.equal(await page.$('.dock-completion'),null);assert.equal((await checkpoint(page,first.id)).value.observedDoneAttempt,1);checks.push('third-process-restores-completed-and-active-jobs-without-replaying-finished-window');
 phase='two-active-jobs-fair-replay';
 const third=await seed(page,'后到任务先完成');await page.reload();await page.waitForSelector('textarea[aria-label="统一输入"]');
 await until(async()=>(await checkpoint(page,third.id)).value?.cursor.endsWith(':2')===true,12000);
 assert.equal((await checkpoint(page,second.id)).value.snapshot.state,'parsing');
 await appendIngestEvent(third.id,{state:'failed',error_code:'SYNTHETIC_FAILURE',retriable:true},1);
 await until(async()=>(await checkpoint(page,third.id)).value?.snapshot.state==='failed',12000);
 assert.equal((await checkpoint(page,second.id)).value.snapshot.state,'parsing');
 checks.push('second-running-job-does-not-starve-later-terminal-job-independent-durable-ack');
 assert.equal(requests.filter(r=>r.method==='POST'&&/^\/ingest\/(xhs|start)$/.test(r.path)).length,0);assert.equal(await db.ingestJob.count({where:{userId:ownerA}}),3);
 const finalStart=(await db.$queryRaw`SELECT pg_postmaster_start_time() AS started`)[0].started.toISOString();assert.equal(finalStart,initialStart);assert.deepEqual(pageErrors,[]);
 for(const [path,hash] of Object.entries(hashes))assert.equal(createHash('sha256').update(await readFile(resolve(root,path))).digest('hex'),hash,'runtime source changed during proof');
 const report={result:'passed',checks,postgresVersion:pgVersion,actualPg:true,actualSse:true,actualIndexedDb:true,actualApp:true,browserProcesses:3,browserSigkills:1,realProviderCalls:0,newIngestPosts:0,completionRemainderMs:remainder,authentication:'explicit-local-credential-routing-fixture-with-actual-PG-session-and-me-route',tlsVerified:false,nativeDeviceVerified:false,sourceSha256:hashes};await writeFile(resolve(output,'pg-browser.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({result:'passed',checks:checks.length,output,postgresVersion:pgVersion}));
}catch(error){console.log(JSON.stringify({result:'failed',phase,errorCode:typeof error?.code==='string'?error.code:'PROBE_FAILURE',errorType:error?.name,message:error instanceof assert.AssertionError?error.message:undefined}));process.exitCode=1;}
finally{await browser?.close();vite?.kill('SIGTERM');await app?.close();await db.$disconnect();await getPrisma()?.$disconnect();}
