/** Real IndexedDB/WebCrypto; synthetic facts only, no backend or provider traffic. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
const puppeteer=createRequire(new URL('../../server/package.json',import.meta.url))('puppeteer');
const root=resolve(import.meta.dirname,'../../..'),origin='http://127.0.0.1:5192',profile=await mkdtemp('/tmp/nomad-checkpoint-browser-');
const name=`nomad-checkpoint-proof-${randomUUID()}`,nonce=randomUUID(),output=resolve(root,'_bmad-output/implementation-artifacts/evidence/story-1-7-checkpoint-2026-09-19');
await mkdir(output,{recursive:true});
const sources=['apps/mobile/src/home/operation-journal.ts','apps/mobile/src/home/ingest-checkpoint-store.ts','apps/mobile/src/home/ingest-protocol.ts'];const hashes=Object.fromEntries(await Promise.all(sources.map(async path=>[path,createHash('sha256').update(await readFile(resolve(root,path))).digest('hex')])));
const config=resolve(await mkdtemp('/tmp/nomad-checkpoint-vite-'),'config.mjs');await writeFile(config,`export default {root:${JSON.stringify(resolve(root,'apps/mobile'))},plugins:[{name:'checkpoint-proof-identity',configureServer(server){server.middlewares.use((req,res,next)=>{if(req.url==='/__checkpoint_probe_identity'){res.end(${JSON.stringify(nonce)});return;}next();});}}]};`);
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--config',config,'--host','127.0.0.1','--port','5192','--strictPort'],{cwd:resolve(root,'apps/mobile'),stdio:'ignore'});
let browser,phase='startup';const checks=[];
const launch=()=>puppeteer.launch({headless:true,userDataDir:profile,args:['--no-sandbox','--disable-setuid-sandbox']});
async function page(){
 const p=await browser.newPage();await p.setRequestInterception(true);p.on('request',request=>{const url=new URL(request.url());if(url.origin!==origin&&!['data:','about:'].includes(url.protocol))return request.abort();if(url.href===origin+'/')return request.respond({status:200,contentType:'text/html',body:'<html><body>Isolated checkpoint fixture</body></html>'});return request.continue();});await p.goto(origin);
 await p.evaluate(async dbName=>{
  const module=await import('/src/home/operation-journal.ts');window.clock=1800000000000;window.valid=true;window.realEncrypt=SubtleCrypto.prototype.encrypt.bind(crypto.subtle);window.realDecrypt=SubtleCrypto.prototype.decrypt.bind(crypto.subtle);
  window.scope=(ownerId='synthetic-owner-a')=>({ownerId,valid:()=>window.valid});window.journal=module.createOperationJournal(dbName,()=>window.clock);window.dbName=dbName;
  window.job='ing_11111111-1111-4111-8111-111111111111';window.ns='22222222-2222-4222-8222-222222222222';
  window.cursor=(seq,ns=window.ns)=>`i1:${ns}:${seq}`;
  window.snapshot=(seq,state='parsing',extra={},ns=window.ns)=>({ingest_id:window.job,head_cursor:window.cursor(seq,ns),attempt:1,state_version:seq-1,state,sub_stage:state==='parsing'?'asr':null,source_title:'私人标题-SYNTHETIC',result:null,partial:false,retriable:state==='failed',error_code:null,updated_at:'2026-09-19T00:00:00.000Z',actions:{retry:state==='failed',view:false},...extra});
  window.makeEvent=(seq,state='parsing',extra={},ns=window.ns)=>{const snapshot=window.snapshot(seq,state,extra,ns);return {schema_version:1,kind:'fact',seq:String(seq),cursor:window.cursor(seq,ns),ingest_id:window.job,attempt:snapshot.attempt,retry:snapshot.attempt-1,state_version:snapshot.state_version,state,stage:state,sub_stage:snapshot.sub_stage??undefined,trace_id:window.job.slice(4),occurred_at:snapshot.updated_at,ts:Date.parse(snapshot.updated_at),snapshot};};
  window.resync=(seq,state='parsing',extra={},ns=window.ns)=>({mode:'resync',reason:'checkpoint_missing',ingest_id:window.job,cursor:window.cursor(seq,ns),head_cursor:window.cursor(seq,ns),head_seq:String(seq),replay_floor:'0',snapshot:window.snapshot(seq,state,extra,ns)});
  window.raw=(stores,mode,work)=>new Promise((resolve,reject)=>{const open=indexedDB.open(dbName);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const db=open.result,tx=db.transaction(stores,mode);let result;work(tx,value=>{result=value;});tx.oncomplete=()=>{db.close();resolve(result);};tx.onabort=tx.onerror=()=>{db.close();reject(tx.error);};};});
  window.rawCheckpoint=()=>window.raw(['checkpoints'],'readonly',(tx,done)=>{const read=tx.objectStore('checkpoints').get(['synthetic-owner-a',window.job]);read.onsuccess=()=>done(read.result);});
 },name);return p;
}
async function crash(){const child=browser.process(),exit=once(child,'exit');child.kill('SIGKILL');await exit;browser=undefined;}
try{
 let ready=false;for(let i=0;i<50;i++){if(server.exitCode!==null)throw new Error('owned server exited');try{if(await(await fetch(origin+'/__checkpoint_probe_identity')).text()===nonce){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}assert.ok(ready);
 browser=await launch();const a=await page();
 phase='v1-upgrade';
 const legacy=await a.evaluate(async()=>{
  const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']),batch=crypto.randomUUID(),first=crypto.randomUUID(),second=crypto.randomUUID(),iv=crypto.getRandomValues(new Uint8Array(12));
  const bytes=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(JSON.stringify(['nomad-input-operation-v1','synthetic-owner-a',second,'start']))},key,new TextEncoder().encode(JSON.stringify({url:'https://xhslink.com/legacy-private-input'})));
  await new Promise((resolve,reject)=>{const open=indexedDB.open(window.dbName,1);open.onupgradeneeded=()=>{const db=open.result,ops=db.createObjectStore('operations',{keyPath:'operationId'});for(const index of ['ownerId','batchId','entryId','jobId'])ops.createIndex(index,index);db.createObjectStore('claims',{keyPath:'inputId'});db.createObjectStore('keys',{keyPath:'ownerId'});};open.onerror=()=>reject(open.error);open.onsuccess=()=>{const db=open.result,tx=db.transaction(['operations','keys','claims'],'readwrite');const base={version:1,ownerId:'synthetic-owner-a',batchId:batch,total:2,kind:'start',createdAt:window.clock,expiresAt:window.clock+7*86400000,payloadExpiresAt:window.clock+86400000};tx.objectStore('operations').put({...base,operationId:first,entryId:first,position:1,phase:'accepted',jobId:window.job,payload:null});tx.objectStore('operations').put({...base,operationId:second,entryId:second,position:2,phase:'unconfirmed',payload:{iv,bytes}});tx.objectStore('keys').put({ownerId:'synthetic-owner-a',key,expiresAt:window.clock+7*86400000});tx.objectStore('claims').put({inputId:'a'.repeat(64),ownerId:'synthetic-owner-a',batchId:batch,expiresAt:window.clock+7*86400000});tx.oncomplete=()=>{db.close();resolve();};tx.onabort=()=>reject(tx.error);};});
  const rows=await window.journal.list(window.scope()),payload=await window.journal.payload(window.scope(),second);
  return {rows:rows.length,payload,claim:await window.journal.claimed('a'.repeat(64)),stores:await window.raw(['operations'],'readonly',(tx,done)=>done({version:tx.db.version,names:[...tx.db.objectStoreNames]}))};
 });
 assert.equal(legacy.rows,2);assert.deepEqual(legacy.payload,{url:'https://xhslink.com/legacy-private-input'});assert.equal(legacy.claim,true);assert.equal(legacy.stores.version,2);assert.deepEqual(legacy.stores.names,['checkpoints','claims','keys','operations']);checks.push('v1-upgrade-preserves-operations-claims-nonextractable-key-and-decryptable-payload');
 const b=await page();
 phase='encrypted-checkpoint';
 const initial=await a.evaluate(async()=>{const before=await window.journal.readCheckpoint(window.scope(),window.job);const written=await window.journal.commitResync(window.scope(),window.job,window.resync(1,'created'),before.revision);return {before,written,serialized:JSON.stringify(await window.rawCheckpoint())};});
 assert.equal(initial.before.value,null);assert.equal(initial.written.value.cursor,`i1:22222222-2222-4222-8222-222222222222:1`);assert.ok(!initial.serialized.includes('私人标题'));checks.push('snapshot-and-cursor-encrypted-in-one-durable-checkpoint');
 phase='cross-tab-monotonic';
 const expected=initial.written.revision;
 await b.evaluate(async()=>{await window.journal.commitEvent(window.scope(),window.job,window.makeEvent(2));await window.journal.commitEvent(window.scope(),window.job,window.makeEvent(3));});
 const monotonic=await a.evaluate(async expected=>{
  const stale=await window.journal.commitResync(window.scope(),window.job,window.resync(1,'created'),expected);
  const duplicate=await window.journal.commitEvent(window.scope(),window.job,window.makeEvent(2));let gap=false,regression=false,owner=false;
  try{await window.journal.commitEvent(window.scope(),window.job,window.makeEvent(5));}catch{gap=true;}
  try{await window.journal.commitEvent(window.scope(),window.job,window.makeEvent(4,'parsing',{state_version:1}));}catch{regression=true;}
  try{await window.journal.commitResync(window.scope('synthetic-owner-b'),window.job,window.resync(1,'created'),null);}catch{owner=true;}
  return {stale:stale.value.cursor,duplicate:duplicate.value.cursor,gap,regression,owner,foreign:await window.journal.readCheckpoint(window.scope('synthetic-owner-b'),window.job)};
 },expected);
 assert.equal(monotonic.stale.endsWith(':3'),true);assert.equal(monotonic.duplicate.endsWith(':3'),true);assert.equal(monotonic.gap,true);assert.equal(monotonic.regression,true);assert.equal(monotonic.owner,true);assert.equal(monotonic.foreign.value,null);checks.push('cross-tab-late-resync-low-seq-gap-and-low-version-high-seq-cannot-overwrite');checks.push('owner-isolation-and-unbound-job-write-denial');
 phase='cross-attempt-noteDone-and-namespace';
 const attempts=await a.evaluate(async()=>{
  await window.journal.commitEvent(window.scope(),window.job,window.makeEvent(4,'failed'));
  await window.journal.noteDone(window.scope(),window.job,1);
  await window.journal.commitEvent(window.scope(),window.job,window.makeEvent(5,'created',{attempt:2}));
  const late=await window.journal.commitEvent(window.scope(),window.job,window.makeEvent(4,'failed'));let oldHigh=false;
  try{await window.journal.commitEvent(window.scope(),window.job,window.makeEvent(6,'parsing',{attempt:1}));}catch{oldHigh=true;}
  await window.journal.commitEvent(window.scope(),window.job,window.makeEvent(6,'parsing',{attempt:2}));await window.journal.commitEvent(window.scope(),window.job,window.makeEvent(7,'storing',{attempt:2}));
  await window.journal.commitEvent(window.scope(),window.job,window.makeEvent(8,'done',{attempt:2,stored_count:1,result:{inspiration_id:'synthetic-result',locate_status:'pending',asset_count:1,city_name:null},actions:{retry:false,view:true}}));
  return {late:late.value.cursor,oldHigh,stored:await window.journal.readCheckpoint(window.scope(),window.job)};
 });
 assert.equal(attempts.late.endsWith(':5'),true);assert.equal(attempts.oldHigh,true);assert.equal(attempts.stored.value.snapshot.attempt,2);assert.equal(attempts.stored.value.observedDoneAttempt,1);checks.push('failed-to-new-attempt-keeps-contiguous-seq-and-rejects-late-high-seq-old-attempt');
 const doneRef=attempts.stored;
 await Promise.all([a.evaluate(()=>window.journal.noteDone(window.scope(),window.job,2)),b.evaluate(ref=>window.journal.commitResync(window.scope(),window.job,window.resync(8,'done',{attempt:2,stored_count:1,result:{inspiration_id:'synthetic-result',locate_status:'pending',asset_count:1,city_name:null},actions:{retry:false,view:true}}),ref),doneRef.revision)]);
 const switched=await a.evaluate(async()=>{const old=await window.journal.readCheckpoint(window.scope(),window.job),nextNs='33333333-3333-4333-8333-333333333333';const next=await window.journal.commitResync(window.scope(),window.job,window.resync(1,'created',{},nextNs),old.revision);const late=await window.journal.commitResync(window.scope(),window.job,window.resync(8,'done',{attempt:2,stored_count:1,result:{inspiration_id:'synthetic-result',locate_status:'pending',asset_count:1,city_name:null},actions:{retry:false,view:true}}),old.revision);return {observed:old.value.observedDoneAttempt,next:next.value,late:late.value};});
 assert.equal(switched.observed,2);assert.equal(switched.next.observedDoneAttempt,2);assert.equal(switched.late.cursor,switched.next.cursor);checks.push('noteDone-max-survives-concurrent-resync-and-namespace-cas');
 await Promise.all([a,b].map(p=>p.evaluate(()=>{window.ns='33333333-3333-4333-8333-333333333333';})));
 phase='corrupt-repair';
 const corruption=await a.evaluate(async()=>{
  const original=await window.rawCheckpoint();const flip={...original,payload:{...original.payload,bytes:original.payload.bytes.slice(0)}};new Uint8Array(flip.payload.bytes)[0]^=1;
  await window.raw(['checkpoints'],'readwrite',(tx)=>tx.objectStore('checkpoints').put(flip));
  let ordinaryDenied=false;try{await window.journal.commitEvent(window.scope(),window.job,window.makeEvent(2,'fetching'));}catch{ordinaryDenied=true;}
  const broken=await window.journal.readCheckpoint(window.scope(),window.job),fixed=await window.journal.commitResync(window.scope(),window.job,window.resync(1,'created'),broken.revision);
  await window.raw(['checkpoints'],'readwrite',tx=>tx.objectStore('checkpoints').put({...original,revision:'broken'}));
  const malformed=await window.journal.readCheckpoint(window.scope(),window.job),restored=await window.journal.commitResync(window.scope(),window.job,window.resync(1,'created'),malformed.revision);
  return {ordinaryDenied,broken:broken.corrupt,brokenValue:broken.value,fixed:fixed.value.cursor,malformed:malformed.corrupt,restored:restored.value.cursor,operations:(await window.journal.list(window.scope())).length};
 });
 assert.equal(corruption.ordinaryDenied,true);assert.equal(corruption.broken,true);assert.equal(corruption.brokenValue,null);assert.equal(corruption.malformed,true);assert.equal(corruption.fixed,corruption.restored);assert.equal(corruption.operations,2);checks.push('corrupt-cipher-and-malformed-checkpoint-require-explicit-revision-matched-resync');
 phase='authenticated-metadata-corruption';
 const poisoned=await a.evaluate(async()=>{
  const changes=[{stateVersion:42},{state:'parsing'},{cursor:window.cursor(77)},{attempt:3}];const results=[];
  for(const change of changes){
   const row=await window.rawCheckpoint();await window.raw(['checkpoints'],'readwrite',tx=>tx.objectStore('checkpoints').put({...row,...change}));
   let denied=false;try{await window.journal.commitEvent(window.scope(),window.job,window.makeEvent(2,'fetching'));}catch{denied=true;}
   const broken=await window.journal.readCheckpoint(window.scope(),window.job),restored=await window.journal.commitResync(window.scope(),window.job,window.resync(1,'created'),broken.revision);
   results.push({denied,corrupt:broken.corrupt,cursor:restored.value.cursor});
  }
  return results;
 });
 assert.ok(poisoned.every(value=>value.denied&&value.corrupt&&value.cursor.endsWith(':1')));checks.push('valid-shaped-aad-tampering-is-quarantined-and-cannot-be-overwritten-by-normal-event');
 phase='quarantine-cas-race';
 await a.evaluate(async()=>{
  const row=await window.rawCheckpoint();new Uint8Array(row.payload.bytes)[0]^=1;await window.raw(['checkpoints'],'readwrite',tx=>tx.objectStore('checkpoints').put(row));
  const decrypt=window.realDecrypt;let first=true;window.restoreDecrypt=()=>{crypto.subtle.decrypt=decrypt;};
  const gate=new Promise(resolve=>{window.releaseDecrypt=resolve;});window.decryptEntered=false;
  crypto.subtle.decrypt=async(...args)=>{if(first){first=false;window.decryptEntered=true;await gate;}return decrypt(...args);};
  window.pendingRead=window.journal.readCheckpoint(window.scope(),window.job);
 });
 await a.waitForFunction(()=>window.decryptEntered);
 const winner=await b.evaluate(async()=>{const broken=await window.journal.readCheckpoint(window.scope(),window.job);return window.journal.commitResync(window.scope(),window.job,window.resync(1,'created'),broken.revision);});
 const oldRead=await a.evaluate(async()=>{window.releaseDecrypt();try{return await window.pendingRead;}finally{window.restoreDecrypt();}});
 assert.equal(oldRead.corrupt,false);assert.equal(oldRead.revision,winner.revision);checks.push('late-corruption-quarantine-cannot-overwrite-another-tab-repaired-revision');
 phase='abort-and-identity-change';
 const aborted=await a.evaluate(async()=>{
  const before=await window.journal.readCheckpoint(window.scope(),window.job),put=IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put=function(...args){const request=put.apply(this,args);if(this.name==='checkpoints')this.transaction.abort();return request;};let failed=false;
  try{await window.journal.commitEvent(window.scope(),window.job,window.makeEvent(2,'fetching'));}catch{failed=true;}finally{IDBObjectStore.prototype.put=put;}
  const after=await window.journal.readCheckpoint(window.scope(),window.job),encrypt=window.realEncrypt;let entered,release;const gate=new Promise(r=>{release=r;}),ready=new Promise(r=>{entered=r;});
  crypto.subtle.encrypt=async(...args)=>{entered();await gate;return encrypt(...args);};const work=window.journal.commitEvent(window.scope(),window.job,window.makeEvent(2,'fetching'));await ready;window.valid=false;release();let changed='';try{await work;}catch(error){changed=error.code;}finally{crypto.subtle.encrypt=encrypt;window.valid=true;}
  return {failed,same:before.revision===after.revision,changed,cursor:(await window.journal.readCheckpoint(window.scope(),window.job)).value.cursor};
 });
 assert.equal(aborted.failed,true);assert.equal(aborted.same,true);assert.equal(aborted.changed,'JOURNAL_CONTEXT_CHANGED');assert.equal(aborted.cursor.endsWith(':1'),true);checks.push('transaction-abort-and-identity-change-do-not-acknowledge-received-event');
 phase='subscription-abort-in-transaction';
 const canceled=await a.evaluate(async()=>{
  const controller=new AbortController(),scope={...window.scope(),signal:controller.signal},before=await window.journal.readCheckpoint(window.scope(),window.job),put=IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put=function(...args){const request=put.apply(this,args);if(this.name==='checkpoints')queueMicrotask(()=>controller.abort());return request;};let code='';
  try{await window.journal.commitEvent(scope,window.job,window.makeEvent(2,'fetching'));}catch(error){code=error.code;}finally{IDBObjectStore.prototype.put=put;}
  const after=await window.journal.readCheckpoint(window.scope(),window.job);return {code,same:before.revision===after.revision};
 });
 assert.equal(canceled.code,'JOURNAL_CONTEXT_CHANGED');assert.equal(canceled.same,true);checks.push('subscription-abort-cancels-pending-idb-checkpoint-transaction');
 phase='kill-before-commit';
 await a.evaluate(()=>{window.trace=[];const transaction=IDBDatabase.prototype.transaction;IDBDatabase.prototype.transaction=function(...args){const tx=transaction.apply(this,args);window.trace.push('begin:'+String(args[0]));tx.addEventListener('complete',()=>window.trace.push('complete:'+String(args[0])));tx.addEventListener('abort',()=>window.trace.push('abort:'+String(args[0])));return tx;};const decrypt=window.realDecrypt;crypto.subtle.decrypt=async(...args)=>{window.trace.push('decrypt');const value=await decrypt(...args);window.trace.push('decrypted');return value;};const encrypt=window.realEncrypt;window.encryptionEntered=false;crypto.subtle.encrypt=async(...args)=>{window.encryptionEntered=true;await new Promise(()=>{});return encrypt(...args);};window.preCommitError='';void window.journal.commitEvent(window.scope(),window.job,window.makeEvent(2,'fetching')).catch(error=>{window.preCommitError=error.code??String(error);});});try{await a.waitForFunction(()=>window.encryptionEntered||window.preCommitError,{timeout:5000,polling:50});}catch{throw new Error(JSON.stringify(await a.evaluate(()=>({entered:window.encryptionEntered,error:window.preCommitError,valid:window.valid,visibility:document.visibilityState,trace:window.trace}))));}const preCommit=await a.evaluate(()=>({entered:window.encryptionEntered,error:window.preCommitError}));assert.equal(preCommit.entered,true,preCommit.error);await crash();
 browser=await launch();const second=await page();await second.evaluate(()=>{window.ns='33333333-3333-4333-8333-333333333333';});const beforeCommit=await second.evaluate(()=>window.journal.readCheckpoint(window.scope(),window.job));assert.equal(beforeCommit.value.cursor.endsWith(':1'),true);checks.push('real-browser-sigkill-after-receive-before-idb-commit-retains-old-ack');
 phase='kill-after-commit';
 await second.evaluate(()=>window.journal.commitEvent(window.scope(),window.job,window.makeEvent(2,'fetching')));await crash();
 browser=await launch();const third=await page();await third.evaluate(()=>{window.ns='33333333-3333-4333-8333-333333333333';});const afterCommit=await third.evaluate(()=>window.journal.readCheckpoint(window.scope(),window.job));assert.equal(afterCommit.value.cursor.endsWith(':2'),true);assert.equal(afterCommit.value.snapshot.state,'fetching');assert.equal(afterCommit.value.snapshot.source_title,'私人标题-SYNTHETIC');checks.push('real-browser-sigkill-after-commit-before-ui-restores-facts-and-ack-together');
 phase='capacity-and-expiry';
 const bounded=await third.evaluate(async()=>{
  await window.raw(['checkpoints'],'readwrite',tx=>{const store=tx.objectStore('checkpoints'),count=store.count();count.onsuccess=()=>{for(let i=0;i<2048-count.result;i++){const jobId=`ing_00000000-0000-4000-8000-${i.toString(16).padStart(12,'0')}`;store.put({version:1,ownerId:'capacity-fixture',jobId,revision:crypto.randomUUID(),expiresAt:window.clock+7*86400000,observedDoneAttempt:0,corrupt:true});}};});
  const target='ing_44444444-4444-4444-8444-444444444444',prepared=await window.journal.prepare(window.scope(),[{url:'https://xhslink.com/capacity'}]);await window.journal.mark(window.scope(),prepared.records[0].operationId,'accepted',target);
  const response={...window.resync(1,'created'),ingest_id:target,snapshot:{...window.snapshot(1,'created'),ingest_id:target}};let code='';try{await window.journal.commitResync(window.scope(),target,response,null);}catch(error){code=error.code;}
  const retained=(await window.journal.readCheckpoint(window.scope(),window.job)).value.cursor;
  window.clock+=8*86400000;const expired=await window.journal.readCheckpoint(window.scope(),window.job);const rows=await window.journal.list(window.scope());
  const counts=await window.raw(['checkpoints','keys','claims'],'readonly',(tx,done)=>{const values={};for(const name of ['checkpoints','keys','claims']){const request=tx.objectStore(name).count();request.onsuccess=()=>{values[name]=request.result;if(Object.keys(values).length===3)done(values);};}});
  return {code,retained,expired,operations:rows.length,counts};
 });
 assert.equal(bounded.code,'JOURNAL_CAPACITY');assert.equal(bounded.retained.endsWith(':2'),true);assert.equal(bounded.expired.value,null);assert.equal(bounded.operations,0);assert.deepEqual(bounded.counts,{checkpoints:0,keys:0,claims:0});checks.push('checkpoint-capacity-fails-closed-and-expired-cache-is-pruned');
 for(const [path,hash] of Object.entries(hashes))assert.equal(createHash('sha256').update(await readFile(resolve(root,path))).digest('hex'),hash,'source changed during probe');assert.equal(await(await fetch(origin+'/__checkpoint_probe_identity')).text(),nonce);
 const report={result:'passed',checks,actualIndexedDb:true,actualWebCrypto:true,browserProcesses:3,browserSigkills:2,serverRequests:0,sourceSha256:hashes,controllerIntegrationVerified:false,nativeDeviceVerified:false};await writeFile(resolve(output,'browser-core.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({result:'passed',checks:checks.length,output,browserProcesses:3}));
}catch(error){console.log(JSON.stringify({result:'failed',phase,error:error instanceof Error?error.message:String(error)}));process.exitCode=1;}
finally{await browser?.close();server.kill('SIGTERM');}
