import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {test} from 'node:test';
import {IngestWorker,type IngestWorkerDependencies} from './worker.js';
import {resolveIngestExecutionPolicy} from './execution-policy.js';
import {actorContext} from '../auth/owner.js';
const policy=resolveIngestExecutionPolicy({INGEST_WORKER_MODE:'enabled',INGEST_RECOVERY_ISOLATED:'false',INGEST_LEASE_MS:'1000',INGEST_POLL_MS:'100',INGEST_CONCURRENCY:'2'});
const lease=()=>({jobId:randomUUID(),ownerId:randomUUID(),authVersion:0,attempt:1,workerId:randomUUID(),fence:1n});
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
async function until(check:()=>boolean){const end=Date.now()+2000;while(!check()){if(Date.now()>end)throw new Error('condition timed out');await sleep(5);}}
const base=():IngestWorkerDependencies=>({claim:async()=>null,execute:async()=>{},renew:async()=>{},release:async()=>{}});
test('isolated worker never calls claim, even when repeatedly woken',async()=>{
 let claims=0;const worker=new IngestWorker({...policy,isolated:true},{...base(),claim:async()=>{claims++;return null;}});
 worker.start();worker.wake();await sleep(25);await worker.stop();assert.equal(claims,0);
});
test('claim and execution stay bounded; stop aborts non-cooperative work and releases each token',async()=>{
 const queue=[lease(),lease(),lease()];let activeClaims=0,maxClaims=0,started=0,released=0;const signals:AbortSignal[]=[];
 const worker=new IngestWorker(policy,{...base(),claim:async()=>{activeClaims++;maxClaims=Math.max(maxClaims,activeClaims);await sleep(5);activeClaims--;const item=queue.shift();return item?{lease:item,failures:1}:null;},
  execute:async(item,signal)=>{started++;signals.push(signal);assert.equal(actorContext.getStore()?.ownerId,item.ownerId);await new Promise(()=>{});},release:async(_lease,delay)=>{assert.equal(delay,0);released++;}});
 worker.start();for(let i=0;i<20;i++)worker.wake();await until(()=>started===2);await sleep(30);
 assert.equal(queue.length,1);assert.equal(maxClaims,1);await worker.stop();assert.equal(released,2);assert.ok(signals.every(signal=>signal.aborted));
 const count=started;await sleep(120);assert.equal(started,count);
});
test('a claim completing during stop is released without dispatch',async()=>{
 let finish!:(value:any)=>void,entered=false,started=0,released=0;
 const worker=new IngestWorker(policy,{...base(),claim:()=>{entered=true;return new Promise(r=>{finish=r;});},execute:async()=>{started++;},release:async()=>{released++;}});
 worker.start();await until(()=>entered);const stopped=worker.stop();finish({lease:lease(),failures:1});await stopped;assert.equal(started,0);assert.equal(released,1);
});
test('failed renewal aborts execution and relinquishes only its token with bounded backoff',async()=>{
 const item=lease();let taken=false,aborted=false,released=0,delay=0;
 const worker=new IngestWorker(policy,{...base(),claim:async()=>{if(taken)return null;taken=true;return {lease:item,failures:4};},
  execute:async(_lease,signal)=>{signal.addEventListener('abort',()=>{aborted=true;});await new Promise(()=>{});},renew:async()=>{throw new Error('synthetic database outage');},release:async(token,ms)=>{assert.deepEqual(token,item);released++;delay=ms;}});
 worker.start();await until(()=>released===1);assert.equal(aborted,true);assert.equal(delay,8000);await worker.stop();
});
